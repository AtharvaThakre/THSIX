import { adminGraphQL } from './shopify-admin.js';

/**
 * One-at-a-time guard for creating the Shopify order of a Shiprocket order.
 *
 * The webhook, the success-page confirm and the reconcile job can all handle the same order
 * within seconds, and Shopify's order search (the `tag:sr-<id>` duplicate check) lags behind
 * new orders, so each could create its own copy. A shop metafield per Shiprocket order is the
 * lock: metafieldsSet with `compareDigest: null` only writes it if it doesn't exist yet, which
 * Shopify checks atomically. The value is the claim time, then the Shopify order name.
 *
 * If the lock can't be used at all (e.g. missing access), callers fall back to the other checks.
 */

const NAMESPACE = '$app:shiprocket_orders';
// A claim this old whose order never got created (worker died mid-way) can be taken over
const STALE_MS = 10 * 60 * 1000;

let shopIdPromise = null;
async function shopId() {
  shopIdPromise ??= adminGraphQL('{ shop { id } }')
    .then((res) => res?.data?.shop?.id || Promise.reject(new Error('no shop id')))
    .catch((err) => { shopIdPromise = null; throw err; });
  return shopIdPromise;
}

const keyFor = (orderId) => `sr-${orderId}`.slice(0, 64);

async function setMetafield(orderId, value, compareDigest) {
  const res = await adminGraphQL(
    `mutation ($m: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $m) { metafields { id } userErrors { field message code } }
    }`,
    { m: [{ ownerId: await shopId(), namespace: NAMESPACE, key: keyFor(orderId), type: 'single_line_text_field', value, compareDigest }] },
  );
  if (res?.errors?.length) {
    return { ok: false, conflict: false, error: res.errors.map((e) => e.message).join('; ') };
  }
  const errors = res?.data?.metafieldsSet?.userErrors || [];
  if (!errors.length && res?.data?.metafieldsSet) return { ok: true };
  const text = errors.map((e) => `${e.code || ''} ${e.message || ''}`).join('; ');
  return { ok: false, conflict: /digest|stale|concurren|already|exist|taken/i.test(text), error: text || 'no response' };
}

async function readMetafield(orderId) {
  const res = await adminGraphQL(
    'query ($ns: String!, $key: String!) { shop { metafield(namespace: $ns, key: $key) { value compareDigest } } }',
    { ns: NAMESPACE, key: keyFor(orderId) },
  );
  return res?.data?.shop?.metafield || null;
}

/**
 * @returns {Promise<
 *   {state: 'claimed'} |
 *   {state: 'exists', name: string} |
 *   {state: 'in_progress'} |
 *   {state: 'unavailable', error: string}
 * >}
 */
export async function claimOrder(orderId) {
  try {
    const first = await setMetafield(orderId, `claimed:${Date.now()}`, null);
    if (first.ok) return { state: 'claimed' };
    if (!first.conflict) return { state: 'unavailable', error: first.error };

    const current = await readMetafield(orderId);
    if (!current) return { state: 'unavailable', error: 'lock conflict but no lock found' };
    if (current.value.startsWith('#')) return { state: 'exists', name: current.value };

    const claimedAt = Number(current.value.split(':')[1]) || 0;
    if (Date.now() - claimedAt < STALE_MS) return { state: 'in_progress' };
    // Stale claim: take it over, again atomically (only if nobody else just did)
    const takeover = await setMetafield(orderId, `claimed:${Date.now()}`, current.compareDigest);
    return takeover.ok ? { state: 'claimed' } : { state: 'in_progress' };
  } catch (err) {
    return { state: 'unavailable', error: err.message };
  }
}

/** Record the created order's name, so later attempts see it at once (no search lag). */
export async function markOrderCreated(orderId, name) {
  try {
    const res = await setMetafield(orderId, String(name || '#created'), undefined);
    if (!res.ok) console.error('[order-lock] Could not record', orderId, res.error);
  } catch (err) {
    console.error('[order-lock] Could not record', orderId, err.message);
  }
}

/** Drop a claim whose order wasn't created, so the next attempt can retry straight away. */
export async function releaseOrder(orderId) {
  try {
    await adminGraphQL(
      `mutation ($m: [MetafieldIdentifierInput!]!) {
        metafieldsDelete(metafields: $m) { userErrors { message } }
      }`,
      { m: [{ ownerId: await shopId(), namespace: NAMESPACE, key: keyFor(orderId) }] },
    );
  } catch (err) {
    console.error('[order-lock] Could not release', orderId, err.message);
  }
}

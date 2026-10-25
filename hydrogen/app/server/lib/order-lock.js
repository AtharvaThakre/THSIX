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

/** Lock key for a Shiprocket order id. */
export const orderKey = (orderId) => `sr-${orderId}`.slice(0, 64);

/**
 * Lock key for an order's content (customer + items). Shiprocket can record one prepaid
 * payment as two orders with different ids a second apart, so the id alone can't catch it.
 */
export async function fingerprintKey(fingerprint) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprint));
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  return `fp-${hex.slice(0, 40)}`;
}

async function setMetafield(key, value, compareDigest) {
  const res = await adminGraphQL(
    `mutation ($m: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $m) { metafields { id } userErrors { field message code } }
    }`,
    { m: [{ ownerId: await shopId(), namespace: NAMESPACE, key, type: 'single_line_text_field', value, compareDigest }] },
  );
  if (res?.errors?.length) {
    return { ok: false, conflict: false, error: res.errors.map((e) => e.message).join('; ') };
  }
  const errors = res?.data?.metafieldsSet?.userErrors || [];
  if (!errors.length && res?.data?.metafieldsSet) return { ok: true };
  const text = errors.map((e) => `${e.code || ''} ${e.message || ''}`).join('; ');
  return { ok: false, conflict: /digest|stale|concurren|already|exist|taken/i.test(text), error: text || 'no response' };
}

async function readMetafield(key) {
  const res = await adminGraphQL(
    'query ($ns: String!, $key: String!) { shop { metafield(namespace: $ns, key: $key) { value compareDigest } } }',
    { ns: NAMESPACE, key },
  );
  return res?.data?.shop?.metafield || null;
}

/**
 * Claim `key`. Values: "claimed:<ms>" while creating, then "<order name>|<at>", where `at` is
 * when the order was placed. A created order matches another placed within `windowMs` of it
 * (forever for an order id; briefly for a content fingerprint, so a genuine repeat order by
 * the same customer still goes through, however late either one is processed).
 * @returns {Promise<
 *   {state: 'claimed'} |
 *   {state: 'exists', name: string} |
 *   {state: 'in_progress'} |
 *   {state: 'unavailable', error: string}
 * >}
 */
export async function claimOrder(key, { windowMs = Infinity, at = Date.now() } = {}) {
  try {
    const now = Date.now();
    const first = await setMetafield(key, `claimed:${now}`, null);
    if (first.ok) return { state: 'claimed' };
    if (!first.conflict) return { state: 'unavailable', error: first.error };

    const current = await readMetafield(key);
    if (!current) return { state: 'unavailable', error: 'lock conflict but no lock found' };
    if (current.value.startsWith('#')) {
      const [name, placedAt] = current.value.split('|');
      // Older values have no time: they belong to an order id, which never expires
      if (!placedAt || Math.abs(at - Number(placedAt)) < windowMs) return { state: 'exists', name };
    } else {
      const claimedAt = Number(current.value.split(':')[1]) || 0;
      if (now - claimedAt < Math.min(STALE_MS, windowMs)) return { state: 'in_progress' };
    }
    // Expired or abandoned: take it over, again atomically (only if nobody else just did)
    const takeover = await setMetafield(key, `claimed:${now}`, current.compareDigest);
    return takeover.ok ? { state: 'claimed' } : { state: 'in_progress' };
  } catch (err) {
    return { state: 'unavailable', error: err.message };
  }
}

/** Record the created order's name, so later attempts see it at once (no search lag). */
export async function markOrderCreated(key, name, at = Date.now()) {
  try {
    const res = await setMetafield(key, `${name || '#created'}|${at}`, undefined);
    if (!res.ok) console.error('[order-lock] Could not record', key, res.error);
  } catch (err) {
    console.error('[order-lock] Could not record', key, err.message);
  }
}

/** Drop a claim whose order wasn't created, so the next attempt can retry straight away. */
export async function releaseOrder(key) {
  try {
    await adminGraphQL(
      `mutation ($m: [MetafieldIdentifierInput!]!) {
        metafieldsDelete(metafields: $m) { userErrors { message } }
      }`,
      { m: [{ ownerId: await shopId(), namespace: NAMESPACE, key }] },
    );
  } catch (err) {
    console.error('[order-lock] Could not release', key, err.message);
  }
}

import { config } from '../lib/config.js';
import { isConfigured, shiprocketPost, safeParse } from '../lib/shiprocket.js';
import { fetchVariantsByIds } from '../lib/data-service.js';
import { checkWebhookSecret } from '../lib/webhook-auth.js';
import { jsonResponder, readBody } from '../lib/http.js';
import { isAdminConfigured, adminAuthHeaders } from '../lib/admin-token.js';
import { paymentBreakdown } from '../lib/partial-cod.js';
import { claimOrder, markOrderCreated, releaseOrder, orderKey, fingerprintKey } from '../lib/order-lock.js';
import { findOrderByTag as findOrderByTagShared, syncFulfillment, addOrderNote, adminGraphQL, adminREST } from '../lib/shopify-admin.js';

const SHOPIFY_ADMIN_API = '2026-10';
// Graph API versions expire ~2 years after release; v19.0 (Jan 2024) is past that
const META_CAPI_VERSION = 'v23.0';

/**
 * SHA-256 hash a string for Meta CAPI PII fields (email, phone).
 * Meta requires lowercase + trimmed input before hashing.
 */
async function hashPII(value) {
  if (!value) return undefined;
  const clean = String(value).trim().toLowerCase();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(clean));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Send a server-side Purchase event to Meta Conversions API.
 * This is what makes Events Manager show the setup as complete.
 * @param {object} order   - Normalised order object
 * @param {string} eventId - Same event_id used by the browser pixel Purchase call
 */
async function sendMetaCAPIEvent(order, eventId) {
  const pixelId = config.metaPixelId;
  const capiToken = config.metaCAPIToken;

  if (!pixelId || !capiToken) {
    console.warn('[CAPI] META_PIXEL_ID or META_CAPI_TOKEN not set — skipping server-side event');
    return;
  }

  const eventTime = Math.floor(Date.now() / 1000);
  const value = Number(order.total_amount_payable || 0);

  // Normalise phone: strip all non-digits, ensure 10-digit Indian number
  const rawPhone = order.phone || (order.shipping_address && order.shipping_address.phone) || '';
  const digits = String(rawPhone).replace(/\D/g, '');
  const phone = digits.length >= 10 ? digits.slice(-10) : undefined;

  const [hashedEmail, hashedPhone, hashedCountry] = await Promise.all([
    order.email ? hashPII(order.email) : undefined,
    phone ? hashPII(phone) : undefined,
    hashPII('in'),
  ]);

  const payload = {
    data: [{
      event_name: 'Purchase',
      event_time: eventTime,
      event_id: eventId || order.order_id,          // deduplicates with browser pixel
      action_source: 'website',
      event_source_url: `${config.websiteBaseUrl}/checkout/success`,
      user_data: {
        // Hashed PII — Meta requires SHA-256 lowercase-trimmed values
        ...(hashedEmail && { em: hashedEmail }),
        ...(hashedPhone && { ph: hashedPhone }),
        // Country code (India)
        country: hashedCountry,
      },
      custom_data: {
        value: value > 0 ? value : undefined,
        currency: 'INR',
        order_id: order.order_id,
        content_type: 'product',
        contents: (order.cart_data?.items || []).map(item => ({
          id: String(item.variant_id),
          quantity: Number(item.quantity) || 1,
        })),
        num_items: (order.cart_data?.items || []).reduce((s, i) => s + (Number(i.quantity) || 1), 0),
      },
    }],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${META_CAPI_VERSION}/${pixelId}/events?access_token=${capiToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    const text = await res.text();
    if (res.ok) {
      console.log(`[CAPI] Purchase event sent successfully. event_id: ${eventId || order.order_id}`, text.slice(0, 200));
    } else {
      console.error('[CAPI] Purchase event failed:', res.status, text.slice(0, 400));
    }
  } catch (err) {
    console.error('[CAPI] Network error sending Purchase event:', err.message);
  }
}

/**
 * POST /api/webhooks/order
 * Shiprocket Checkout calls this after an order is placed (register the URL in
 * Shiprocket Checkout > Settings > Webhooks). It may be sent more than once and expects 200.
 *
 * The webhook is unsigned, so only its order_id is used: the order itself is read from
 * Shiprocket's signed Order Details API. If Admin API access is configured, paid/COD
 * orders are created in Shopify (tagged sr-<order id>, so repeats are skipped) to
 * decrement stock and keep orders in Shopify admin.
 */
export default async function handler(request) {
  const reply = jsonResponder();

  if (request.method !== 'POST') {
    return reply(405, { ok: false, message: 'Method not allowed' });
  }

  const auth = checkWebhookSecret(request);
  if (!auth.ok) {
    return reply(401, { ok: false, message: 'Unauthorized' });
  }
  if (!auth.enforced) {
    console.warn('[order-webhook] WEBHOOK_SECRET is not set; accepting an unauthenticated webhook');
  }

  const rawBody = await readBody(request);
  // A body that isn't valid JSON parses to null; treat it as empty so it gets a 400, not a crash
  const body = (typeof rawBody === 'string' ? safeParse(rawBody) : rawBody) || {};
  console.log('[order-webhook] Received body keys:', Object.keys(body || {}).join(','));

  let orderId = body.order_id || body.cart_id || body.id || (body.payload && (body.payload.order_id || body.payload.id || body.payload.cart_id)) || (body.data && (body.data.order_id || body.data.id || body.data.cart_id)) || '';
  orderId = String(orderId).trim();

  // Accept 24-char hex (MongoDB ObjectId), UUIDs, and plain numeric/alphanumeric IDs
  if (!orderId || orderId.length < 6 || orderId.length > 128 || !/^[a-z0-9\-_]+$/i.test(orderId)) {
    console.error('[order-webhook] Invalid or missing order_id. Body keys:', Object.keys(body || {}).join(','));
    return reply(400, { ok: false, message: 'order_id is required', received: orderId });
  }

  const result = await processOrder(orderId, body);
  return reply(result.status, result.payload);
};

/**
 * Verify one Shiprocket order and create it in Shopify (idempotent: tag sr-<order id>).
 * Shared by the webhook, the checkout success page (/api/orders/confirm) and the scheduled
 * reconciliation (/api/orders/reconcile), so an order reaches Shopify even when one path fails.
 *
 * @param {string} orderId
 * @param {object} body   Webhook body; `{}` makes the order come only from Shiprocket's signed API
 * @param {object} [options]
 * @param {boolean} [options.strict] Skip prepaid orders whose payment hasn't succeeded yet
 *   (for the paths that aren't Shiprocket itself saying an order was placed)
 * @param {object} [options.knownOrder] The order's record, already read from Shiprocket's list API
 * @param {boolean} [options.force] Create it even if Shiprocket reports it unpaid or not placed
 *   (manual recovery of one order an admin chose; it is created unpaid, never as paid)
 * @returns {Promise<{status: number, payload: object}>}
 */
export async function processOrder(orderId, body = {}, { strict = false, knownOrder = null, force = false } = {}) {
  const reply = (status, payload) => ({ status, payload });
  console.log('[order-webhook] Processing orderId:', orderId);

  if (!isConfigured()) {
    console.error('[order-webhook] SHIPROCKET_API_KEY / SHIPROCKET_API_SECRET are not set; cannot verify order');
    return reply(500, { ok: false });
  }

  // ── 1. Strategy A: Check if the webhook body already contains the full order ──
  const candidate = body.payload || body.data || body.order || body.result || body;
  const candidateItems = (candidate.cart_data && candidate.cart_data.items) || candidate.items || candidate.line_items;
  let order = null;

  if (knownOrder && hasItems(knownOrder)) {
    order = normalizeOrder(knownOrder, orderId);
  } else if (Array.isArray(candidateItems) && candidateItems.length > 0) {
    console.log('[order-webhook] Webhook payload already contains order items, using directly');
    order = normalizeOrder(candidate, orderId);

    // If email is not in the webhook body, query Shiprocket to enrich customer email
    if (!order.email) {
      try {
        console.log('[order-webhook] Fetching Shiprocket /details for email enrichment...');
        let srRes = await shiprocketPost('/api/v1/custom-platform-order/details', {
          order_id: orderId,
          cart_id: orderId,
          channel_order_id: orderId,
          timestamp: new Date().toISOString(),
        }).catch(err => ({ status: 0, text: err.message }));
        console.log('[order-webhook] Shiprocket /details response:', srRes && srRes.status, String(srRes && srRes.text).slice(0, 300));
        let srData = srRes && srRes.data && (srRes.data.result || srRes.data);
        let srEmail = findEmail(srData);

        // If direct details did not yield an email, search recent orders in /details/list
        if (!srEmail) {
          const now = new Date();
          console.log('[order-webhook] Searching Shiprocket /details/list for email...');
          const listRes = await shiprocketPost('/api/v1/custom-platform-order/details/list', {
            startDate: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            endDate: now.toISOString(),
            timestamp: now.toISOString(),
            limit: 50,
            page: 0,
          }).catch(err => ({ status: 0, text: err.message }));
          console.log('[order-webhook] Shiprocket /details/list response:', listRes && listRes.status, String(listRes && listRes.text).slice(0, 300));

          const list = findOrderList(listRes && listRes.data);
          if (Array.isArray(list)) {
            const customerPhone = order.phone || (order.shipping_address && order.shipping_address.phone);
            const match = list.find(item =>
              String(item.order_id) === orderId ||
              String(item.cart_id) === orderId ||
              String(item.id) === orderId ||
              String(item.channel_order_id) === orderId ||
              String(item.fastrr_order_id) === orderId ||
              (customerPhone && (
                String(item.phone || '').includes(String(customerPhone).slice(-10)) ||
                (item.shipping_address && String(item.shipping_address.phone || '').includes(String(customerPhone).slice(-10)))
              ))
            );
            if (match) {
              srEmail = findEmail(match);
              if (srEmail) console.log('[order-webhook] Found email in /details/list');
              // Re-normalize from the richer Shiprocket record so payment_type is accurate
              if (match.payment_type || match.payment_method || match.is_cod !== undefined) {
                const enriched = normalizeOrder(match, orderId);
                // Preserve address/items from webhook body; only overwrite payment fields
                order.payment_type = enriched.payment_type;
                order.payment_status = enriched.payment_status || order.payment_status;
                order.cod_charges = enriched.cod_charges || order.cod_charges;
                if (enriched.partial_cod.partial) order.partial_cod = enriched.partial_cod;
                console.log('[order-webhook] Enriched payment_type from /details/list:', order.payment_type);
              }
            }
          }
        }

        if (srEmail) {
          console.log('[order-webhook] Enriched order email from Shiprocket API');
          order.email = srEmail;
        }
      } catch (err) {
        console.error('[order-webhook] Could not fetch email from Shiprocket:', err.message);
      }
    }
  }

  // ── 2. Strategy B: Fetch from Shiprocket Order Details API ──
  if (!order) {
    console.log('[order-webhook] Fetching order details from Shiprocket for', orderId);
    let verified = await shiprocketPost('/api/v1/custom-platform-order/details', {
      order_id: orderId,
      cart_id: orderId,
      channel_order_id: orderId,
      timestamp: new Date().toISOString(),
    }).catch(error => ({ ok: false, status: 0, data: null, text: error.message }));

    console.log('[order-webhook] Shiprocket /details response:', verified.status, String(verified.text).slice(0, 500));

    let resultData = verified.data && (verified.data.result || verified.data);
    if (verified.ok && resultData && verified.data.ok !== false) {
      order = normalizeOrder(resultData, orderId);
    }

    // If /details failed (e.g. 400 Order not found due to indexing delay), search recent orders in /details/list
    if (!order) {
      console.log('[order-webhook] Order not found in /details, searching /details/list...');
      try {
        const now = new Date();
        const listRes = await shiprocketPost('/api/v1/custom-platform-order/details/list', {
          startDate: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          endDate: now.toISOString(),
          timestamp: now.toISOString(),
          limit: 50,
          page: 0,
        });

        const list = findOrderList(listRes.data);
        if (Array.isArray(list)) {
          const match = list.find(item =>
            String(item.order_id) === orderId ||
            String(item.cart_id) === orderId ||
            String(item.id) === orderId ||
            String(item.channel_order_id) === orderId ||
            String(item.fastrr_order_id) === orderId
          );
          if (match) {
            console.log('[order-webhook] Found matching order in /details/list!');
            order = normalizeOrder(match, orderId);
          }
        }
      } catch (listErr) {
        console.error('[order-webhook] /details/list query failed:', listErr.message);
      }
    }
  }

  // If still not found, return 500 (NOT 400) so Shiprocket retries the webhook when order finishes indexing
  if (!order) {
    console.error('[order-webhook] Could not resolve order details for', orderId);
    return reply(500, { ok: false, message: 'Order details pending indexing, retry requested' });
  }

  console.log('[order-webhook] Verified order:', JSON.stringify({
    order_id: order.order_id,
    status: order.status,
    payment_type: order.payment_type,
    payment_status: order.payment_status,
    total: order.total_amount_payable,
    item_count: order.cart_data && order.cart_data.items && order.cart_data.items.length,
  }));

  const status = String(order.status).toUpperCase();

  // Statuses that represent a successfully placed order (ready to create in Shopify)
  const SUCCESS_STATUSES = ['SUCCESS', 'CONFIRMED', 'PAYMENT_SUCCESS', 'PLACED', 'NEW', 'PENDING'];
  const SHIPPING_STATUSES = ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RTO_INITIATED', 'RTO_DELIVERED'];

  console.log(`[order-webhook] Order status: "${status}" | Success statuses: ${SUCCESS_STATUSES.join(', ')}`);

  const paymentKnown = order.payment_type ? String(order.payment_type).toUpperCase() : null;
  if (strict && !force && !order.partial_cod?.partial && paymentKnown && paymentKnown !== 'COD' && !/success/i.test(String(order.payment_status))) {
    return reply(200, { ok: true, skipped: `prepaid payment is ${order.payment_status}` });
  }

  if (force && !SUCCESS_STATUSES.includes(status)) {
    console.warn(`[order-webhook] Forced creation of ${order.order_id} with status ${order.status}`);
  } else if (!SUCCESS_STATUSES.includes(status)) {
    if (SHIPPING_STATUSES.includes(status) && isAdminConfigured()) {
      try {
        const tag = `sr-${order.order_id}`;
        const shopifyOrder = await findOrderByTagShared(tag);
        if (shopifyOrder) {
          console.log(`[order-webhook] Syncing status ${status} for ${shopifyOrder.name}`);
          await addOrderNote(shopifyOrder.gid, `Shiprocket Checkout Status: ${status}`);
          
          const tracking = {
            number: order.awb || order.tracking_number || '',
            company: order.courier_name || order.courier || '',
            url: order.tracking_url || (order.awb ? `https://www.shiprocket.co/tracking/${order.awb}` : '')
          };
          
          if (['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
             await syncFulfillment(shopifyOrder, tracking);
          }
          return reply(200, { ok: true, synced_status: status });
        }
      } catch (err) {
        console.error('[order-webhook] Status sync failed:', err.message);
      }
    }
    return reply(200, { ok: true, skipped: `order status is ${order.status}` });
  }

  // A Purchase counts only once the Shopify order exists. Until then nothing is reported.
  if (!isAdminConfigured()) {
    return reply(200, { ok: true, shopify: 'not configured' });
  }

  // Order is in Shopify: send the server-side Meta CAPI Purchase. event_id = the Shopify order
  // name, which the success page also uses for the browser Purchase, so Meta counts the pair,
  // repeated deliveries and a purchase Shiprocket recorded under two ids all once.
  const placed = async (shopifyOrder, extra = {}) => {
    // A force-created order is unpaid/not placed per Shiprocket: in Shopify, but not a purchase
    if (!force) await sendMetaCAPIEvent(order, shopifyOrder);
    return reply(200, { ok: true, placed: true, value: Number(order.total_amount_payable) || 0, shopify_order: shopifyOrder, event_id: shopifyOrder, ...extra });
  };

  try {
    const shopifyOrder = await createShopifyOrder(order, body);
    // Another request is creating it right now and will report it
    if (shopifyOrder === null) return reply(200, { ok: true, in_progress: true });
    return await placed(shopifyOrder);
  } catch (error) {
    console.error('[order-webhook] Creating Shopify order failed (attempt 1):', error.message || error);

    // Retry once after a short delay — covers transient Shopify 429/5xx errors
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const shopifyOrder = await createShopifyOrder(order, body);
      if (shopifyOrder === null) return reply(200, { ok: true, in_progress: true });
      console.log('[order-webhook] Retry succeeded');

      return await placed(shopifyOrder, { retried: true });
    } catch (retryError) {
      console.error('[order-webhook] Retry also failed:', retryError.message || retryError);
      // Return 500 so Shiprocket retries the webhook later
      return reply(500, { ok: false, message: 'Shopify order creation failed after retry' });
    }
  }
}

const ID_FIELDS = ['order_id', 'id', 'cart_id', 'channel_order_id', 'fastrr_order_id'];
/** True if the record carries this id, in a known id field or any other field (Shiprocket's
 * webhook and order list can name the same order's ids differently). */
function hasId(item, orderId, depth = 0) {
  if (!item || typeof item !== 'object' || depth > 2) return false;
  if (depth === 0 && ID_FIELDS.some((key) => item[key] != null && String(item[key]) === orderId)) return true;
  return Object.values(item).some((value) =>
    (typeof value === 'string' && value === orderId) ||
    (value && typeof value === 'object' && !Array.isArray(value) && hasId(value, orderId, depth + 1)));
}

/** When a list record was placed: its own date field, else the time in its ObjectId. */
function recordTime(item, normalized) {
  const stamp = Date.parse(item.created_at || item.createdAt || item.order_date || item.placed_at || '');
  return Number.isFinite(stamp) ? stamp : placedAt(normalized);
}

/** The Shopify order created for a Shiprocket id: its customer, items and creation time. */
async function shopifyOrderFor(orderId) {
  const data = await adminGraphQL(
    `query ($q: String!) { orders(first: 1, query: $q) { nodes {
      name createdAt email phone shippingAddress { phone }
      lineItems(first: 50) { nodes { quantity variant { legacyResourceId } } }
    } } }`,
    { q: `tag:'sr-${orderId}'` }
  );
  return data?.data?.orders?.nodes?.[0] || null;
}

/**
 * Shiprocket's record of one order: Order Details, or else the order list around the time the
 * order was placed (read from its id), all pages.
 * @returns {Promise<{order: object|null, lookup: object}>} `lookup` says what Shiprocket answered
 */
export async function getShiprocketOrder(orderId) {
  const res = await shiprocketPost('/api/v1/custom-platform-order/details', {
    order_id: orderId,
    cart_id: orderId,
    channel_order_id: orderId,
    timestamp: new Date().toISOString(),
  });
  const data = res.data && (res.data.result || res.data);
  const lookup = {
    details_status: res.status,
    details_reply: describeShape(res.data ?? String(res.text).slice(0, 120)),
    // Shiprocket's own error text (no customer data)
    ...(!res.ok && { details_message: String(res.data?.error?.message || res.data?.message || '').slice(0, 200) }),
  };
  // Only a record that is this order (an error body or another order doesn't count)
  if (res.ok && data && typeof data === 'object' && !Array.isArray(data) && res.data.ok !== false && (hasId(data, orderId) || hasItems(data))) {
    return { order: data, lookup: { ...lookup, found_by: 'order details' } };
  }

  // Shiprocket ids are MongoDB ObjectIds starting with their creation time: search a day either
  // side of it; for other ids, the last 30 days
  const placed = /^[0-9a-f]{24}$/i.test(orderId) ? parseInt(orderId.slice(0, 8), 16) * 1000 : null;
  const now = Date.now();
  const start = new Date(placed ? placed - 24 * 3600 * 1000 : now - 30 * 24 * 3600 * 1000);
  const end = new Date(placed ? Math.min(now, placed + 24 * 3600 * 1000) : now);
  try {
    const { orders } = await listShiprocketOrders(start, end, 50, 40);
    const listInfo = { list_searched: orders.length, list_from: start.toISOString(), list_to: end.toISOString() };
    const byId = orders.find((item) => hasId(item, orderId));
    if (byId) return { order: byId, lookup: { ...lookup, ...listInfo, found_by: 'order list' } };

    // Same purchase under another id: match the Shopify order made for this id by customer +
    // items, placed within minutes of it
    const shopify = isAdminConfigured() ? await shopifyOrderFor(orderId).catch(() => null) : null;
    if (!shopify) return { order: null, lookup: { ...lookup, ...listInfo, found_by: null, shopify_order: null } };
    const who = [last10(shopify.phone), last10(shopify.shippingAddress?.phone), String(shopify.email || '').toLowerCase()].filter(Boolean);
    const items = (shopify.lineItems?.nodes || []).map((li) => `${li.variant?.legacyResourceId}:${li.quantity}`).sort().join(',');
    const created = new Date(shopify.createdAt).getTime();
    const twin = orders.find((item) => {
      const candidate = normalizeOrder(item, '');
      const fingerprint = orderFingerprint(candidate);
      if (!fingerprint) return false;
      const [candidateWho, candidateItems] = fingerprint.split('|');
      return candidateItems === items && who.includes(candidateWho) &&
        Math.abs(recordTime(item, candidate) - created) <= SAME_ORDER_WINDOW_MS + 5 * 60 * 1000;
    }) || null;
    return {
      order: twin,
      lookup: { ...lookup, ...listInfo, shopify_order: shopify.name, found_by: twin ? `same customer + items as ${shopify.name}` : null },
    };
  } catch (error) {
    return { order: null, lookup: { ...lookup, list_error: error.message } };
  }
}

export { normalizeOrder };

function hasItems(raw) {
  const items = (raw.cart_data && raw.cart_data.items) || raw.items || raw.line_items;
  return Array.isArray(items) && items.length > 0;
}

/** Shiprocket's id for a record from /custom-platform-order/details/list. */
export function shiprocketOrderId(raw) {
  return String(raw.order_id || raw.id || raw.cart_id || '').trim();
}

const looksLikeOrder = (item) =>
  item && typeof item === 'object' && !Array.isArray(item) &&
  ['order_id', 'id', 'cart_id', 'channel_order_id', 'fastrr_order_id'].some((key) => item[key] != null);

/** The order array inside a /details/list response, wherever Shiprocket nests it. */
function findOrderList(data, depth = 0) {
  if (Array.isArray(data)) return data.length === 0 || data.some(looksLikeOrder) ? data : null;
  if (!data || typeof data !== 'object' || depth > 4) return null;
  for (const key of ['result', 'orders', 'data', 'items', 'list', 'records', 'docs']) {
    if (data[key] !== undefined) {
      const found = findOrderList(data[key], depth + 1);
      if (found) return found;
    }
  }
  for (const value of Object.values(data)) {
    const found = findOrderList(value, depth + 1);
    if (found) return found;
  }
  return null;
}

/**
 * A response's structure (field names, types, array lengths) without any values, so it can be
 * logged or returned for diagnosis without exposing customer data.
 */
export function describeShape(value, depth = 0) {
  if (Array.isArray(value)) {
    return value.length && depth < 4 ? [`array(${value.length})`, describeShape(value[0], depth + 1)] : `array(${value.length})`;
  }
  if (value && typeof value === 'object') {
    if (depth >= 4) return 'object';
    return Object.fromEntries(Object.entries(value).slice(0, 40).map(([k, v]) => [k, describeShape(v, depth + 1)]));
  }
  return value === null ? 'null' : typeof value;
}

/**
 * Orders placed on Shiprocket Checkout between `startDate` and `endDate`, all pages.
 * Shiprocket doesn't publish this endpoint's format, so the order array is searched for and
 * paging works whether it starts at 0 or 1. `shape` describes the first response (no values).
 * @returns {Promise<{orders: object[], shape: unknown}>}
 */
export async function listShiprocketOrders(startDate, endDate, pageSize = 50, maxPages = 20) {
  const orders = [];
  const seenIds = new Set();
  let shape;
  for (let page = 0; page < maxPages; page++) {
    const res = await shiprocketPost('/api/v1/custom-platform-order/details/list', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      timestamp: new Date().toISOString(),
      limit: pageSize,
      page,
    });
    if (!res.ok) {
      throw new Error(`Shiprocket ${res.status}: ${String(res.text).slice(0, 300)}`);
    }
    if (shape === undefined) shape = describeShape(res.data ?? res.text);
    const list = findOrderList(res.data) || [];
    // Page 0 empty may just mean pages start at 1
    if (list.length === 0 && page === 0) continue;
    const fresh = list.filter((item) => {
      const id = shiprocketOrderId(item);
      if (!id || seenIds.has(id)) return false;
      seenIds.add(id);
      return true;
    });
    orders.push(...fresh);
    if (list.length < pageSize) break;
    // An all-repeat page: with 1-based paging, page 1 repeats page 0, so allow that once;
    // after that it means the API ignores `page`
    if (fresh.length === 0 && page !== 1) break;
  }
  return { orders, shape };
}

// Shiprocket can record one prepaid payment as two orders with different ids, a second apart.
// Orders for the same customer with the same items this close together are the same order;
// a genuine repeat needs a new checkout and payment, which takes far longer.
const SAME_ORDER_WINDOW_MS = 2 * 60 * 1000;

/** When Shiprocket created the order: its ids are MongoDB ObjectIds, which start with the time. */
function placedAt(order) {
  const id = String(order.order_id || '');
  return /^[0-9a-f]{24}$/i.test(id) ? parseInt(id.slice(0, 8), 16) * 1000 : Date.now();
}

const last10 = (phone) => String(phone || '').replace(/D/g, '').slice(-10);

/** Who ordered (phone, else email) and what (variant:quantity, sorted); null if unknown. */
function orderFingerprint(order) {
  const who = last10(order.phone || (order.shipping_address && order.shipping_address.phone)) ||
    String(order.email || '').trim().toLowerCase();
  const items = ((order.cart_data && order.cart_data.items) || [])
    .map((item) => `${String(item.variant_id).split('/').pop()}:${Number(item.quantity) || 1}`)
    .sort()
    .join(',');
  return who && items ? `${who}|${items}` : null;
}

/**
 * Create the Shopify order for a Shiprocket order exactly once, however many paths (webhook,
 * success page, reconcile, Shiprocket redeliveries) handle it at the same moment, and even when
 * Shiprocket gives the same purchase two order ids.
 * @returns {Promise<string|null>} the Shopify order name, or null if another request is
 *   creating it right now
 */
async function createShopifyOrder(order, rawWebhookBody = {}) {
  const tag = `sr-${order.order_id}`;
  const fingerprint = orderFingerprint(order);
  // Search can lag behind new orders, so also look at the newest orders directly
  const at = placedAt(order);
  const existing = (await findShopifyOrderByTag(tag)) || (await findRecentDuplicate(tag, fingerprint, at));
  if (existing) {
    console.log('[order-webhook] Already in Shopify:', existing);
    return existing;
  }

  const idKey = orderKey(order.order_id);
  const idLock = await claimOrder(idKey);
  if (idLock.state === 'exists') {
    console.log('[order-webhook] Already created:', idLock.name);
    return idLock.name;
  }
  if (idLock.state === 'in_progress') {
    console.log('[order-webhook] Another request is creating', order.order_id);
    return null;
  }
  if (idLock.state === 'unavailable') {
    console.error('[order-webhook] Order lock unavailable, relying on the duplicate checks:', idLock.error);
  }

  // Same customer + items under another Shiprocket id moments ago = the same purchase
  const fpKey = fingerprint && idLock.state === 'claimed' ? await fingerprintKey(fingerprint) : null;
  const fpLock = fpKey ? await claimOrder(fpKey, { windowMs: SAME_ORDER_WINDOW_MS, at }) : { state: 'none' };
  if (fpLock.state === 'exists') {
    console.log(`[order-webhook] ${order.order_id} is the same purchase as ${fpLock.name} (Shiprocket gave it another id)`);
    await markOrderCreated(idKey, fpLock.name);
    await addOrderTag(fpLock.name, tag);
    return fpLock.name;
  }
  if (fpLock.state === 'in_progress') {
    // Its twin is being created right now; free this id so a later retry resolves to that order
    console.log(`[order-webhook] ${order.order_id}: the same purchase is being created under another id`);
    await releaseOrder(idKey);
    return null;
  }

  const claimed = [idLock.state === 'claimed' && idKey, fpLock.state === 'claimed' && fpKey].filter(Boolean);
  const progress = {};
  try {
    const name = await submitShopifyOrder(order, rawWebhookBody, progress);
    for (const key of claimed) await markOrderCreated(key, name, at);
    return name;
  } catch (error) {
    // Free the claims only when no order can exist (failed before sending, or Shopify said no).
    // After a lost response they stay and expire, so a retry can't make a second copy.
    if (!progress.posted || progress.rejected) {
      for (const key of claimed) await releaseOrder(key);
    }
    throw error;
  }
}

/** Tag an existing order (by name) with another Shiprocket id, so every path finds it. */
async function addOrderTag(name, tag) {
  try {
    const data = await adminGraphQL(
      'query ($q: String!) { orders(first: 1, query: $q) { nodes { id } } }',
      { q: `name:${String(name).replace(/^#/, '')}` }
    );
    const id = data?.data?.orders?.nodes?.[0]?.id;
    if (id) await adminGraphQL('mutation ($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { message } } }', { id, tags: [tag] });
  } catch (err) {
    console.error('[order-webhook] Could not tag', name, err.message);
  }
}

/**
 * The newest orders, read directly rather than through search (which lags behind): one with
 * this tag, or a Shiprocket order for the same customer and items placed moments apart.
 */
async function findRecentDuplicate(tag, fingerprint, at) {
  try {
    const data = await adminGraphQL(
      `{ orders(first: 50, sortKey: CREATED_AT, reverse: true) { nodes {
        name tags createdAt email phone
        shippingAddress { phone }
        lineItems(first: 50) { nodes { quantity variant { legacyResourceId } } }
      } } }`
    );
    const nodes = data?.data?.orders?.nodes || [];
    const byTag = nodes.find((node) => (node.tags || []).includes(tag));
    if (byTag) return byTag.name;
    if (!fingerprint) return null;
    const twin = nodes.find((node) => {
      if (!(node.tags || []).includes('shiprocket')) return false;
      // Created moments after its twin was placed (the Shopify order is made right away)
      if (Math.abs(new Date(node.createdAt).getTime() - at) > SAME_ORDER_WINDOW_MS) return false;
      const items = (node.lineItems?.nodes || [])
        .map((li) => `${li.variant?.legacyResourceId}:${li.quantity}`)
        .sort()
        .join(',');
      const [who, wanted] = fingerprint.split('|');
      const sameWho = who.includes('@')
        ? String(node.email || '').toLowerCase() === who
        : [node.phone, node.shippingAddress?.phone].some((p) => last10(p) === who);
      return sameWho && items === wanted;
    });
    return twin ? twin.name : null;
  } catch (err) {
    console.error('[order-webhook] Recent orders check failed:', err.message);
    return null;
  }
}

async function submitShopifyOrder(order, rawWebhookBody = {}, progress = {}) {
  const tag = `sr-${order.order_id}`;
  const existing = await findShopifyOrderByTag(tag);
  if (existing) {
    console.log('[order-webhook] Already in Shopify:', existing);
    return existing;
  }

  const items = (order.cart_data && order.cart_data.items) || [];
  const variants = await fetchVariantsByIds(items.map(item => String(item.variant_id)));

  const paymentType = order.payment_type ? String(order.payment_type).toUpperCase() : null;
  // Only mark as prepaid when payment_type is explicitly non-COD AND payment succeeded.
  // If payment_type is unknown (null), default safe to COD/pending to avoid false "paid" orders.
  const partial = order.partial_cod && order.partial_cod.partial ? order.partial_cod : null;
  // Partial COD is never "paid": the advance is recorded and the balance stays to collect
  const isPaid = !partial && paymentType !== null && paymentType !== 'COD' && /success/i.test(String(order.payment_status));
  const shippingLines = [{ title: order.shipping_plan || 'Standard', price: String(order.shipping_charges || 0), code: 'shiprocket' }];
  if (Number(order.cod_charges) > 0) {
    shippingLines.push({ title: 'COD charges', price: String(order.cod_charges), code: 'cod' });
  }

  const itemsTotal = items.reduce((sum, item) => {
    const variant = variants.get(String(item.variant_id));
    const price = variant ? Number(variant.price.amount || 0) : 0;
    return sum + price * (Number(item.quantity) || 1);
  }, 0);
  const shippingTotal = Number(order.shipping_charges || 0) + Number(order.cod_charges || 0);
  // What Shopify would total from list prices, and what Shiprocket actually charged. A gap means
  // a Shiprocket checkout offer (e.g. a partial-COD discount) Shiprocket didn't itemise; it goes
  // on the order as a discount so Shopify's total and balance due match the customer's.
  const shopifyTotal = itemsTotal + shippingTotal - Number(order.total_discount || 0);
  const chargedTotal = Number(order.total_amount_payable || 0);
  const discountAmount = Number(order.total_discount || 0) +
    (chargedTotal > 0 && itemsTotal > 0 && shopifyTotal - chargedTotal > 0.5 ? shopifyTotal - chargedTotal : 0);

  // Calculate total amount from items if missing or zero
  let totalAmount = chargedTotal;
  if (totalAmount <= 0) {
    totalAmount = Math.max(0, shopifyTotal);
  }

  const shippingAddress = toShopifyAddress(order.shipping_address);
  const billingAddress = toShopifyAddress(order.billing_address || order.shipping_address);

  const customerFirst = (shippingAddress && shippingAddress.first_name) || 'Customer';
  const customerLast = (shippingAddress && shippingAddress.last_name) || '.';
  const customerPhone = toE164(order.phone) || (shippingAddress && shippingAddress.phone);
  let customerEmail = order.email || findEmail(order) || findEmail(rawWebhookBody) || undefined;

  // Check if customer already exists in Shopify to prevent "phone_number has already been taken" 422 error
  const existingCustomer = await findExistingShopifyCustomer(customerPhone, customerEmail);
  const existingCustomerId = existingCustomer ? existingCustomer.id : null;
  if (existingCustomer) {
    console.log('[order-webhook] Attaching to existing Shopify customer ID:', existingCustomerId);
    if (!customerEmail && existingCustomer.email) {
      customerEmail = existingCustomer.email;
      console.log('[order-webhook] Enriched missing email from existing Shopify profile:', customerEmail);
    }
  }
  console.log('[order-webhook] Customer email resolved to:', customerEmail);

  const payload = {
    order: {
      line_items: items.map(item => {
        const variant = variants.get(String(item.variant_id));
        return {
          variant_id: Number(item.variant_id),
          quantity: Number(item.quantity) || 1,
          ...(variant && variant.price && { price: variant.price.amount }),
        };
      }),
      customer: existingCustomerId
        ? { id: Number(existingCustomerId) }
        : {
            first_name: customerFirst,
            last_name: customerLast,
            ...(customerPhone && { phone: customerPhone }),
            ...(customerEmail && { email: customerEmail }),
          },
      email: customerEmail,
      contact_email: customerEmail,
      phone: customerPhone,
      shipping_address: {
        ...shippingAddress,
        ...(customerEmail && { email: customerEmail }),
      },
      billing_address: {
        ...billingAddress,
        ...(customerEmail && { email: customerEmail }),
      },
      shipping_lines: shippingLines,
      financial_status: isPaid ? 'paid' : partial ? 'partially_paid' : 'pending',
      // Partial COD: the advance as a payment, so Shopify shows the balance still to collect
      ...(partial && {
        transactions: [{
          kind: 'sale',
          status: 'success',
          amount: partial.paid.toFixed(2),
          gateway: 'Shiprocket Checkout (advance)',
        }],
      }),
      // Shopify requires amount > 0 for sale transactions; omit transactions if 0 or unpaid
      ...(isPaid && totalAmount > 0 && {
        transactions: [{
          kind: 'sale',
          status: 'success',
          amount: totalAmount.toFixed(2),
          gateway: (order.payments && order.payments[0] && order.payments[0].gateway) || 'Shiprocket Checkout',
        }],
      }),
      ...(discountAmount > 0 && {
        discount_codes: [{
          code: (order.coupon_codes && order.coupon_codes[0]) || 'SHIPROCKET',
          amount: discountAmount.toFixed(2),
          type: 'fixed_amount',
        }],
      }),
      tags: ['shiprocket', tag, isPaid ? 'prepaid' : partial ? 'partial-cod' : paymentType && paymentType !== 'COD' ? 'prepaid-unpaid' : 'cod'].join(', '),
      note_attributes: [
        { name: 'shiprocket_order_id', value: order.order_id },
        ...(partial ? [
          { name: 'advance_paid_online', value: partial.paid.toFixed(2) },
          { name: 'cod_balance_to_collect', value: partial.due.toFixed(2) },
        ] : []),
        { name: 'fastrr_order_id', value: String(order.fastrr_order_id || '') },
      ],
      inventory_behaviour: 'decrement_obeying_policy',
      send_receipt: false,
      send_fulfillment_receipt: true,
    },
  };

  console.log(`[order-webhook] Submitting order to Shopify (${payload.order.line_items.length} line items)`);

  progress.posted = true;
  let response = await fetch(`${config.shopifyStoreDomain}/admin/api/${SHOPIFY_ADMIN_API}/orders.json`, {
    method: 'POST',
    headers: await adminAuthHeaders(),
    body: JSON.stringify(payload),
  });
  let text = await response.text();

  // If Shopify rejects due to existing customer unique constraint or phone conflict
  if (!response.ok && (/customer/i.test(text) || /already been taken/i.test(text) || /already exists/i.test(text))) {
    console.log(`[order-webhook] Customer conflict detected (${text.slice(0, 250)}). Retrying order creation...`);

    // Try finding customer one more time if we didn't have an ID
    if (!existingCustomerId && (customerPhone || customerEmail)) {
      const retryCustomer = await findExistingShopifyCustomer(customerPhone, customerEmail);
      if (retryCustomer && retryCustomer.id) {
        console.log('[order-webhook] Found customer ID during error retry:', retryCustomer.id);
        payload.order.customer = { id: Number(retryCustomer.id) };
        if (!payload.order.email && retryCustomer.email) {
          payload.order.email = retryCustomer.email;
          payload.order.contact_email = retryCustomer.email;
        }
      } else {
        delete payload.order.customer;
      }
    } else {
      delete payload.order.customer;
    }

    response = await fetch(`${config.shopifyStoreDomain}/admin/api/${SHOPIFY_ADMIN_API}/orders.json`, {
      method: 'POST',
      headers: await adminAuthHeaders(),
      body: JSON.stringify(payload),
    });
    text = await response.text();

    // Fallback: If still failing on phone number uniqueness, remove order-level phone
    if (!response.ok && (/phone/i.test(text) || /already been taken/i.test(text))) {
      console.log('[order-webhook] Still failing on phone conflict, removing order.phone and retrying...');
      delete payload.order.customer;
      delete payload.order.phone;
      response = await fetch(`${config.shopifyStoreDomain}/admin/api/${SHOPIFY_ADMIN_API}/orders.json`, {
        method: 'POST',
        headers: await adminAuthHeaders(),
        body: JSON.stringify(payload),
      });
      text = await response.text();
    }
  }

  if (!response.ok) {
    // Shopify answered with an error, so no order was created and a retry is safe
    progress.rejected = true;
    throw new Error(`Shopify ${response.status}: ${text.slice(0, 500)}`);
  }
  const created = safeParse(text);
  const name = created && created.order && created.order.name;
  console.log('[order-webhook] Created Shopify order', name);
  return name;
}

async function findExistingShopifyCustomer(phone, email) {
  const searchQueries = [];
  if (email && email.includes('@')) {
    searchQueries.push(`email:${email}`);
  }
  if (phone) {
    const raw = String(phone).trim();
    const digits = raw.replace(/\D/g, '');
    const last10 = digits.slice(-10);
    searchQueries.push(`phone:${raw}`);
    if (raw !== `+91${last10}`) searchQueries.push(`phone:+91${last10}`);
    if (last10) searchQueries.push(last10);
  }

  // 1. Try REST customer search
  for (const q of searchQueries) {
    try {
      const res = await adminREST('GET', `customers/search.json?query=${encodeURIComponent(q)}`);
      const list = res && (res.customers || (Array.isArray(res) ? res : []));
      if (Array.isArray(list) && list.length > 0 && list[0].id) {
        const c = list[0];
        console.log(`[order-webhook] Found existing Shopify customer via REST search ("${q}"): ID ${c.id}`);
        return {
          id: String(c.id),
          email: c.email || undefined,
          firstName: c.first_name || undefined,
          lastName: c.last_name || undefined,
        };
      }
    } catch {
      // Continue to next search query / method
    }
  }

  // 2. Try GraphQL customer search
  for (const q of searchQueries) {
    try {
      const data = await adminGraphQL(
        'query ($q: String!) { customers(first: 1, query: $q) { edges { node { id email firstName lastName } } } }',
        { q }
      );
      const node = data?.data?.customers?.edges?.[0]?.node;
      if (node?.id) {
        const id = node.id.split('/').pop();
        console.log(`[order-webhook] Found existing Shopify customer via GraphQL ("${q}"): ID ${id}`);
        return {
          id: String(id),
          email: node.email || undefined,
          firstName: node.firstName || undefined,
          lastName: node.lastName || undefined,
        };
      }
    } catch {
      // Continue
    }
  }

  return null;
}

async function findShopifyOrderByTag(tag) {
  const response = await fetch(`${config.shopifyStoreDomain}/admin/api/${SHOPIFY_ADMIN_API}/graphql.json`, {
    method: 'POST',
    headers: await adminAuthHeaders(),
    body: JSON.stringify({
      query: 'query ($q: String!) { orders(first: 1, query: $q) { edges { node { id name } } } }',
      variables: { q: `tag:'${tag}'` },
    }),
  });
  if (!response.ok) {
    throw new Error(`Shopify ${response.status} while checking for duplicate order`);
  }
  const data = await response.json();
  const edge = data.data && data.data.orders.edges[0];
  return edge ? edge.node.name : null;
}

function toShopifyAddress(address) {
  if (!address) return undefined;
  const fullName = address.name || address.full_name || '';
  const firstName = address.first_name || address.firstName || (fullName ? fullName.split(' ')[0] : '');
  const lastName = address.last_name || address.lastName || (fullName && fullName.split(' ').length > 1 ? fullName.split(' ').slice(1).join(' ') : firstName || 'Customer');

  const zip = address.pincode || address.zip || address.postal_code || '';
  const city = address.city || '';
  let province = address.state || address.province || address.state_name || '';
  let provinceCode = address.province_code || address.state_code || '';

  // Infer missing Indian state from postal code or city
  if (!province) {
    const inferred = inferIndianState(zip, city);
    province = inferred.province;
    provinceCode = inferred.code;
  }

  return {
    first_name: firstName || 'Customer',
    last_name: lastName || '.',
    address1: address.line1 || address.address1 || address.address || address.street || 'Address',
    address2: [address.line2, address.address2, address.landmark].filter(Boolean).join(', '),
    city,
    province,
    province_code: provinceCode || undefined,
    zip,
    country: address.country || 'India',
    country_code: address.country_code || 'IN',
    phone: toE164(address.phone || address.mobile),
  };
}

function inferIndianState(zip, city) {
  const cleanZip = String(zip || '').replace(/\D/g, '');
  if (cleanZip.length === 6) {
    const prefix2 = cleanZip.slice(0, 2);
    const prefix3 = cleanZip.slice(0, 3);

    // 3-digit specific matches
    if (prefix3 === '403') return { province: 'Goa', code: 'GA' };
    if (prefix3 === '605') return { province: 'Puducherry', code: 'PY' };
    if (prefix3 === '682') return { province: 'Lakshadweep', code: 'LD' };
    if (prefix3 === '737') return { province: 'Sikkim', code: 'SK' };
    if (prefix3 === '744') return { province: 'Andaman and Nicobar Islands', code: 'AN' };
    if (['790', '791', '792'].includes(prefix3)) return { province: 'Arunachal Pradesh', code: 'AR' };
    if (['793', '794'].includes(prefix3)) return { province: 'Meghalaya', code: 'ML' };
    if (prefix3 === '795') return { province: 'Manipur', code: 'MN' };
    if (prefix3 === '796') return { province: 'Mizoram', code: 'MZ' };
    if (['797', '798'].includes(prefix3)) return { province: 'Nagaland', code: 'NL' };
    if (prefix3 === '799') return { province: 'Tripura', code: 'TR' };
    if (['246', '247', '248', '249'].includes(prefix3)) return { province: 'Uttarakhand', code: 'UK' };
    if (['814', '815', '816', '825', '826', '827', '828', '829', '831', '832', '833', '834', '835'].includes(prefix3)) {
      return { province: 'Jharkhand', code: 'JH' };
    }
    if (prefix3 === '194') return { province: 'Ladakh', code: 'LA' };
    if (['396'].includes(prefix3)) return { province: 'Dadra and Nagar Haveli and Daman and Diu', code: 'DN' };

    // 2-digit circle matches
    const stateMap = {
      '11': { province: 'Delhi', code: 'DL' },
      '12': { province: 'Haryana', code: 'HR' },
      '13': { province: 'Haryana', code: 'HR' },
      '14': { province: 'Punjab', code: 'PB' },
      '15': { province: 'Punjab', code: 'PB' },
      '16': { province: 'Chandigarh', code: 'CH' },
      '17': { province: 'Himachal Pradesh', code: 'HP' },
      '18': { province: 'Jammu and Kashmir', code: 'JK' },
      '19': { province: 'Jammu and Kashmir', code: 'JK' },
      '20': { province: 'Uttar Pradesh', code: 'UP' },
      '21': { province: 'Uttar Pradesh', code: 'UP' },
      '22': { province: 'Uttar Pradesh', code: 'UP' },
      '23': { province: 'Uttar Pradesh', code: 'UP' },
      '24': { province: 'Uttar Pradesh', code: 'UP' },
      '25': { province: 'Uttar Pradesh', code: 'UP' },
      '26': { province: 'Uttar Pradesh', code: 'UP' },
      '27': { province: 'Uttar Pradesh', code: 'UP' },
      '28': { province: 'Uttar Pradesh', code: 'UP' },
      '30': { province: 'Rajasthan', code: 'RJ' },
      '31': { province: 'Rajasthan', code: 'RJ' },
      '32': { province: 'Rajasthan', code: 'RJ' },
      '33': { province: 'Rajasthan', code: 'RJ' },
      '34': { province: 'Rajasthan', code: 'RJ' },
      '36': { province: 'Gujarat', code: 'GJ' },
      '37': { province: 'Gujarat', code: 'GJ' },
      '38': { province: 'Gujarat', code: 'GJ' },
      '39': { province: 'Gujarat', code: 'GJ' },
      '40': { province: 'Maharashtra', code: 'MH' },
      '41': { province: 'Maharashtra', code: 'MH' },
      '42': { province: 'Maharashtra', code: 'MH' },
      '43': { province: 'Maharashtra', code: 'MH' },
      '44': { province: 'Maharashtra', code: 'MH' },
      '45': { province: 'Madhya Pradesh', code: 'MP' },
      '46': { province: 'Madhya Pradesh', code: 'MP' },
      '47': { province: 'Madhya Pradesh', code: 'MP' },
      '48': { province: 'Madhya Pradesh', code: 'MP' },
      '49': { province: 'Chhattisgarh', code: 'CG' },
      '50': { province: 'Telangana', code: 'TS' },
      '51': { province: 'Andhra Pradesh', code: 'AP' },
      '52': { province: 'Andhra Pradesh', code: 'AP' },
      '53': { province: 'Andhra Pradesh', code: 'AP' },
      '56': { province: 'Karnataka', code: 'KA' },
      '57': { province: 'Karnataka', code: 'KA' },
      '58': { province: 'Karnataka', code: 'KA' },
      '59': { province: 'Karnataka', code: 'KA' },
      '60': { province: 'Tamil Nadu', code: 'TN' },
      '61': { province: 'Tamil Nadu', code: 'TN' },
      '62': { province: 'Tamil Nadu', code: 'TN' },
      '63': { province: 'Tamil Nadu', code: 'TN' },
      '64': { province: 'Tamil Nadu', code: 'TN' },
      '67': { province: 'Kerala', code: 'KL' },
      '68': { province: 'Kerala', code: 'KL' },
      '69': { province: 'Kerala', code: 'KL' },
      '70': { province: 'West Bengal', code: 'WB' },
      '71': { province: 'West Bengal', code: 'WB' },
      '72': { province: 'West Bengal', code: 'WB' },
      '73': { province: 'West Bengal', code: 'WB' },
      '74': { province: 'West Bengal', code: 'WB' },
      '75': { province: 'Odisha', code: 'OD' },
      '76': { province: 'Odisha', code: 'OD' },
      '77': { province: 'Odisha', code: 'OD' },
      '78': { province: 'Assam', code: 'AS' },
      '80': { province: 'Bihar', code: 'BR' },
      '81': { province: 'Bihar', code: 'BR' },
      '82': { province: 'Bihar', code: 'BR' },
      '83': { province: 'Jharkhand', code: 'JH' },
      '84': { province: 'Bihar', code: 'BR' },
      '85': { province: 'Bihar', code: 'BR' },
    };

    if (stateMap[prefix2]) return stateMap[prefix2];
  }

  // Fallback by city name
  const c = String(city || '').toLowerCase().trim();
  if (['mumbai', 'pune', 'nagpur', 'thane', 'nashik', 'aurangabad', 'solapur'].includes(c)) return { province: 'Maharashtra', code: 'MH' };
  if (['delhi', 'new delhi'].includes(c)) return { province: 'Delhi', code: 'DL' };
  if (['bengaluru', 'bangalore', 'mysore', 'hubli', 'mangalore'].includes(c)) return { province: 'Karnataka', code: 'KA' };
  if (['hyderabad', 'secunderabad', 'warangal'].includes(c)) return { province: 'Telangana', code: 'TS' };
  if (['chennai', 'coimbatore', 'madurai', 'salem'].includes(c)) return { province: 'Tamil Nadu', code: 'TN' };
  if (['kolkata', 'howrah'].includes(c)) return { province: 'West Bengal', code: 'WB' };
  if (['ahmedabad', 'surat', 'vadodara', 'rajkot'].includes(c)) return { province: 'Gujarat', code: 'GJ' };
  if (['jaipur', 'jodhpur', 'udaipur', 'kota'].includes(c)) return { province: 'Rajasthan', code: 'RJ' };
  if (['lucknow', 'kanpur', 'varanasi', 'agra', 'noida', 'ghaziabad'].includes(c)) return { province: 'Uttar Pradesh', code: 'UP' };
  if (['gurugram', 'gurgaon', 'faridabad'].includes(c)) return { province: 'Haryana', code: 'HR' };
  if (['chandigarh', 'mohali'].includes(c)) return { province: 'Chandigarh', code: 'CH' };

  return { province: '', code: '' };
}

// Shopify rejects bare 10-digit Indian numbers
function toE164(phone) {
  if (!phone) return undefined;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return undefined;
}

function normalizeOrder(raw, fallbackId) {
  if (!raw) return null;
  const orderId = String(raw.order_id || raw.id || raw.cart_id || fallbackId || '').trim();
  const rawItems = (raw.cart_data && raw.cart_data.items) || raw.items || raw.line_items || [];
  const resolvedEmail = findEmail(raw);
  const total = Number(raw.total_amount_payable || raw.total || raw.order_total || 0);

  return {
    order_id: orderId,
    // Partial COD: advance paid online, balance in cash (lib/partial-cod.js)
    partial_cod: paymentBreakdown(raw, total),
    fastrr_order_id: raw.fastrr_order_id || raw.channel_order_id || '',
    status: raw.status || raw.order_status || raw.payment_status || 'SUCCESS',
    payment_type: raw.payment_type || raw.payment_method ||
      (raw.is_cod === true ? 'COD' :
      (raw.is_cod === false ? 'PREPAID' :
      // paymentDetails is present on prepaid (UPI/card/etc) orders; COD orders never have a transactionId
      (raw.paymentDetails && (raw.paymentDetails.transactionId || raw.paymentDetails.paymentMode)
        ? (String(raw.paymentDetails.paymentMode || '').toUpperCase() === 'COD' ? 'COD' : 'PREPAID')
        : null))),
    payment_status: raw.payment_status || raw.status || 'SUCCESS',
    shipping_plan: raw.shipping_plan || raw.shipping_method || 'Standard',
    shipping_charges: raw.shipping_charges || raw.shipping_fee || 0,
    cod_charges: raw.cod_charges || 0,
    total_amount_payable: raw.total_amount_payable || raw.total || raw.order_total || 0,
    total_discount: raw.total_discount || raw.discount || 0,
    coupon_codes: raw.coupon_codes || (raw.coupon ? [raw.coupon] : []),
    email: resolvedEmail || undefined,
    phone: raw.phone || raw.customer_phone || (raw.customer && raw.customer.phone) || (raw.shipping_address && raw.shipping_address.phone) || undefined,
    shipping_address: raw.shipping_address || raw.delivery_address || raw.address,
    billing_address: raw.billing_address || raw.shipping_address || raw.delivery_address || raw.address,
    cart_data: {
      items: rawItems.map(item => ({
        variant_id: String(item.variant_id || item.variantId || item.id),
        quantity: Number(item.quantity || 1),
      })),
    },
    awb: raw.awb || raw.tracking_number,
    courier_name: raw.courier_name || raw.courier,
    tracking_url: raw.tracking_url,
  };
}

function findEmail(obj) {
  if (!obj) return undefined;
  if (typeof obj === 'string') {
    const trimmed = obj.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return trimmed;
    }
    const match = trimmed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return match ? match[0] : undefined;
  }
  if (typeof obj === 'object') {
    // 1. Prioritized email properties
    const directKeys = [
      'email', 'customer_email', 'buyer_email', 'user_email', 'contact_email',
      'billing_email', 'shipping_email', 'mail'
    ];
    for (const key of directKeys) {
      if (obj[key] && typeof obj[key] === 'string' && obj[key].includes('@')) {
        const found = findEmail(obj[key]);
        if (found) return found;
      }
    }
    // 2. Search common sub-objects
    const subObjects = ['customer', 'shipping_address', 'billing_address', 'address', 'contact', 'cart_attributes'];
    for (const key of subObjects) {
      if (obj[key] && typeof obj[key] === 'object') {
        const found = findEmail(obj[key]);
        if (found) return found;
      }
    }
    // 3. Recursive fallback across all object fields
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        const found = findEmail(obj[key]);
        if (found) return found;
      } else if (typeof obj[key] === 'string' && obj[key].includes('@')) {
        const found = findEmail(obj[key]);
        if (found) return found;
      }
    }
  }
  return undefined;
}

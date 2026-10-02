/**
 * Shopify Admin API helpers for order management and fulfillment.
 *
 * Shared between the order-creation webhook and the shipment-tracking webhook
 * so fulfillment logic lives in one place.
 */
const { config } = require('./config');
const { safeParse } = require('./shiprocket');

const SHOPIFY_ADMIN_API = '2026-10';

// ── Low-level helpers ────────────────────────────────────────────────────────

function adminUrl(path) {
  return `${config.shopifyStoreDomain}/admin/api/${SHOPIFY_ADMIN_API}/${path}`;
}

function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': config.shopifyAdminToken,
  };
}

/** Run a GraphQL query against the Shopify Admin API. */
async function adminGraphQL(query, variables = {}) {
  const res = await fetch(adminUrl('graphql.json'), {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify Admin GraphQL ${res.status}: ${text.slice(0, 500)}`);
  }
  return res.json();
}

/** Call the Shopify Admin REST API. Returns parsed JSON (or raw text on parse failure). */
async function adminREST(method, path, body) {
  const opts = { method, headers: adminHeaders() };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(adminUrl(path), opts);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Shopify Admin REST ${res.status}: ${text.slice(0, 500)}`);
  }
  return safeParse(text) || text;
}

// ── Order lookup ─────────────────────────────────────────────────────────────

/**
 * Find a Shopify order by tag. Returns { gid, numericId, name } or null.
 * Used for idempotency checks (sr-<orderId>) and for fulfillment sync.
 */
async function findOrderByTag(tag) {
  const data = await adminGraphQL(
    'query ($q: String!) { orders(first: 1, query: $q) { edges { node { id name } } } }',
    { q: `tag:'${tag}'` }
  );
  const edge = data.data && data.data.orders && data.data.orders.edges[0];
  if (!edge) return null;
  const gid = edge.node.id; // gid://shopify/Order/123456
  return { gid, numericId: gid.split('/').pop(), name: edge.node.name };
}

// ── Fulfillment helpers ──────────────────────────────────────────────────────

/**
 * Get the open (unfulfilled) fulfillment orders for a Shopify order.
 * Shopify auto-creates these when an order is placed.
 */
async function getFulfillmentOrders(orderNumericId) {
  const data = await adminREST('GET', `orders/${orderNumericId}/fulfillment_orders.json`);
  return (data && data.fulfillment_orders) || [];
}

/** Get existing fulfillments on a Shopify order. */
async function getOrderFulfillments(orderNumericId) {
  const data = await adminREST('GET', `orders/${orderNumericId}/fulfillments.json`);
  return (data && data.fulfillments) || [];
}

/**
 * Create a fulfillment with tracking info.
 * `fulfillmentOrderIds` — array of Shopify fulfillment_order IDs to fulfill.
 * `tracking` — { number, url, company } (all optional but at least number is expected).
 */
async function createFulfillment(fulfillmentOrderIds, tracking, notifyCustomer = true) {
  const payload = {
    fulfillment: {
      line_items_by_fulfillment_order: fulfillmentOrderIds.map(id => ({
        fulfillment_order_id: Number(id),
      })),
      notify_customer: notifyCustomer,
    },
  };

  if (tracking && (tracking.number || tracking.url || tracking.company)) {
    payload.fulfillment.tracking_info = {
      ...(tracking.number && { number: tracking.number }),
      ...(tracking.url && { url: tracking.url }),
      ...(tracking.company && { company: tracking.company }),
    };
  }

  return adminREST('POST', 'fulfillments.json', payload);
}

/**
 * Update tracking info on an existing fulfillment.
 */
async function updateFulfillmentTracking(fulfillmentId, tracking, notifyCustomer = false) {
  return adminREST('PUT', `fulfillments/${fulfillmentId}/update_tracking.json`, {
    fulfillment: {
      notify_customer: notifyCustomer,
      tracking_info: {
        ...(tracking.number && { number: tracking.number }),
        ...(tracking.url && { url: tracking.url }),
        ...(tracking.company && { company: tracking.company }),
      },
    },
  });
}

/**
 * Add a note/timeline comment to a Shopify order (visible in admin).
 * Useful for status updates that don't map to fulfillment changes.
 */
async function addOrderNote(orderGid, message) {
  const data = await adminGraphQL(
    `mutation ($input: OrderInput!) {
       orderUpdate(input: $input) {
         order { id }
         userErrors { field message }
       }
     }`,
    { input: { id: orderGid, note: message } }
  );
  const errors = data.data && data.data.orderUpdate && data.data.orderUpdate.userErrors;
  if (errors && errors.length > 0) {
    console.error('[shopify-admin] orderUpdate errors:', errors);
  }
  return data;
}

/**
 * Orchestrate fulfillment sync for a Shopify order.
 *
 * Given a Shopify order (by tag), either:
 *   1. Create a fulfillment (if none exists) with tracking info
 *   2. Update the existing fulfillment's tracking info
 *
 * Returns { action, fulfillment_id } or null if nothing to do.
 */
async function syncFulfillment(shopifyOrder, tracking) {
  const { numericId } = shopifyOrder;

  // Check for existing fulfillments
  const fulfillments = await getOrderFulfillments(numericId);
  const existingFulfillment = fulfillments.find(f =>
    f.status !== 'cancelled'
  );

  if (existingFulfillment) {
    // Update tracking on the existing fulfillment
    const trackingChanged =
      (tracking.number && tracking.number !== existingFulfillment.tracking_number) ||
      (tracking.company && tracking.company !== existingFulfillment.tracking_company) ||
      (tracking.url && !existingFulfillment.tracking_urls.includes(tracking.url));

    if (trackingChanged) {
      console.log('[shopify-admin] Updating tracking on fulfillment', existingFulfillment.id);
      await updateFulfillmentTracking(existingFulfillment.id, tracking);
      return { action: 'updated', fulfillment_id: existingFulfillment.id };
    }
    return { action: 'unchanged', fulfillment_id: existingFulfillment.id };
  }

  // No fulfillment yet — create one
  const fulfillmentOrders = await getFulfillmentOrders(numericId);
  const openOrders = fulfillmentOrders.filter(fo =>
    fo.status === 'open' || fo.status === 'in_progress'
  );

  if (openOrders.length === 0) {
    console.log('[shopify-admin] No open fulfillment orders for', shopifyOrder.name);
    return null;
  }

  console.log('[shopify-admin] Creating fulfillment for', shopifyOrder.name);
  const result = await createFulfillment(
    openOrders.map(fo => fo.id),
    tracking,
    true // notify customer
  );
  const newId = result && result.fulfillment && result.fulfillment.id;
  return { action: 'created', fulfillment_id: newId };
}

module.exports = {
  adminGraphQL,
  adminREST,
  findOrderByTag,
  getFulfillmentOrders,
  getOrderFulfillments,
  createFulfillment,
  updateFulfillmentTracking,
  addOrderNote,
  syncFulfillment,
};

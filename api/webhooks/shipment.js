/**
 * POST /api/webhooks/shipment
 *
 * Receives shipment/tracking status updates from **Shiprocket Shipping** and
 * syncs them to the corresponding Shopify order.
 *
 * This is NOT the Fastrr Engage / Shiprocket Checkout webhook — that one lives
 * at /api/webhooks/order.  This endpoint handles the Shiprocket Shipping panel's
 * tracking-status webhook, whose payload looks like:
 *
 *   {
 *     "order_id": 123456789,           // Shiprocket Shipping's internal ID
 *     "sr_order_id": 123456789,        // same as order_id usually
 *     "channel_order_id": "abc123...", // the Fastrr Checkout order ID (hex)
 *     "awb": "123456789012",
 *     "courier_name": "Delhivery",
 *     "current_status": "In Transit",
 *     "current_status_id": 17,
 *     "shipment_status": "In Transit",
 *     "shipment_status_id": 17,
 *     "scans": [ { "date": "...", "activity": "...", "location": "..." } ],
 *     "etd": "2024-01-20",
 *     "tracking_url": "https://..."
 *   }
 *
 * The Shopify order is found by tag `sr-<channel_order_id>` (the Fastrr Checkout
 * hex ID that was used when the order was originally created).  If that tag lookup
 * fails, a fallback query on the `shiprocket_order_id` note attribute is tried.
 *
 * Once found, the endpoint:
 *   a. Creates or updates a Shopify fulfillment with AWB / courier / tracking URL
 *   b. Adds a timestamped status note to the Shopify order timeline
 *   c. Returns 200 as quickly as possible so Shiprocket marks delivery successful
 */
const { config } = require('../lib/config');
const { safeParse } = require('../lib/shiprocket');
const { findOrderByTag, syncFulfillment, addOrderNote, adminGraphQL } = require('../lib/shopify-admin');

// ── Shiprocket Shipping status mapping ───────────────────────────────────────

const STATUS_LABELS = {
  1:  'AWB Assigned',
  2:  'Pickup Scheduled',
  3:  'Pickup Queued',
  4:  'Pickup Error',
  5:  'Pickup Rescheduled',
  6:  'Shipped',
  7:  'Delivered',
  8:  'Cancelled',
  9:  'RTO Initiated',
  10: 'RTO Delivered',
  12: 'Lost',
  13: 'Pickup Exception',
  14: 'Undelivered',
  15: 'Delayed',
  16: 'Partially Delivered',
  17: 'In Transit',
  18: 'Out for Delivery',
  19: 'Damaged',
  20: 'Shipment Booked',
  38: 'Reached Destination Hub',
  39: 'Misrouted',
  40: 'RTO Acknowledged',
  41: 'RTO In Transit',
  42: 'RTO NDR',
  45: 'Self Fulfilled',
  46: 'Disposed Off',
  48: 'Cancelled Before Dispatched',
};

/** Statuses where we should create/update a Shopify fulfillment with tracking. */
const FULFILLABLE_STATUS_IDS = new Set([6, 7, 17, 18]);

// ── Handler ──────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  // Quick validation — respond fast
  if (!config.shopifyAdminToken) {
    console.error('[shipment-webhook] SHOPIFY_ADMIN_ACCESS_TOKEN is not set');
    return res.status(200).json({ ok: false, message: 'Shopify Admin not configured' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  if (!body) {
    return res.status(400).json({ ok: false, message: 'Invalid request body' });
  }

  // Log the full payload for debugging
  console.log('[shipment-webhook] Received:', JSON.stringify(body).slice(0, 3000));

  // ── Parse ──────────────────────────────────────────────────────────────────

  const parsed = parseShipmentPayload(body);
  console.log('[shipment-webhook] Parsed:', JSON.stringify(parsed));

  if (!parsed.channelOrderId && !parsed.srOrderId) {
    return res.status(200).json({ ok: true, skipped: 'No order ID in payload' });
  }

  // ── Find the Shopify order ─────────────────────────────────────────────────
  //
  // Strategy:
  //   1. Try tag `sr-<channel_order_id>` (the Fastrr Checkout hex ID)
  //   2. Fallback: try tag `sr-<sr_order_id>` (Shiprocket's numeric ID)
  //   3. Fallback: search orders by note attribute `shiprocket_order_id`
  //

  let shopifyOrder = null;
  try {
    if (parsed.channelOrderId) {
      shopifyOrder = await findOrderByTag(`sr-${parsed.channelOrderId}`);
    }
    if (!shopifyOrder && parsed.srOrderId && parsed.srOrderId !== parsed.channelOrderId) {
      shopifyOrder = await findOrderByTag(`sr-${parsed.srOrderId}`);
    }
    if (!shopifyOrder && parsed.srOrderId) {
      // Fallback: search by the note attribute stored during order creation
      shopifyOrder = await findOrderByNoteAttribute('shiprocket_order_id', parsed.srOrderId);
    }
  } catch (error) {
    console.error('[shipment-webhook] Shopify lookup failed:', error.message);
    // Return 200 so Shiprocket doesn't flood retries on transient errors
    return res.status(200).json({ ok: false, error: 'Shopify lookup failed' });
  }

  if (!shopifyOrder) {
    console.log('[shipment-webhook] No Shopify order found for', {
      channel_order_id: parsed.channelOrderId,
      sr_order_id: parsed.srOrderId,
    });
    // Return 200 — the Shopify order may not have been created yet
    return res.status(200).json({ ok: true, skipped: 'Shopify order not found' });
  }

  console.log('[shipment-webhook] Found Shopify order', shopifyOrder.name);

  // ── Sync fulfillment ───────────────────────────────────────────────────────

  const results = { shopify_order: shopifyOrder.name, status: parsed.statusLabel };

  if (parsed.shouldFulfill && (parsed.tracking.number || parsed.tracking.company)) {
    try {
      const syncResult = await syncFulfillment(shopifyOrder, parsed.tracking);
      console.log('[shipment-webhook] Fulfillment sync:', syncResult);
      results.fulfillment = syncResult;
    } catch (error) {
      console.error('[shipment-webhook] Fulfillment sync failed:', error.message);
      results.fulfillment_error = error.message;
    }
  }

  // ── Add status note to order timeline ──────────────────────────────────────

  if (parsed.statusLabel) {
    try {
      const note = buildStatusNote(parsed);
      await addOrderNote(shopifyOrder.gid, note);
      results.note_added = true;
    } catch (error) {
      console.error('[shipment-webhook] Adding note failed:', error.message);
    }
  }

  return res.status(200).json({ ok: true, ...results });
};

// ── Payload parsing ──────────────────────────────────────────────────────────

function parseShipmentPayload(body) {
  // Standard Shiprocket Shipping webhook fields
  const srOrderId = String(body.sr_order_id || body.order_id || '');
  const channelOrderId = String(body.channel_order_id || '');

  // Status — prefer numeric ID (more reliable than string)
  const statusId = Number(body.current_status_id || body.shipment_status_id || 0);
  const statusRaw = body.current_status || body.shipment_status || '';
  const statusLabel = STATUS_LABELS[statusId] || statusRaw || '';
  const shouldFulfill = FULFILLABLE_STATUS_IDS.has(statusId);

  // Tracking data
  const awb = body.awb || body.awb_code || '';
  const courierName = body.courier_name || '';
  const trackingUrl = body.tracking_url || '';
  const finalTrackingUrl = trackingUrl || (awb ? `https://www.shiprocket.co/tracking/${awb}` : '');

  // Scan history (logged for debugging, included in note)
  const scans = Array.isArray(body.scans) ? body.scans : [];
  const latestScan = scans[0] || null;

  return {
    srOrderId,
    channelOrderId,
    statusId,
    statusLabel,
    shouldFulfill,
    tracking: {
      number: awb,
      company: courierName,
      url: finalTrackingUrl,
    },
    etd: body.etd || '',
    shipmentId: String(body.shipment_id || ''),
    latestScan,
  };
}

function buildStatusNote(parsed) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const parts = [`[${ts}] Shiprocket: ${parsed.statusLabel}`];
  if (parsed.tracking.number) parts.push(`AWB: ${parsed.tracking.number}`);
  if (parsed.tracking.company) parts.push(`Courier: ${parsed.tracking.company}`);
  if (parsed.etd) parts.push(`ETA: ${parsed.etd}`);
  if (parsed.tracking.url) parts.push(`Track: ${parsed.tracking.url}`);
  if (parsed.latestScan) {
    const scan = parsed.latestScan;
    parts.push(`Latest: ${scan.activity || scan.status || ''} @ ${scan.location || ''} (${scan.date || ''})`);
  }
  return parts.join(' | ');
}

// ── Fallback order lookup by note attribute ──────────────────────────────────

async function findOrderByNoteAttribute(attrName, attrValue) {
  // Shopify's order search doesn't directly support note_attributes queries,
  // so we search by a broader term and filter in-memory.
  const data = await adminGraphQL(
    `query ($q: String!) {
       orders(first: 5, query: $q) {
         edges {
           node {
             id
             name
             customAttributes { key value }
           }
         }
       }
     }`,
    { q: attrValue }
  );
  const edges = data.data && data.data.orders && data.data.orders.edges;
  if (!edges || edges.length === 0) return null;

  for (const edge of edges) {
    const attrs = edge.node.customAttributes || [];
    const match = attrs.find(a => a.key === attrName && a.value === attrValue);
    if (match) {
      const gid = edge.node.id;
      return { gid, numericId: gid.split('/').pop(), name: edge.node.name };
    }
  }
  return null;
}

import { isConfigured } from '../lib/shiprocket.js';
import { hasCronSecret } from '../lib/webhook-auth.js';
import { jsonResponder, queryParams } from '../lib/http.js';
import { isAdminConfigured } from '../lib/admin-token.js';
import { processOrder, listShiprocketOrders, shiprocketOrderId } from './webhook-order.js';

const DEFAULT_HOURS = 3;
const MAX_HOURS = 24 * 30;

/**
 * GET|POST /api/orders/reconcile?hours=3
 * Safety net for missed order webhooks: lists the orders Shiprocket Checkout took in the last
 * `hours` and creates any that aren't in Shopify yet (orders already there are skipped by
 * their sr-<order id> tag). .github/workflows/order-reconcile.yml runs it every 15 minutes;
 * a larger `hours` backfills older orders:
 *   curl -H "Authorization: Bearer $CRON_SECRET" "https://www.thsix.com/api/orders/reconcile?hours=72"
 */
export default async function handler(request) {
  const reply = jsonResponder({ 'Cache-Control': 'no-store' });

  if (!hasCronSecret(request)) {
    return reply(401, { ok: false, message: 'Unauthorized' });
  }
  if (!isConfigured()) {
    return reply(500, { ok: false, message: 'SHIPROCKET_API_KEY / SHIPROCKET_API_SECRET are not set' });
  }
  if (!isAdminConfigured()) {
    return reply(500, { ok: false, message: 'Shopify Admin API access is not configured' });
  }

  const requested = Number(queryParams(request).hours);
  const hours = Number.isFinite(requested) && requested > 0 ? Math.min(requested, MAX_HOURS) : DEFAULT_HOURS;
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1000);

  let orders;
  try {
    orders = await listShiprocketOrders(startDate, endDate);
  } catch (error) {
    console.error('[order-reconcile] Listing Shiprocket orders failed:', error.message);
    return reply(502, { ok: false, message: error.message });
  }

  const results = [];
  const seen = new Set();
  // Sequential: Shopify's Admin API rate-limits bursts
  for (const raw of orders) {
    const orderId = shiprocketOrderId(raw);
    if (!orderId || seen.has(orderId)) continue;
    seen.add(orderId);
    try {
      const { status, payload } = await processOrder(orderId, {}, { strict: true, knownOrder: raw });
      results.push({ order_id: orderId, status, ...payload });
    } catch (error) {
      console.error('[order-reconcile] Order', orderId, 'failed:', error.message);
      results.push({ order_id: orderId, status: 500, ok: false, message: error.message });
    }
  }

  const failed = results.filter((r) => r.status >= 300);
  console.log(`[order-reconcile] ${hours}h window: ${results.length} orders, ${failed.length} failed`);
  return reply(failed.length ? 502 : 200, {
    ok: failed.length === 0,
    hours,
    checked: results.length,
    // Shopify order names (#1001 …) for every order that is now in Shopify, new or not
    in_shopify: results.filter((r) => r.shopify_order).map((r) => r.shopify_order),
    results,
  });
}

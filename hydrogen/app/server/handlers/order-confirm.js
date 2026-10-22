import { jsonResponder, readBody } from '../lib/http.js';
import { safeParse } from '../lib/shiprocket.js';
import { processOrder } from './webhook-order.js';

/**
 * POST /api/orders/confirm  { order_id }
 * Called by the checkout success page with the `oid` Shiprocket redirected back with, so the
 * Shopify order is created even if Shiprocket's order webhook never arrives.
 *
 * Public, but only the order id is taken from the browser: the order itself is read from
 * Shiprocket's signed Order Details API, prepaid orders need a successful payment there, and
 * creation is idempotent (tag sr-<order id>), so repeats and forged ids create nothing.
 */
export default async function handler(request) {
  const reply = jsonResponder({ 'Cache-Control': 'no-store' });

  if (request.method !== 'POST') {
    return reply(405, { ok: false, message: 'Method not allowed' });
  }

  const rawBody = await readBody(request);
  const body = (typeof rawBody === 'string' ? safeParse(rawBody) : rawBody) || {};
  const orderId = String(body.order_id || '').trim();
  if (orderId.length < 6 || orderId.length > 128 || !/^[a-z0-9\-_]+$/i.test(orderId)) {
    return reply(400, { ok: false, message: 'order_id is required' });
  }

  const result = await processOrder(orderId, {}, { strict: true });
  // The browser only needs to know whether to retry; don't echo order details back
  return reply(result.status, { ok: result.status < 300 });
}

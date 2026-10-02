const { config } = require('../_lib/config');
const { isConfigured, shiprocketPost, safeParse } = require('../_lib/shiprocket');
const { fetchVariantsByIds } = require('../_lib/data-service');
const { findOrderByTag: findOrderByTagShared, syncFulfillment, addOrderNote } = require('../_lib/shopify-admin');

const SHOPIFY_ADMIN_API = '2024-10';

/**
 * POST /api/webhooks/order
 * Shiprocket Checkout calls this after an order is placed (register the URL in
 * Shiprocket Checkout > Settings > Webhooks). It may be sent more than once and expects 200.
 *
 * The webhook is unsigned, so only its order_id is used: the order itself is read from
 * Shiprocket's signed Order Details API. If SHOPIFY_ADMIN_ACCESS_TOKEN is set, paid/COD
 * orders are created in Shopify (tagged sr-<order id>, so repeats are skipped) to
 * decrement stock and keep orders in Shopify admin.
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  let rawBody = req.body;
  if (Buffer.isBuffer(rawBody)) {
    rawBody = rawBody.toString('utf8');
  }
  const body = typeof rawBody === 'string' ? safeParse(rawBody) : rawBody || {};
  let orderId = body.order_id || body.id || (body.payload && body.payload.order_id) || '';
  orderId = String(orderId).trim();

  if (!/^[a-f0-9]{24}$/i.test(orderId)) {
    console.error('[order-webhook] Invalid or missing order_id. Received body:', JSON.stringify(body));
    return res.status(400).json({ ok: false, message: 'order_id is required', received: orderId });
  }

  console.log('[order-webhook] Received', orderId, body.status);

  if (!isConfigured()) {
    console.error('[order-webhook] SHIPROCKET_API_KEY / SHIPROCKET_API_SECRET are not set; cannot verify order');
    return res.status(500).json({ ok: false });
  }

  // The webhook is unsigned: use Shiprocket's signed Order Details API as the source of truth
  const verified = await shiprocketPost('/api/v1/custom-platform-order/details', {
    order_id: orderId,
    timestamp: new Date().toISOString(),
  }).catch(error => ({ ok: false, status: 0, data: null, text: error.message }));

  const order = verified.ok && verified.data && verified.data.ok !== false && verified.data.result;
  if (!order || String(order.order_id) !== orderId) {
    console.error('[order-webhook] Could not verify order with Shiprocket:', verified.status, String(verified.text).slice(0, 500));
    // 5xx makes Shiprocket retry later; a 4xx from them means the order doesn't exist
    return res.status(verified.status >= 400 && verified.status < 500 ? 400 : 502).json({ ok: false });
  }

  console.log('[order-webhook] Verified', JSON.stringify({
    order_id: order.order_id,
    status: order.status,
    payment_type: order.payment_type,
    payment_status: order.payment_status,
    total: order.total_amount_payable,
    items: order.cart_data && order.cart_data.items,
  }));

  const status = String(order.status).toUpperCase();

  if (status !== 'SUCCESS') {
    const SHIPPING_STATUSES = ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RTO_INITIATED', 'RTO_DELIVERED'];
    if (SHIPPING_STATUSES.includes(status) && config.shopifyAdminToken) {
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
          return res.status(200).json({ ok: true, synced_status: status });
        }
      } catch (err) {
        console.error('[order-webhook] Status sync failed:', err.message);
      }
    }
    return res.status(200).json({ ok: true, skipped: `order status is ${order.status}` });
  }

  if (!config.shopifyAdminToken) {
    return res.status(200).json({ ok: true, shopify: 'not configured' });
  }

  try {
    const shopifyOrder = await createShopifyOrder(order);
    return res.status(200).json({ ok: true, shopify_order: shopifyOrder });
  } catch (error) {
    console.error('[order-webhook] Creating Shopify order failed (attempt 1):', error.message || error);

    // Retry once after a short delay — covers transient Shopify 429/5xx errors
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const shopifyOrder = await createShopifyOrder(order);
      console.log('[order-webhook] Retry succeeded');
      return res.status(200).json({ ok: true, shopify_order: shopifyOrder, retried: true });
    } catch (retryError) {
      console.error('[order-webhook] Retry also failed:', retryError.message || retryError);
      // Return 500 so Shiprocket retries the webhook later
      return res.status(500).json({ ok: false, message: 'Shopify order creation failed after retry' });
    }
  }
};

async function createShopifyOrder(order) {
  const tag = `sr-${order.order_id}`;
  const existing = await findShopifyOrderByTag(tag);
  if (existing) {
    console.log('[order-webhook] Already in Shopify:', existing);
    return existing;
  }

  const items = (order.cart_data && order.cart_data.items) || [];
  const variants = await fetchVariantsByIds(items.map(item => String(item.variant_id)));

  const isPaid = String(order.payment_type).toUpperCase() !== 'COD' && /success/i.test(String(order.payment_status));
  const shippingLines = [{ title: order.shipping_plan || 'Standard', price: String(order.shipping_charges || 0), code: 'shiprocket' }];
  if (Number(order.cod_charges) > 0) {
    shippingLines.push({ title: 'COD charges', price: String(order.cod_charges), code: 'cod' });
  }

  const payload = {
    order: {
      line_items: items.map(item => {
        const variant = variants.get(String(item.variant_id));
        return {
          variant_id: Number(item.variant_id),
          quantity: item.quantity,
          ...(variant && { price: variant.price.amount }),
        };
      }),
      email: order.email || undefined,
      phone: toE164(order.phone),
      shipping_address: toShopifyAddress(order.shipping_address),
      billing_address: toShopifyAddress(order.billing_address || order.shipping_address),
      shipping_lines: shippingLines,
      financial_status: isPaid ? 'paid' : 'pending',
      ...(isPaid && {
        transactions: [{
          kind: 'sale',
          status: 'success',
          amount: String(order.total_amount_payable),
          gateway: (order.payments && order.payments[0] && order.payments[0].gateway) || 'Shiprocket Checkout',
        }],
      }),
      ...(Number(order.total_discount) > 0 && {
        discount_codes: [{
          code: (order.coupon_codes && order.coupon_codes[0]) || 'SHIPROCKET',
          amount: String(order.total_discount),
          type: 'fixed_amount',
        }],
      }),
      tags: ['shiprocket', tag, isPaid ? 'prepaid' : 'cod'].join(', '),
      note_attributes: [
        { name: 'shiprocket_order_id', value: order.order_id },
        { name: 'fastrr_order_id', value: String(order.fastrr_order_id || '') },
      ],
      inventory_behaviour: 'decrement_obeying_policy',
      // Shiprocket already sends the order-confirmation email; prevent Shopify from
      // sending a duplicate. Shipping notifications still fire from fulfillment sync.
      send_receipt: false,
      send_fulfillment_receipt: true,
    },
  };

  const response = await fetch(`${config.shopifyStoreDomain}/admin/api/${SHOPIFY_ADMIN_API}/orders.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': config.shopifyAdminToken },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Shopify ${response.status}: ${text.slice(0, 500)}`);
  }
  const created = safeParse(text);
  const name = created && created.order && created.order.name;
  console.log('[order-webhook] Created Shopify order', name);
  return name;
}

async function findShopifyOrderByTag(tag) {
  const response = await fetch(`${config.shopifyStoreDomain}/admin/api/${SHOPIFY_ADMIN_API}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': config.shopifyAdminToken },
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
  return {
    first_name: address.first_name || '',
    last_name: address.last_name || '',
    address1: address.line1 || '',
    address2: [address.line2, address.landmark].filter(Boolean).join(', '),
    city: address.city || '',
    province: address.state || '',
    zip: address.pincode || '',
    country: address.country || 'India',
    country_code: address.country_code || 'IN',
    phone: toE164(address.phone),
  };
}

// Shopify rejects bare 10-digit Indian numbers
function toE164(phone) {
  if (!phone) return undefined;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return undefined;
}

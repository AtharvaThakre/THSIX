const { config } = require('../_lib/config');
const { isConfigured, shiprocketPost, safeParse } = require('../_lib/shiprocket');
const { fetchVariantsByIds } = require('../_lib/data-service');
const { findOrderByTag: findOrderByTagShared, syncFulfillment, addOrderNote } = require('../_lib/shopify-admin');

const SHOPIFY_ADMIN_API = '2026-10';

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
  console.log('[order-webhook] Full received body:', JSON.stringify(body));

  let orderId = body.order_id || body.cart_id || body.id || (body.payload && (body.payload.order_id || body.payload.id || body.payload.cart_id)) || (body.data && (body.data.order_id || body.data.id || body.data.cart_id)) || '';
  orderId = String(orderId).trim();

  // Accept 24-char hex (MongoDB ObjectId), UUIDs, and plain numeric/alphanumeric IDs
  if (!orderId || orderId.length < 6 || orderId.length > 128 || !/^[a-z0-9\-_]+$/i.test(orderId)) {
    console.error('[order-webhook] Invalid or missing order_id. Received body:', JSON.stringify(body));
    return res.status(400).json({ ok: false, message: 'order_id is required', received: orderId });
  }

  console.log('[order-webhook] Processing orderId:', orderId);

  if (!isConfigured()) {
    console.error('[order-webhook] SHIPROCKET_API_KEY / SHIPROCKET_API_SECRET are not set; cannot verify order');
    return res.status(500).json({ ok: false });
  }

  // ── 1. Strategy A: Check if the webhook body already contains the full order ──
  const candidate = body.payload || body.data || body.order || body.result || body;
  const candidateItems = (candidate.cart_data && candidate.cart_data.items) || candidate.items || candidate.line_items;
  let order = null;

  if (Array.isArray(candidateItems) && candidateItems.length > 0) {
    console.log('[order-webhook] Webhook payload already contains order items, using directly');
    order = normalizeOrder(candidate, orderId);
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

        const list = listRes.data && (listRes.data.result || listRes.data.orders || (Array.isArray(listRes.data) ? listRes.data : []));
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
    return res.status(500).json({ ok: false, message: 'Order details pending indexing, retry requested' });
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

  if (!SUCCESS_STATUSES.includes(status)) {
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

  // Calculate total amount from items if missing or zero
  let totalAmount = Number(order.total_amount_payable || 0);
  if (totalAmount <= 0) {
    const itemsTotal = items.reduce((sum, item) => {
      const variant = variants.get(String(item.variant_id));
      const price = variant ? Number(variant.price.amount || 0) : 0;
      return sum + price * (Number(item.quantity) || 1);
    }, 0);
    const shippingTotal = Number(order.shipping_charges || 0) + Number(order.cod_charges || 0);
    const discountTotal = Number(order.total_discount || 0);
    totalAmount = Math.max(0, itemsTotal + shippingTotal - discountTotal);
  }

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
      email: order.email || undefined,
      phone: toE164(order.phone),
      shipping_address: toShopifyAddress(order.shipping_address),
      billing_address: toShopifyAddress(order.billing_address || order.shipping_address),
      shipping_lines: shippingLines,
      financial_status: isPaid ? 'paid' : 'pending',
      // Shopify requires amount > 0 for sale transactions; omit transactions if 0 or unpaid
      ...(isPaid && totalAmount > 0 && {
        transactions: [{
          kind: 'sale',
          status: 'success',
          amount: totalAmount.toFixed(2),
          gateway: (order.payments && order.payments[0] && order.payments[0].gateway) || 'Shiprocket Checkout',
        }],
      }),
      ...(Number(order.total_discount) > 0 && {
        discount_codes: [{
          code: (order.coupon_codes && order.coupon_codes[0]) || 'SHIPROCKET',
          amount: Number(order.total_discount).toFixed(2),
          type: 'fixed_amount',
        }],
      }),
      tags: ['shiprocket', tag, isPaid ? 'prepaid' : 'cod'].join(', '),
      note_attributes: [
        { name: 'shiprocket_order_id', value: order.order_id },
        { name: 'fastrr_order_id', value: String(order.fastrr_order_id || '') },
      ],
      inventory_behaviour: 'decrement_obeying_policy',
      send_receipt: false,
      send_fulfillment_receipt: true,
    },
  };

  console.log('[order-webhook] Submitting order payload to Shopify:', JSON.stringify(payload));

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
  const fullName = address.name || address.full_name || '';
  const firstName = address.first_name || address.firstName || (fullName ? fullName.split(' ')[0] : '');
  const lastName = address.last_name || address.lastName || (fullName && fullName.split(' ').length > 1 ? fullName.split(' ').slice(1).join(' ') : firstName || 'Customer');

  return {
    first_name: firstName || 'Customer',
    last_name: lastName || '.',
    address1: address.line1 || address.address1 || address.address || address.street || 'Address',
    address2: [address.line2, address.address2, address.landmark].filter(Boolean).join(', '),
    city: address.city || '',
    province: address.state || address.province || '',
    zip: address.pincode || address.zip || address.postal_code || '',
    country: address.country || 'India',
    country_code: address.country_code || 'IN',
    phone: toE164(address.phone || address.mobile),
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

function normalizeOrder(raw, fallbackId) {
  if (!raw) return null;
  const orderId = String(raw.order_id || raw.id || raw.cart_id || fallbackId || '').trim();
  const rawItems = (raw.cart_data && raw.cart_data.items) || raw.items || raw.line_items || [];

  return {
    order_id: orderId,
    fastrr_order_id: raw.fastrr_order_id || raw.channel_order_id || '',
    status: raw.status || raw.order_status || raw.payment_status || 'SUCCESS',
    payment_type: raw.payment_type || raw.payment_method || (raw.is_cod ? 'COD' : 'PREPAID'),
    payment_status: raw.payment_status || raw.status || 'SUCCESS',
    shipping_plan: raw.shipping_plan || raw.shipping_method || 'Standard',
    shipping_charges: raw.shipping_charges || raw.shipping_fee || 0,
    cod_charges: raw.cod_charges || 0,
    total_amount_payable: raw.total_amount_payable || raw.total || raw.order_total || 0,
    total_discount: raw.total_discount || raw.discount || 0,
    coupon_codes: raw.coupon_codes || (raw.coupon ? [raw.coupon] : []),
    email: raw.email || raw.customer_email || (raw.customer && raw.customer.email) || undefined,
    phone: raw.phone || raw.customer_phone || (raw.customer && raw.customer.phone) || undefined,
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

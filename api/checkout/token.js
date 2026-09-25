const crypto = require('crypto');
const { config } = require('../lib/config');

/**
 * POST /api/checkout/token
 * Body: { items: [{ variant_id, quantity }], redirect_url }
 *
 * THSIX is a "Custom" store in Shiprocket Checkout, so checkout starts from a
 * server-signed token instead of the Shopify cart. The browser hands the token
 * to HeadlessCheckout.addToCart(). Auth is a base64 HMAC-SHA256 of the exact
 * request body, keyed with the API secret.
 */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  if (!config.shiprocketApiKey || !config.shiprocketApiSecret) {
    console.error('[checkout-token] SHIPROCKET_API_KEY / SHIPROCKET_API_SECRET are not set');
    return res.status(500).json({ ok: false, message: 'Checkout is not configured yet.' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};
  const { items, redirect_url: redirectUrl } = body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, message: 'Your cart is empty.' });
  }
  if (!redirectUrl) {
    return res.status(400).json({ ok: false, message: 'redirect_url is required.' });
  }

  const cartItems = [];
  for (const item of items) {
    const variantId = String((item && item.variant_id) || '').trim();
    const quantity = Number(item && item.quantity);
    if (!/^\d+$/.test(variantId)) {
      return res.status(400).json({ ok: false, message: 'Invalid product in cart. Please re-add it.' });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ ok: false, message: 'Invalid quantity in cart.' });
    }
    cartItems.push({ variant_id: variantId, quantity });
  }

  // Sign the exact string we send; re-serialising would change the signature
  const payload = JSON.stringify({
    cart_data: { items: cartItems, mobile_app: false },
    redirect_url: redirectUrl,
    timestamp: new Date().toISOString(),
  });
  const signature = crypto
    .createHmac('sha256', config.shiprocketApiSecret)
    .update(payload, 'utf8')
    .digest('base64');

  try {
    const response = await fetch(`${config.shiprocketBaseUrl}/api/v1/access-token/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': config.shiprocketApiKey,
        'X-Api-HMAC-SHA256': signature,
      },
      body: payload,
    });

    const text = await response.text();
    const data = safeParse(text) || { raw: text };
    const token = data && data.result && data.result.token;

    if (!response.ok || !token) {
      console.error('[checkout-token] Shiprocket rejected the request:', response.status, text.slice(0, 500));
      const message =
        response.status === 401 || response.status === 511
          ? 'Checkout is misconfigured. Please contact the store.'
          : (data && data.error && data.error.message) || data.message || 'Checkout is unavailable right now. Please try again.';
      return res.status(502).json({ ok: false, message });
    }

    return res.status(200).json({ ok: true, token, order_id: data.result.order_id || null });
  } catch (error) {
    console.error('[checkout-token] Request to Shiprocket failed:', error);
    return res.status(502).json({ ok: false, message: 'Checkout is unavailable right now. Please try again.' });
  }
};

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const { config } = require('../lib/config');
const { isConfigured, shiprocketPost, safeParse } = require('../lib/shiprocket');
const { fetchVariantsByIds } = require('../lib/data-service');

// Where Shiprocket may send the shopper after payment. It appends ?oid=<order id>&ost=<status>.
const ALLOWED_REDIRECT_HOSTS = ['www.thsix.com', 'thsix.com', 'localhost', '127.0.0.1'];

/**
 * POST /api/checkout/token
 * Body: { items: [{ variant_id, quantity }], redirect_url? }
 *
 * THSIX is a "Custom" channel seller in Shiprocket Checkout (seller config: channel=custom,
 * headlessEnabled=true), so checkout starts from a server-signed access token which the
 * browser hands to HeadlessCheckout.addToCart(). The Shopify-channel buyDirect() flow does
 * not work for this seller: it looks up a Shopify catalogue that doesn't exist and fails
 * with "catalogue service response is null".
 *
 * Each item carries catalog_data (price, name, image) read from Shopify here, so Shiprocket
 * has the product even if its catalogue sync is behind, and the browser can't set prices.
 */
module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  if (!isConfigured()) {
    console.error('[checkout-token] SHIPROCKET_API_KEY / SHIPROCKET_API_SECRET are not set');
    return res.status(500).json({ ok: false, message: 'Checkout is not configured yet.' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};
  const { items } = body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, message: 'Your cart is empty.' });
  }

  // Shiprocket requires each variant_id to appear once, so merge duplicate lines
  const quantities = new Map();
  for (const item of items) {
    const variantId = String((item && item.variant_id) || '').trim();
    const quantity = Number(item && item.quantity);
    if (!/^\d+$/.test(variantId)) {
      return res.status(400).json({ ok: false, message: 'Invalid product in cart. Please re-add it.' });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return res.status(400).json({ ok: false, message: 'Invalid quantity in cart.' });
    }
    quantities.set(variantId, (quantities.get(variantId) || 0) + quantity);
  }

  let variants;
  try {
    variants = await fetchVariantsByIds([...quantities.keys()]);
  } catch (error) {
    console.error('[checkout-token] Shopify variant lookup failed:', error);
    return res.status(502).json({ ok: false, message: 'Checkout is unavailable right now. Please try again.' });
  }

  const cartItems = [];
  for (const [variantId, quantity] of quantities) {
    const variant = variants.get(variantId);
    if (!variant) {
      return res.status(400).json({ ok: false, message: 'A product in your cart is no longer available. Please remove it.' });
    }
    if (!variant.availableForSale) {
      return res.status(400).json({
        ok: false,
        message: `${variant.product.title} (${variant.title}) is sold out. Please remove it from your cart.`,
      });
    }

    const image = (variant.image && variant.image.url) || (variant.product.featuredImage && variant.product.featuredImage.url) || '';
    cartItems.push({
      variant_id: variantId,
      quantity,
      catalog_data: {
        price: Number(variant.price.amount),
        name: variant.title && variant.title !== 'Default Title'
          ? `${variant.product.title} - ${variant.title}`
          : variant.product.title,
        image_url: image,
      },
    });
  }

  const result = await requestToken({
    cart_data: { items: cartItems, mobile_app: false },
    redirect_url: resolveRedirectUrl(body.redirect_url),
    timestamp: new Date().toISOString(),
  });

  if (!result.token) {
    return res.status(502).json({ ok: false, message: result.message });
  }

  return res.status(200).json({ ok: true, token: result.token, order_id: result.orderId });
};

async function requestToken(payload) {
  let response;
  try {
    response = await shiprocketPost('/api/v1/access-token/checkout', payload);
  } catch (error) {
    console.error('[checkout-token] Request to Shiprocket failed:', error);
    return { message: 'Checkout is unavailable right now. Please try again.' };
  }

  const data = response.data || {};
  const token = data.result && data.result.token;
  if (response.ok && token) {
    return { token, orderId: (data.result.data && data.result.data.order_id) || data.result.order_id || null };
  }

  console.error('[checkout-token] Shiprocket rejected the request:', response.status, response.text.slice(0, 1000));
  if (response.status === 401 || response.status === 511) {
    return { message: 'Checkout is misconfigured. Please contact the store.' };
  }
  return {
    message: (data.error && data.error.message) || data.message || 'Checkout is unavailable right now. Please try again.',
  };
}

function resolveRedirectUrl(requested) {
  const fallback = `${config.websiteBaseUrl}${config.checkoutSuccessUrl}`;
  if (!requested) return fallback;
  try {
    const url = new URL(requested);
    return ALLOWED_REDIRECT_HOSTS.includes(url.hostname) ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

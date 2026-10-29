/**
 * Server configuration, read lazily from the Oxygen environment.
 *
 * Oxygen passes the variables on each request's `env`, so `handleApi()` (lib/http.js) calls
 * `setServerEnv(env)` before running a handler and every field below is a getter that reads
 * from it at call time.
 */
let env = {};

export function setServerEnv(nextEnv) {
  env = nextEnv || {};
}

const storeDomainUrl = () => {
  const domain = env.PUBLIC_STORE_DOMAIN || '19sjnp-gx.myshopify.com';
  return /^https?:\/\//.test(domain) ? domain : `https://${domain}`;
};

export const config = {
  get shiprocketApiKey() { return env.SHIPROCKET_API_KEY || ''; },
  get shiprocketApiSecret() { return env.SHIPROCKET_API_SECRET || ''; },
  get shiprocketBaseUrl() { return env.SHIPROCKET_BASE_URL || 'https://checkout-api.shiprocket.com'; },
  get websiteBaseUrl() { return env.WEBSITE_BASE_URL || 'https://www.thsix.com'; },
  get checkoutSuccessUrl() { return env.CHECKOUT_SUCCESS_URL || '/checkout/success'; },
  get shopifyStoreDomain() { return storeDomainUrl(); },
  // Storefront API auth for server-side catalogue reads. A private token (Oxygen injects
  // PRIVATE_STOREFRONT_API_TOKEN) goes in its own header; the public token is the fallback.
  get shopifyStorefrontHeaders() {
    if (env.PRIVATE_STOREFRONT_API_TOKEN) {
      return { 'Shopify-Storefront-Private-Token': env.PRIVATE_STOREFRONT_API_TOKEN };
    }
    const token = env.PUBLIC_STOREFRONT_API_TOKEN || '';
    return token ? { 'X-Shopify-Storefront-Access-Token': token } : {};
  },
  // Shopify has no weights entered for these products; couriers need one to price shipping
  get defaultWeightGrams() { return parseInt(env.SHIPROCKET_DEFAULT_WEIGHT_GRAMS || '', 10) || 1000; },
  // Optional: lets the order webhook create the order in Shopify (write_orders scope)
  get shopifyAdminToken() { return env.SHOPIFY_ADMIN_ACCESS_TOKEN || ''; },
  // Dev Dashboard app credentials; exchanged for a short-lived token (lib/admin-token.js)
  get shopifyAdminClientId() { return env.SHOPIFY_ADMIN_CLIENT_ID || ''; },
  get shopifyAdminClientSecret() { return env.SHOPIFY_ADMIN_CLIENT_SECRET || ''; },
  // Protects /api/catalog/sync; sent as a Bearer token
  get cronSecret() { return env.CRON_SECRET || ''; },
  // Optional shared secret the Shiprocket webhooks must carry (see lib/webhook-auth.js)
  get webhookSecret() { return env.WEBHOOK_SECRET || ''; },
  // Partial COD: fixed advance every COD order pays online (e.g. 199); 0/unset = off
  get partialCodAdvance() { const n = Number(env.PARTIAL_COD_ADVANCE); return Number.isFinite(n) && n > 0 ? n : 0; },
  // Meta Conversions API — server-side event tracking
  get metaPixelId() { return env.META_PIXEL_ID || env.PUBLIC_META_PIXEL_ID || ''; },
  get metaCAPIToken() { return env.META_CAPI_TOKEN || ''; },
  // Contact form (Resend)
  get resendApiKey() { return env.RESEND_API_KEY || ''; },
  get supportEmail() { return env.SUPPORT_EMAIL || 'support@thsix.com'; },
  get contactFromEmail() { return env.CONTACT_FROM_EMAIL || 'THSIX Contact <noreply@thsix.com>'; },
  defaultPageLimit: 100,
  maxPageLimit: 250,
};

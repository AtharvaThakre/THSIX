/**
 * Server configuration from Vercel environment variables.
 * The Shopify Storefront token is public (it ships in the browser bundle too).
 */
const env = process.env;

const config = {
  shiprocketApiKey: env.SHIPROCKET_API_KEY || '',
  shiprocketApiSecret: env.SHIPROCKET_API_SECRET || '',
  shiprocketBaseUrl: env.SHIPROCKET_BASE_URL || 'https://checkout-api.shiprocket.com',
  websiteBaseUrl: env.WEBSITE_BASE_URL || 'https://www.thsix.com',
  checkoutSuccessUrl: env.CHECKOUT_SUCCESS_URL || '/checkout/success',
  shopifyStoreDomain: env.SHOPIFY_STORE_DOMAIN || 'https://19sjnp-gx.myshopify.com',
  shopifyStorefrontToken: env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || 'be59fa0cf086500d7b6456e64f233866',
  // Shopify has no weights entered for these products; couriers need one to price shipping
  defaultWeightGrams: parseInt(env.SHIPROCKET_DEFAULT_WEIGHT_GRAMS || '', 10) || 1000,
  // Optional: lets the order webhook create the order in Shopify (write_orders scope)
  shopifyAdminToken: env.SHOPIFY_ADMIN_ACCESS_TOKEN || '',
  // Protects /api/catalog/sync; Vercel Cron sends it as a Bearer token
  cronSecret: env.CRON_SECRET || '',
  defaultPageLimit: 100,
  maxPageLimit: 250,
};

module.exports = { config };

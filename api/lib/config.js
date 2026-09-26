/**
 * Shiprocket and Shopify API configuration
 */
const shiprocketApiKey = process.env.SHIPROCKET_API_KEY;
const shiprocketApiSecret = process.env.SHIPROCKET_API_SECRET;
const shiprocketBaseUrl = process.env.SHIPROCKET_BASE_URL;
const websiteBaseUrl = process.env.WEBSITE_BASE_URL;
const checkoutSuccessUrl = process.env.CHECKOUT_SUCCESS_URL;
const checkoutFailureUrl = process.env.CHECKOUT_FAILURE_URL;
const shopifyStoreDomain = process.env.SHOPIFY_STORE_DOMAIN;
const shopifyStorefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

const config = {
  shiprocketApiKey: shiprocketApiKey || '',
  shiprocketApiSecret: shiprocketApiSecret || '',
  shiprocketBaseUrl: shiprocketBaseUrl || 'https://checkout-api.shiprocket.com',
  websiteBaseUrl: websiteBaseUrl || 'https://www.thsix.com',
  checkoutSuccessUrl: checkoutSuccessUrl || '/checkout/success',
  checkoutFailureUrl: checkoutFailureUrl || '/checkout/failure',
  shopifyStoreDomain: shopifyStoreDomain || 'https://19sjnp-gx.myshopify.com',
  shopifyStorefrontToken: shopifyStorefrontToken || 'be59fa0cf086500d7b6456e64f233866',
  // Shopify has no weights entered for these products; couriers need one to price shipping
  defaultWeightGrams: parseInt(process.env.SHIPROCKET_DEFAULT_WEIGHT_GRAMS || '', 10) || 1000,
  // Optional: lets the order webhook create the order in Shopify (write_orders scope)
  shopifyAdminToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '',
  // Protects /api/catalog/sync; Vercel Cron sends it as a Bearer token
  cronSecret: process.env.CRON_SECRET || '',
  defaultPageLimit: 100,
  maxPageLimit: 250,
};

/**
 * Validates that required environment variables are set
 */
function validateConfig() {
  const required = [
    'SHIPROCKET_API_KEY',
    'SHIPROCKET_API_SECRET',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  return {
    valid: missing.length === 0,
    missing
  };
}

module.exports = {
  config,
  validateConfig
};
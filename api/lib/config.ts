/**
 * Shiprocket API configuration
 */
const shiprocketApiKey = process.env.SHIPROCKET_API_KEY;
const shiprocketApiSecret = process.env.SHIPROCKET_API_SECRET;
const shiprocketBaseUrl = process.env.SHIPROCKET_BASE_URL;
const websiteBaseUrl = process.env.WEBSITE_BASE_URL;
const checkoutSuccessUrl = process.env.CHECKOUT_SUCCESS_URL;
const checkoutFailureUrl = process.env.CHECKOUT_FAILURE_URL;

export const config = {
  shiprocketApiKey: shiprocketApiKey || '',
  shiprocketApiSecret: shiprocketApiSecret || '',
  shiprocketBaseUrl: shiprocketBaseUrl || 'https://checkout-api.shiprocket.com',
  websiteBaseUrl: websiteBaseUrl || 'https://thsix.vercel.app',
  checkoutSuccessUrl: checkoutSuccessUrl || '/checkout/success',
  checkoutFailureUrl: checkoutFailureUrl || '/checkout/failure',
  defaultPageLimit: 100,
  maxPageLimit: 250,
};

/**
 * Validates that required environment variables are set
 */
export function validateConfig(): { valid: boolean; missing: string[] } {
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

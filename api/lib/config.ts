/**
 * Shiprocket API configuration
 */
export const config = {
  // Your Shiprocket API credentials (provided by Shiprocket team)
  shiprocketApiKey: process.env.SHIPROCKET_API_KEY || '',
  shiprocketApiSecret: process.env.SHIPROCKET_API_SECRET || '',
  
  // Shiprocket API base URL
  shiprocketBaseUrl: process.env.SHIPROCKET_BASE_URL || 'https://checkout-api.shiprocket.com',
  
  // Your website base URL (for redirect URLs)
  websiteBaseUrl: process.env.WEBSITE_BASE_URL || 'https://thsix.vercel.app',
  
  // Checkout success/failure redirect URLs
  checkoutSuccessUrl: process.env.CHECKOUT_SUCCESS_URL || '/checkout/success',
  checkoutFailureUrl: process.env.CHECKOUT_FAILURE_URL || '/checkout/failure',
  
  // Pagination defaults
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

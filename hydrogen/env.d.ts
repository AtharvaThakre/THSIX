/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />


// Extra Oxygen environment variables used by THSIX (see .env.example)
interface Env {
  PUBLIC_SHOPIFY_SHOP_ID?: string;
  PUBLIC_GA4_MEASUREMENT_ID?: string;
  PUBLIC_META_PIXEL_ID?: string;
  RESEND_API_KEY?: string;
  SUPPORT_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
  SHIPROCKET_API_KEY?: string;
  SHIPROCKET_API_SECRET?: string;
  SHIPROCKET_BASE_URL?: string;
  WEBSITE_BASE_URL?: string;
  CHECKOUT_SUCCESS_URL?: string;
  SHIPROCKET_DEFAULT_WEIGHT_GRAMS?: string;
  CRON_SECRET?: string;
  SHOPIFY_ADMIN_ACCESS_TOKEN?: string;
  META_PIXEL_ID?: string;
  META_CAPI_TOKEN?: string;
  WEBHOOK_SECRET?: string;
  CSP_REPORT_ONLY?: string;
  SHOPIFY_STOREFRONT_ACCESS_TOKEN?: string;
}

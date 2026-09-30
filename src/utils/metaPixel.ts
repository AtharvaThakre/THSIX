/**
 * Meta Pixel (Facebook Pixel) tracking utility — THSIX.
 * Covers every Standard Event Meta recognises plus a custom event helper.
 *
 * Standard events reference:
 * https://developers.facebook.com/docs/meta-pixel/reference
 */

type FbqParams = Record<string, any>;

const fire = (type: 'track' | 'trackCustom', event: string, params?: FbqParams) => {
  if (typeof window !== 'undefined') {
    if (import.meta.env.DEV) {
      console.log(`[Meta Pixel] ${type}: ${event}`, params ?? '');
    }
    if (typeof window.fbq === 'function') {
      if (params) {
        window.fbq(type, event, params);
      } else {
        window.fbq(type, event);
      }
    } else {
      console.warn(`[Meta Pixel] window.fbq is not defined. An ad blocker (uBlock, Brave Shields, AdBlock) might be blocking Meta Pixel.`);
    }
  }
};

// ── Standard Events ──────────────────────────────────────────────────────────

/** Fires when a product page is viewed. */
export const trackViewContent = (params: {
  content_name: string;
  content_ids: string[];
  content_type?: string;
  value?: number;
  currency?: string;
}) => fire('track', 'ViewContent', { content_type: 'product', currency: 'INR', ...params });

/** Fires when an item is added to the cart. */
export const trackAddToCart = (params: {
  content_name: string;
  content_ids: string[];
  value: number;
  currency?: string;
}) => fire('track', 'AddToCart', { content_type: 'product', currency: 'INR', ...params });

/** Fires when the checkout flow begins. */
export const trackInitiateCheckout = (params: {
  num_items: number;
  value: number;
  content_ids?: string[];
  currency?: string;
}) => fire('track', 'InitiateCheckout', { currency: 'INR', ...params });

/** Fires when an order is confirmed. */
export const trackPurchase = (params: {
  value: number;
  currency?: string;
  order_id?: string;
}) => fire('track', 'Purchase', { currency: 'INR', ...params });

/** Fires when a user submits a lead form (e.g. newsletter). */
export const trackLead = (params?: FbqParams) =>
  fire('track', 'Lead', params);

/** Fires when search is used. */
export const trackSearch = (query: string) =>
  fire('track', 'Search', { search_string: query });

/** Fires on a meaningful page view (SPA navigation). */
export const trackPageView = () => fire('track', 'PageView');

/** Fires when the user adds payment info. */
export const trackAddPaymentInfo = (params?: FbqParams) =>
  fire('track', 'AddPaymentInfo', params);

/** Fires when a user adds to a wishlist. */
export const trackAddToWishlist = (params: {
  content_name: string;
  content_ids: string[];
  value?: number;
  currency?: string;
}) => fire('track', 'AddToWishlist', { content_type: 'product', currency: 'INR', ...params });

/** Fires when a user completes registration. */
export const trackCompleteRegistration = (params?: FbqParams) =>
  fire('track', 'CompleteRegistration', params);

// ── Custom Events ────────────────────────────────────────────────────────────

/**
 * Generic helper for custom events not covered by Meta's standard list.
 * These show up under "Custom Conversions" in Events Manager.
 */
export const trackCustomEvent = (eventName: string, params?: FbqParams) =>
  fire('trackCustom', eventName, params);

// ── Backwards-compatible generic helper (used in CartContext etc.) ────────────
export const trackMetaEvent = (eventName: string, params?: FbqParams) =>
  fire('track', eventName, params);

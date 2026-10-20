/**
 * Meta Pixel (Facebook Pixel) tracking utility — THSIX.
 * Covers every Standard Event Meta recognises plus a custom event helper.
 *
 * Standard events reference:
 * https://developers.facebook.com/docs/meta-pixel/reference
 */

import { IS_DEV } from '../lib/config';

type FbqParams = Record<string, any>;

/**
 * Generate a unique event ID for browser-pixel ↔ CAPI deduplication.
 * Meta requires the same event_id on both the browser pixel call AND the
 * server-side Conversions API call for an event to be deduplicated.
 */
export function genEventId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const fire = (
  type: 'track' | 'trackCustom',
  event: string,
  params?: FbqParams,
  eventId?: string,
) => {
  if (typeof window !== 'undefined') {
    const eid = eventId || genEventId();
    if (IS_DEV) {
      console.log(`[Meta Pixel] ${type}: ${event}`, params ?? '', `event_id: ${eid}`);
    }
    if (typeof window.fbq === 'function') {
      // 4th arg is the event options object — required for CAPI deduplication
      if (params) {
        window.fbq(type, event, params, { eventID: eid });
      } else {
        window.fbq(type, event, {}, { eventID: eid });
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

/**
 * Fires when an order is confirmed. Pass the Shiprocket order id as eventId: the order webhook
 * sends the server-side (CAPI) Purchase with event_id = order id, so Meta deduplicates the two.
 */
export const trackPurchase = (params: {
  value: number;
  currency?: string;
  order_id?: string;
}, eventId?: string) => fire('track', 'Purchase', { currency: 'INR', ...params }, eventId);

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

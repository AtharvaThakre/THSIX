/**
 * Google Analytics 4 (GA4) tracking utility — THSIX.
 *
 * Loads gtag.js dynamically at runtime so nothing is added to the critical
 * HTML path. All calls guard against missing gtag / missing measurement ID
 * so the site works fine without GA4 configured.
 *
 * GA4 Enhanced Ecommerce events reference:
 * https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
 */

const MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;

// Extend Window for gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

let initialised = false;

// ── Initialisation ───────────────────────────────────────────────────────────

/**
 * Dynamically inject gtag.js and initialise GA4.
 * Safe to call multiple times — only loads once.
 */
export function initGA4(): void {
  if (initialised || !MEASUREMENT_ID || typeof window === 'undefined') return;
  initialised = true;

  // dataLayer + gtag stub (Google's standard bootstrap)
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false }); // we fire page_view manually

  // Async script load
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  if (import.meta.env.DEV) {
    console.log(`[GA4] Initialised with ${MEASUREMENT_ID}`);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fire(eventName: string, params?: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  if (import.meta.env.DEV) {
    console.log(`[GA4] ${eventName}`, params ?? '');
  }
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

/** Standard GA4 ecommerce item shape. */
export interface GA4Item {
  item_id: string;
  item_name: string;
  item_variant?: string;
  price: number;
  quantity: number;
  currency?: string;
}

// ── Ecommerce Events ─────────────────────────────────────────────────────────

export function trackGA4PageView(pagePath?: string, pageTitle?: string): void {
  fire('page_view', {
    page_path: pagePath || window.location.pathname,
    page_title: pageTitle || document.title,
  });
}

export function trackGA4ViewItem(item: GA4Item): void {
  fire('view_item', {
    currency: item.currency || 'INR',
    value: item.price,
    items: [{ ...item, currency: item.currency || 'INR' }],
  });
}

export function trackGA4AddToCart(item: GA4Item): void {
  fire('add_to_cart', {
    currency: item.currency || 'INR',
    value: item.price * item.quantity,
    items: [{ ...item, currency: item.currency || 'INR' }],
  });
}

export function trackGA4ViewCart(items: GA4Item[], value: number): void {
  fire('view_cart', {
    currency: 'INR',
    value,
    items: items.map(i => ({ ...i, currency: i.currency || 'INR' })),
  });
}

export function trackGA4BeginCheckout(items: GA4Item[], value: number): void {
  fire('begin_checkout', {
    currency: 'INR',
    value,
    items: items.map(i => ({ ...i, currency: i.currency || 'INR' })),
  });
}

export function trackGA4Purchase(transactionId: string, items: GA4Item[], value: number): void {
  fire('purchase', {
    transaction_id: transactionId,
    currency: 'INR',
    value,
    items: items.map(i => ({ ...i, currency: i.currency || 'INR' })),
  });
}

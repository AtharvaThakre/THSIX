/**
 * Google Analytics 4 (GA4) tracking utility — THSIX.
 *
 * gtag.js is injected only after the window load event and an idle period, so it stays off the
 * critical path. Config and events are queued on window.dataLayer before that, and gtag.js
 * processes the queue when it arrives, so nothing is lost. All calls guard against a missing
 * gtag / missing measurement ID so the site works fine without GA4 configured.
 *
 * GA4 Enhanced Ecommerce events reference:
 * https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
 */

import { GA4_MEASUREMENT_ID as MEASUREMENT_ID, IS_DEV } from '../lib/config';

// Extend Window for gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

let initialised = false;
let scriptRequested = false;

// ── Initialisation ───────────────────────────────────────────────────────────

/** Injects gtag.js once. Called after load + idle, never during the initial render. */
function loadGtagScript(): void {
  if (scriptRequested) return;
  scriptRequested = true;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

/**
 * Inject gtag.js after the window load event and an idle callback (max 3.5s after load).
 * A hard cap of 8s covers a load event that is held up by slow media.
 */
function scheduleGtagScript(): void {
  const whenIdle = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(loadGtagScript, { timeout: 3500 });
    } else {
      setTimeout(loadGtagScript, 1000);
    }
  };
  if (document.readyState === 'complete') {
    whenIdle();
  } else {
    window.addEventListener('load', whenIdle, { once: true });
  }
  setTimeout(loadGtagScript, 8000);
}

/**
 * Set up the dataLayer + gtag queue (Google's standard bootstrap) and queue the config and the
 * landing page_view, then schedule gtag.js. Safe to call multiple times: only initialises once.
 */
export function initGA4(): void {
  if (initialised || !MEASUREMENT_ID || typeof window === 'undefined') return;
  initialised = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false }); // we fire page_view manually
  // Landing page view; later navigations are sent by <ScrollToTop> in root.tsx
  window.gtag('event', 'page_view', {
    page_path: window.location.pathname,
    page_title: document.title,
  });

  scheduleGtagScript();

  if (IS_DEV) {
    console.log(`[GA4] Initialised with ${MEASUREMENT_ID}`);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fire(eventName: string, params?: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  if (IS_DEV) {
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

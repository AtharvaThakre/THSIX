// On-demand loader for Shiprocket's Custom-channel checkout (window.HeadlessCheckout).
// Nothing loads on page view: the script and its stylesheet are injected only when the shopper
// shows checkout intent (cart opens, an item is added, checkout is hovered or focused) or, as a
// fallback, when Checkout / Buy Now is clicked. The script loads its own fastrr iframe and chunks,
// so keeping it off the homepage keeps that JS out of the initial page load.
// Injecting a second copy registers every listener twice and breaks the checkout modal, so the
// script is inserted at most once per page (a failed load is removed so a retry can insert it again).
const SCRIPT_SRC = 'https://checkout-ui.shiprocket.com/assets/js/channels/shopify.js';
const STYLE_HREF = 'https://checkout-ui.shiprocket.com/assets/styles/shopify.css';
const SELLER_DOMAIN = 'thsix.com';

let loadPromise: Promise<void> | null = null;

const isReady = () => typeof (window as any).HeadlessCheckout?.addToCart === 'function';

export const loadPickrrScript = (): Promise<void> => {
  if (isReady()) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    // Shiprocket identifies the merchant by this input's value. root.tsx renders it in SSR;
    // this is only a fallback in case it is missing.
    if (!document.getElementById('sellerDomain')) {
      const sellerDomainInput = document.createElement('input');
      sellerDomainInput.type = 'hidden';
      sellerDomainInput.value = SELLER_DOMAIN;
      sellerDomainInput.id = 'sellerDomain';
      document.body.appendChild(sellerDomainInput);
    }

    // Stylesheet goes in with the script, not in the document head at page load
    if (!document.querySelector(`link[href="${STYLE_HREF}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = STYLE_HREF;
      document.head.appendChild(link);
    }

    let script = document.querySelector(`script[src="${SCRIPT_SRC}"]`) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.defer = true;
      document.head.appendChild(script);
    }

    // The script may already have executed, so poll for the global rather than relying
    // solely on the load event.
    const started = Date.now();
    const timer = setInterval(() => {
      if (isReady()) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - started > 15000) {
        clearInterval(timer);
        loadPromise = null;
        reject(new Error('Failed to load Shiprocket checkout script'));
      }
    }, 100);

    script.addEventListener('error', () => {
      clearInterval(timer);
      // Remove the failed tag so the next attempt inserts a fresh one instead of waiting on a dead element
      script?.remove();
      loadPromise = null;
      reject(new Error('Failed to load Shiprocket checkout script'));
    });
  });

  return loadPromise;
};

/**
 * Start loading the checkout script in the background when the shopper shows intent.
 * Never throws or rejects: a failed warm-up is retried by the Checkout click itself.
 */
export const warmUpPickrrScript = (): void => {
  if (isReady() || loadPromise) return;
  loadPickrrScript().catch(() => {});
};

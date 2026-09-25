// Load the Pickrr/Shiprocket checkout script exactly once.
// index.html already includes it, so this normally just waits for that copy.
// Injecting a second copy registers every listener twice and breaks the checkout modal.
const SCRIPT_SRC = 'https://fastrr-boost-ui.pickrr.com/assets/js/channels/shopify.js';
const STYLE_HREF = 'https://fastrr-boost-ui.pickrr.com/assets/styles/shopify.css';
const SELLER_DOMAIN = 'thsix.com';

let loadPromise: Promise<void> | null = null;

const isReady = () => typeof (window as any).HeadlessCheckout?.addToCart === 'function';

export const loadPickrrScript = (): Promise<void> => {
  if (isReady()) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    // Shiprocket identifies the merchant by this input's value
    if (!document.getElementById('sellerDomain')) {
      const sellerDomainInput = document.createElement('input');
      sellerDomainInput.type = 'hidden';
      sellerDomainInput.value = SELLER_DOMAIN;
      sellerDomainInput.id = 'sellerDomain';
      document.body.appendChild(sellerDomainInput);
    }

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

    // The script may already have executed (tag from index.html), so poll for the global
    // rather than relying solely on the load event.
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
      loadPromise = null;
      reject(new Error('Failed to load Shiprocket checkout script'));
    });
  });

  return loadPromise;
};

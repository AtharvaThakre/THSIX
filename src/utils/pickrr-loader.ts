// Lazy load Pickrr/Shiprocket scripts only when needed for checkout
let pickrrLoaded = false;
let pickrrLoading = false;

export const loadPickrrScript = (): Promise<void> => {
  if (pickrrLoaded) {
    return Promise.resolve();
  }

  if (pickrrLoading) {
    // Return existing promise if already loading
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (pickrrLoaded) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  pickrrLoading = true;

  return new Promise((resolve, reject) => {
    // Check if sellerDomain already exists (from index.html)
    const existingDomain = document.getElementById('sellerDomain');
    if (!existingDomain) {
      const sellerDomainInput = document.createElement('input');
      sellerDomainInput.type = 'hidden';
      sellerDomainInput.value = 'thsix.com';
      sellerDomainInput.id = 'sellerDomain';
      document.body.appendChild(sellerDomainInput);
    }

    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fastrr-boost-ui.pickrr.com/assets/styles/shopify.css';
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement('script');
    script.src = 'https://fastrr-boost-ui.pickrr.com/assets/js/channels/shopify.js';
    script.defer = true;
    script.onload = () => {
      pickrrLoaded = true;
      pickrrLoading = false;
      resolve();
    };
    script.onerror = () => {
      pickrrLoading = false;
      reject(new Error('Failed to load Pickrr script'));
    };
    document.head.appendChild(script);
  });
};

// Utility to ensure all Shopify variants are loaded and displayed
export const forceLoadAllVariants = () => {
  const loadVariants = () => {
    const variantSelectors = document.querySelectorAll('shopify-variant-selector');
    
    variantSelectors.forEach((selector) => {
      // Set attributes to show all variants
      selector.setAttribute('include-unavailable', 'true');
      selector.setAttribute('show-unavailable', 'true');
      selector.setAttribute('show-sold-out', 'true');
      
      // Try to trigger a re-render
      const event = new CustomEvent('variantchange', {
        bubbles: true,
        detail: { 
          forceRefresh: true,
          showAll: true 
        }
      });
      selector.dispatchEvent(event);
      
      // Also try dispatching a more generic refresh event
      const refreshEvent = new CustomEvent('refresh', { bubbles: true });
      selector.dispatchEvent(refreshEvent);
    });
    
    // Also check if there are any hidden variants we need to unhide
    const hiddenVariants = document.querySelectorAll('[style*="display: none"], [hidden]');
    hiddenVariants.forEach((element) => {
      if (element.textContent?.match(/\d+(\.\d+)?(\/\d+)?|UK\s*\d+|EU\s*\d+|Size\s*\d+/i)) {
        // This looks like a size variant, unhide it
        (element as HTMLElement).style.display = '';
        element.removeAttribute('hidden');
      }
    });
  };

  // Run immediately and also with delays to catch dynamic content
  loadVariants();
  setTimeout(loadVariants, 100);
  setTimeout(loadVariants, 500);
  setTimeout(loadVariants, 1000);
  setTimeout(loadVariants, 2000);
  
  // Also set up a mutation observer to catch new variant selectors
  const observer = new MutationObserver(() => {
    loadVariants();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'hidden', 'class']
  });
  
  return () => observer.disconnect();
};

// Function to manually refresh product data from Shopify
export const refreshProductData = async (handle: string) => {
  try {
    const storeElement = document.querySelector('shopify-store') as any;
    if (storeElement && storeElement.refreshProduct) {
      await storeElement.refreshProduct(handle);
    }
    
    // Force re-render of variant selectors
    forceLoadAllVariants();
    
  } catch (error) {
    console.warn('Could not refresh product data:', error);
    // Fallback to forcing variant display
    forceLoadAllVariants();
  }
};
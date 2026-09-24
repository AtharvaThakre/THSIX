/**
 * Shiprocket Buy Now Handler
 * Intercepts "Buy Now" clicks and routes them through Shiprocket instead of Shopify
 */

import { loadPickrrScript } from './pickrr-loader';
import { waitForShiprocket, checkoutFromCart } from '../services/shiprocket-shopify';

/**
 * Handle Buy Now button click
 * Prevents default Shopify behavior and uses Shiprocket instead
 */
export async function handleBuyNow(event: Event): Promise<void> {
  event.preventDefault();
  event.stopPropagation();

  try {
    console.log('Buy Now clicked - using Shiprocket checkout');

    // Step 1: Get the selected variant ID from multiple possible sources
    let variantId = '';
    
    // First check if we tracked it globally
    if ((window as any).selectedVariantId) {
      const tracked = (window as any).selectedVariantId;
      if (tracked && tracked.length >= 8) {
        variantId = tracked;
        console.log('Variant ID from global tracker:', variantId);
      }
    }
    
    // Method 1: Try shopify-store (most reliable)
    if (!variantId || variantId.length < 8) {
      try {
        const shopifyStore = document.querySelector('shopify-store');
        if (shopifyStore) {
          // Try multiple ways to access the product data
          const productData = (shopifyStore as any).product || 
                            (shopifyStore as any).__product ||
                            (shopifyStore as any).state?.product;
          
          if (productData?.selectedOrFirstAvailableVariant?.id) {
            const id = productData.selectedOrFirstAvailableVariant.id;
            variantId = typeof id === 'number' ? id.toString() : id;
            console.log('Variant ID from shopify-store:', variantId);
          } else if (productData?.selectedVariant?.id) {
            const id = productData.selectedVariant.id;
            variantId = typeof id === 'number' ? id.toString() : id;
            console.log('Variant ID from shopify-store (selectedVariant):', variantId);
          }
        }
      } catch (e) {
        console.warn('Could not get variant from shopify-store', e);
      }
    }
    
    // Method 2: Try to get from product-form input
    if (!variantId || variantId.length < 8) {
      const form = document.querySelector('product-form form') as HTMLFormElement;
      const variantInput = form?.querySelector('input[name="id"]') as HTMLInputElement;
      if (variantInput?.value && variantInput.value.length >= 8) {
        variantId = variantInput.value;
        console.log('Variant ID from form input:', variantId);
      }
    }
    
    // Method 2: Try to get from URL params (when variant is in URL)
    if (!variantId) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlVariant = urlParams.get('variant');
      if (urlVariant) {
        variantId = urlVariant;
        console.log('Variant ID from URL:', variantId);
      }
    }
    
    // Method 3: Try to get from Shopify context (product data)
    if (!variantId) {
      try {
        const shopifyContext = document.querySelector('shopify-context[type="product"]');
        if (shopifyContext) {
          // Look for selected variant in shadow DOM or attributes
          const shadowRoot = shopifyContext.shadowRoot;
          if (shadowRoot) {
            const variantEl = shadowRoot.querySelector('[data-variant-id]');
            if (variantEl) {
              variantId = variantEl.getAttribute('data-variant-id') || '';
            }
          }
        }
      } catch (e) {
        console.warn('Could not get variant from Shopify context', e);
      }
    }
    
    // Method 4: Try to get from shopify-variant-selector
    if (!variantId) {
      const variantSelector = document.querySelector('shopify-variant-selector');
      if (variantSelector) {
        // Check shadow root for selected option
        const shadowRoot = variantSelector.shadowRoot;
        if (shadowRoot) {
          const selected = shadowRoot.querySelector('input[type="radio"]:checked, button[aria-checked="true"]') as HTMLElement;
          if (selected) {
            variantId = selected.getAttribute('value') || 
                       selected.getAttribute('data-variant-id') || 
                       selected.getAttribute('data-value') || '';
            console.log('Variant ID from variant selector:', variantId);
          }
        }
        
        // Also check regular DOM
        if (!variantId) {
          const selected = variantSelector.querySelector('input[type="radio"]:checked, button[aria-checked="true"]') as HTMLElement;
          if (selected) {
            variantId = selected.getAttribute('value') || 
                       selected.getAttribute('data-variant-id') || 
                       selected.getAttribute('data-value') || '';
            console.log('Variant ID from variant selector (DOM):', variantId);
          }
        }
      }
    }
    
    // Method 5: Get the first available variant as fallback
    if (!variantId || variantId.length < 8) {
      try {
        const productDataEl = document.querySelector('script[type="application/json"][data-product-json]');
        if (productDataEl) {
          const productData = JSON.parse(productDataEl.textContent || '{}');
          if (productData.variants && productData.variants.length > 0) {
            // Get first available variant
            const firstAvailable = productData.variants.find((v: any) => v.available);
            if (firstAvailable) {
              variantId = firstAvailable.id.toString();
              console.warn('No variant selected, using first available:', variantId);
            } else {
              // If no available, just use first variant
              variantId = productData.variants[0].id.toString();
              console.warn('Using first variant (may be unavailable):', variantId);
            }
          }
        }
      } catch (e) {
        console.warn('Could not get first available variant', e);
      }
    }
    
    // Final validation: must be a numeric ID (at least 8 digits)
    if (!variantId || variantId.length < 8 || isNaN(Number(variantId))) {
      console.error('Invalid or missing variant ID:', {
        variantId,
        length: variantId?.length,
        isNumeric: variantId ? !isNaN(Number(variantId)) : false,
        globalTracker: (window as any).selectedVariantId,
      });
      
      alert('Unable to determine product variant. Please try:\n1. Refresh the page\n2. Select a size again\n3. Wait a moment after selecting before clicking Buy Now');
      return;
    }

    console.log('Final selected variant ID:', variantId);

    // Step 2: Show loading state on button
    const buyButton = event.target as HTMLButtonElement;
    const originalText = buyButton.textContent;
    buyButton.disabled = true;
    buyButton.textContent = 'Loading...';

    // Step 3: Load Shiprocket script if not loaded
    await loadPickrrScript();

    // Step 4: Wait for Shiprocket to be ready
    const isReady = await waitForShiprocket(10000);
    
    if (!isReady) {
      throw new Error('Checkout service is not available. Please refresh the page and try again.');
    }

    console.log('Shiprocket ready, initiating Buy Now checkout');

    // Step 5: First sync to Shopify cart, then trigger Shiprocket
    // Shiprocket reads from Shopify's cart, so we need to add the item there first
    try {
      const shopifyDomain = '19sjnp-gx.myshopify.com';
      const response = await fetch(`https://${shopifyDomain}/cart/add.js`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{
            id: variantId,
            quantity: 1
          }]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add to Shopify cart');
      }

      console.log('Added to Shopify cart, now triggering Shiprocket');
      
      // Small delay to let Shopify cart update
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.warn('Could not add to Shopify cart:', error);
    }

    // Step 6: Trigger Shiprocket checkout from cart
    checkoutFromCart();

    console.log('Shiprocket Buy Now initiated');

    // Reset button after a delay
    setTimeout(() => {
      buyButton.disabled = false;
      buyButton.textContent = originalText || 'Buy Now';
    }, 3000);

  } catch (error) {
    console.error('Buy Now error:', error);
    alert(
      error instanceof Error 
        ? error.message 
        : 'Failed to initiate checkout. Please try again.'
    );

    // Reset button on error
    const buyButton = event.target as HTMLButtonElement;
    buyButton.disabled = false;
    buyButton.textContent = 'Buy Now';
  }
}

/**
 * Initialize Buy Now handler globally
 * Call this once when the app loads
 */
export function initializeBuyNowHandler(): void {
  (window as any).handleBuyNow = handleBuyNow;
  
  // Also track selected variant globally for easy access
  (window as any).selectedVariantId = null;
  
  // Listen for variant changes from Shopify web components
  document.addEventListener('variant:change', (e: any) => {
    if (e.detail?.variantId || e.detail?.id) {
      (window as any).selectedVariantId = e.detail.variantId || e.detail.id;
      console.log('Variant changed:', (window as any).selectedVariantId);
    }
  });
  
  // Also listen for shopify-variant-selector changes
  const observeVariantSelector = () => {
    const variantSelector = document.querySelector('shopify-variant-selector');
    if (variantSelector) {
      variantSelector.addEventListener('change', (e: any) => {
        const target = e.target as HTMLElement;
        const variantId = target.getAttribute('value') || 
                         target.getAttribute('data-variant-id') ||
                         (e.detail?.variantId);
        if (variantId) {
          (window as any).selectedVariantId = variantId;
          console.log('Variant selector changed:', variantId);
        }
      });
    }
  };
  
  // Try to observe immediately and after a delay
  observeVariantSelector();
  setTimeout(observeVariantSelector, 1000);
  
  console.log('Shiprocket Buy Now handler initialized');
}

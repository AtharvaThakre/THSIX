/**
 * Shiprocket Buy Now Handler
 * Intercepts "Buy Now" clicks and routes them through Shiprocket instead of Shopify
 */

import { loadPickrrScript } from './pickrr-loader';
import { waitForShiprocket, checkoutWithProducts } from '../services/shiprocket-shopify';

/**
 * Handle Buy Now button click
 * Prevents default Shopify behavior and uses Shiprocket instead
 */
export async function handleBuyNow(event: Event): Promise<void> {
  event.preventDefault();
  event.stopPropagation();

  try {
    console.log('Buy Now clicked - using Shiprocket checkout');

    // Step 1: Get the selected variant ID from the form
    const form = document.querySelector('product-form form') as HTMLFormElement;
    const variantInput = form?.querySelector('input[name="id"]') as HTMLInputElement;
    
    if (!variantInput || !variantInput.value) {
      alert('Please select a size before buying');
      return;
    }

    const variantId = variantInput.value;
    console.log('Selected variant ID:', variantId);

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

    // Step 5: Trigger Shiprocket Buy Now with the product
    checkoutWithProducts([{
      variantId: variantId,
      quantity: 1
    }]);

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
  console.log('Shiprocket Buy Now handler initialized');
}

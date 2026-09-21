/**
 * Shiprocket Checkout Service - Shopify Integration
 * Uses the Shopify + Shiprocket combined approach
 */

interface ShiprocketCheckoutParams {
  type: 'cart' | 'product';
  products?: Array<{
    variantId: string;
    quantity: number;
  }>;
  couponCode?: string;
  utmParams?: string;
  cartAttributes?: Record<string, any>;
}

/**
 * Initiate Shiprocket checkout using the Shopify integration
 * This uses the shiprocketCheckoutEvents.buyDirect() function from their script
 */
export function initiateShiprocketCheckout(params: ShiprocketCheckoutParams): void {
  // Check if the Shiprocket function is available
  if (typeof (window as any).shiprocketCheckoutEvents === 'undefined') {
    console.error('Shiprocket checkout script not loaded');
    alert('Checkout is temporarily unavailable. Please refresh the page and try again.');
    return;
  }

  const shiprocketEvents = (window as any).shiprocketCheckoutEvents;

  // Prepare the checkout parameters
  const checkoutParams: any = {
    type: params.type,
  };

  // Add products if provided (for product type)
  if (params.products && params.products.length > 0) {
    checkoutParams.products = params.products.map(item => ({
      variantId: item.variantId,
      quantity: item.quantity,
    }));
  }

  // Add optional parameters
  if (params.couponCode) {
    checkoutParams.couponCode = params.couponCode;
  }

  if (params.utmParams) {
    checkoutParams.utmParams = params.utmParams;
  }

  if (params.cartAttributes) {
    checkoutParams.cartAttributes = params.cartAttributes;
  }

  try {
    // Call the Shiprocket checkout function
    shiprocketEvents.buyDirect(checkoutParams);
    console.log('Shiprocket checkout initiated:', checkoutParams);
  } catch (error) {
    console.error('Error initiating Shiprocket checkout:', error);
    alert('Failed to start checkout. Please try again.');
  }
}

/**
 * Start checkout from cart
 * Uses the current cart state
 */
export function checkoutFromCart(): void {
  initiateShiprocketCheckout({
    type: 'cart',
  });
}

/**
 * Start checkout with specific products
 * Useful for "Buy Now" buttons
 */
export function checkoutWithProducts(
  products: Array<{ variantId: string; quantity: number }>,
  couponCode?: string
): void {
  initiateShiprocketCheckout({
    type: 'product',
    products,
    couponCode,
  });
}

/**
 * Check if Shiprocket is loaded and ready
 */
export function isShiprocketReady(): boolean {
  return typeof (window as any).shiprocketCheckoutEvents !== 'undefined';
}

/**
 * Wait for Shiprocket to be ready
 */
export function waitForShiprocket(timeout = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isShiprocketReady()) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isShiprocketReady()) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 100);
  });
}

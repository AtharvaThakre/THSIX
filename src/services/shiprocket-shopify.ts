/**
 * Shiprocket Checkout Service - Shopify Integration
 * Uses the Shopify + Shiprocket combined approach
 */

interface ShiprocketCheckoutParams {
  type: 'cart' | 'product';
  products?: Array<{
    variantId: string;  // Must be numeric Shopify variant ID
    quantity: number;
  }>;
  couponCode?: string;
  utmParams?: string;
  cartAttributes?: Record<string, any>;
}

/**
 * Extract numeric variant ID from various formats
 */
function extractNumericVariantId(variantId: string | number): string {
  if (typeof variantId === 'number') {
    return variantId.toString();
  }
  
  // Remove GID prefix if present
  if (variantId.includes('ProductVariant/')) {
    return variantId.split('ProductVariant/').pop() || variantId;
  }
  
  // Extract numeric part
  const numericMatch = variantId.match(/\d{8,}/);
  return numericMatch ? numericMatch[0] : variantId;
}

/**
 * Initiate Shiprocket checkout using the Shopify integration
 * This uses the shiprocketCheckoutEvents.buyDirect() function from their script
 */
export function initiateShiprocketCheckout(params: ShiprocketCheckoutParams): void {
  // Check if the Shiprocket function is available
  if (typeof (window as any).shiprocketCheckoutEvents === 'undefined') {
    console.error('Shiprocket checkout script not loaded');
    console.log('Available window properties:', Object.keys(window).filter(k => k.toLowerCase().includes('ship') || k.toLowerCase().includes('pickrr')));
    throw new Error('Checkout service is not available. Please refresh the page and try again.');
  }

  const shiprocketEvents = (window as any).shiprocketCheckoutEvents;

  // Validate parameters based on checkout type
  if (params.type === 'product') {
    if (!params.products || params.products.length === 0) {
      throw new Error('Products array is required for product checkout');
    }
    
    // Validate each product has valid variant ID
    for (const product of params.products) {
      if (!product.variantId || product.variantId.length < 8) {
        throw new Error('Invalid variant ID for product checkout');
      }
      if (!product.quantity || product.quantity < 1) {
        throw new Error('Invalid quantity for product checkout');
      }
    }
  }

  // Prepare the checkout parameters
  const checkoutParams: any = {
    type: params.type,
  };

  // Add products if provided (for product type)
  // Ensure all variant IDs are in numeric format
  if (params.products && params.products.length > 0) {
    checkoutParams.products = params.products.map(item => ({
      variantId: extractNumericVariantId(item.variantId),
      quantity: item.quantity,
    }));
    
    console.log('Product checkout - variant IDs:', checkoutParams.products.map((p: any) => p.variantId));
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

  console.log('Shiprocket buyDirect() params:', JSON.stringify(checkoutParams, null, 2));

  try {
    // Call the Shiprocket checkout function
    shiprocketEvents.buyDirect(checkoutParams);
    console.log('Shiprocket checkout initiated successfully');
  } catch (error) {
    console.error('Error initiating Shiprocket checkout:', error);
    throw new Error('Failed to start checkout. Please try again.');
  }
}

/**
 * Start checkout from cart
 * Uses the current Shopify cart state
 */
export function checkoutFromCart(): void {
  console.log('Initiating cart checkout...');
  initiateShiprocketCheckout({
    type: 'cart',
  });
}

/**
 * Start checkout with specific products (Buy Now flow)
 * Directly passes product data without cart sync
 */
export function checkoutWithProducts(
  products: Array<{ variantId: string; quantity: number }>,
  couponCode?: string
): void {
  console.log('Initiating direct product checkout...');
  
  if (!products || products.length === 0) {
    throw new Error('No products provided for checkout');
  }

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
 * Wait for Shiprocket to be ready with timeout
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
        console.error('Shiprocket script load timeout');
        resolve(false);
      }
    }, 100);
  });
}

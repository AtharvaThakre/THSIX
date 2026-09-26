/**
 * Shiprocket Checkout Service
 *
 * THSIX is a "Custom" channel seller in Shiprocket Checkout (not a Shopify one), so checkout
 * starts from a token signed by our server (/api/checkout/token) and is opened with
 * HeadlessCheckout.addToCart(). The Shopify-channel shiprocketCheckoutEvents.buyDirect()
 * fails for this seller with "catalogue service response is null".
 */

type CheckoutItem = {
  variantId: string; // Numeric Shopify variant ID
  quantity: number;
};

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
 * Get a checkout token from our server and open the Shiprocket checkout.
 */
export async function initiateShiprocketCheckout(
  products: CheckoutItem[],
  fallbackUrl: string = window.location.href
): Promise<void> {
  const headless = (window as any).HeadlessCheckout;
  if (typeof headless?.addToCart !== 'function') {
    throw new Error('Checkout service is not available. Please refresh the page and try again.');
  }

  if (!products || products.length === 0) {
    throw new Error('Your cart is empty.');
  }

  const items = products.map(p => ({
    variant_id: extractNumericVariantId(p.variantId),
    quantity: p.quantity,
  }));

  for (const item of items) {
    if (!/^\d{8,}$/.test(item.variant_id)) {
      throw new Error('Invalid product in cart. Please remove and re-add it.');
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new Error('Invalid quantity for checkout.');
    }
  }

  const response = await fetch('/api/checkout/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items,
      redirect_url: `${window.location.origin}/checkout/success`,
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.token) {
    throw new Error(data?.message || 'Checkout is unavailable right now. Please try again.');
  }

  // fallbackUrl: where Shiprocket sends the shopper if its checkout can't load
  headless.addToCart(null, data.token, { fallbackUrl });
}

/**
 * Start checkout from the React cart.
 */
export function checkoutFromCart(products: CheckoutItem[]): Promise<void> {
  return initiateShiprocketCheckout(products);
}

/**
 * Start checkout with specific products (Buy Now flow)
 */
export function checkoutWithProducts(products: CheckoutItem[]): Promise<void> {
  return initiateShiprocketCheckout(products);
}

/**
 * Check if Shiprocket is loaded and ready
 */
export function isShiprocketReady(): boolean {
  return typeof (window as any).HeadlessCheckout?.addToCart === 'function';
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

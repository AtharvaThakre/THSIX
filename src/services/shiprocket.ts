/**
 * Shiprocket Checkout Service
 * Handles communication with Shiprocket checkout APIs
 */

interface CheckoutCartItem {
  variant_id: string;
  quantity: number;
}

interface CheckoutResponse {
  ok: boolean;
  result?: {
    token: string;
    order_id: string;
  };
  message?: string;
}

/**
 * Generate access token and initiate checkout
 */
export async function initiateCheckout(
  cartItems: CheckoutCartItem[],
  redirectUrl?: string
): Promise<CheckoutResponse> {
  try {
    const response = await fetch('/api/checkout/access-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cart_data: {
          items: cartItems,
        },
        redirect_url: redirectUrl,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to initiate checkout');
    }

    return data;
  } catch (error) {
    console.error('Error initiating checkout:', error);
    throw error;
  }
}

/**
 * Fetch order details by order ID
 */
export async function fetchOrderDetails(orderId: string): Promise<any> {
  try {
    const response = await fetch('/api/checkout/order-details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: orderId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch order details');
    }

    return data.result;
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error;
  }
}

/**
 * Open Shiprocket checkout iframe
 */
export function openShiprocketCheckout(token: string, redirectUrl: string): void {
  // Check if HeadlessCheckoutBuyNow function exists
  if (typeof (window as any).HeadlessCheckoutBuyNow === 'function') {
    (window as any).HeadlessCheckoutBuyNow(token, redirectUrl);
  } else {
    console.error('Shiprocket checkout script not loaded');
    throw new Error('Shiprocket checkout is not available. Please refresh the page.');
  }
}

/**
 * Load Shiprocket checkout script dynamically
 */
export function loadShiprocketScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script already exists
    if (document.getElementById('shiprocket-checkout-script')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'shiprocket-checkout-script';
    script.src = 'https://sr-cdn.shiprocket.in/sr-promise/assets/slr-js/shiprocket-checkout.min.js';
    script.async = true;

    script.onload = () => {
      console.log('Shiprocket checkout script loaded');
      resolve();
    };

    script.onerror = () => {
      console.error('Failed to load Shiprocket checkout script');
      reject(new Error('Failed to load checkout script'));
    };

    document.body.appendChild(script);
  });
}

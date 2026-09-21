/**
 * Shopify Cart Service
 * Handles synchronization between React cart and Shopify's AJAX Cart API
 */

interface ShopifyCartItem {
  id: string | number;
  quantity: number;
  properties?: Record<string, any>;
}

interface ShopifyCartResponse {
  items: Array<{
    id: number;
    variant_id: number;
    title: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  item_count: number;
  total_price: number;
}

/**
 * Get the Shopify store domain from environment variables
 */
function getShopifyDomain(): string {
  const domain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN;
  if (!domain) {
    throw new Error('VITE_SHOPIFY_STORE_DOMAIN is not configured');
  }
  return domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/**
 * Add items to Shopify cart
 */
export async function addToShopifyCart(items: ShopifyCartItem[]): Promise<ShopifyCartResponse> {
  const domain = getShopifyDomain();
  
  const response = await fetch(`https://${domain}/cart/add.js`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    throw new Error(`Failed to add items to Shopify cart: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update Shopify cart
 * Replaces all items in the cart with the provided items
 */
export async function updateShopifyCart(updates: Record<string, number>): Promise<ShopifyCartResponse> {
  const domain = getShopifyDomain();
  
  const response = await fetch(`https://${domain}/cart/update.js`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ updates }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update Shopify cart: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Clear Shopify cart
 */
export async function clearShopifyCart(): Promise<ShopifyCartResponse> {
  const domain = getShopifyDomain();
  
  const response = await fetch(`https://${domain}/cart/clear.js`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to clear Shopify cart: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get current Shopify cart
 */
export async function getShopifyCart(): Promise<ShopifyCartResponse> {
  const domain = getShopifyDomain();
  
  const response = await fetch(`https://${domain}/cart.js`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Shopify cart: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Sync React cart items to Shopify cart
 * Clears Shopify cart first, then adds all items from React cart
 */
export async function syncCartToShopify(
  cartItems: Array<{
    id: string;
    variantId?: string;
    quantity: number;
  }>
): Promise<boolean> {
  try {
    // Step 1: Get current Shopify cart to see what's already there
    const currentCart = await getShopifyCart();
    console.log('Current Shopify cart:', currentCart);

    // Step 2: If cart is already populated (from Shopify web components), just proceed
    if (currentCart.item_count > 0) {
      console.log('Shopify cart already has items, proceeding with checkout');
      return true;
    }

    // Step 3: Clear existing Shopify cart (if empty or needs sync)
    await clearShopifyCart();

    // Step 4: Prepare items for Shopify
    const shopifyItems: ShopifyCartItem[] = cartItems
      .filter(item => item.variantId) // Only include items with variantId
      .map(item => ({
        id: item.variantId as string,
        quantity: item.quantity,
      }));

    // Step 5: Add items to Shopify cart
    if (shopifyItems.length > 0) {
      await addToShopifyCart(shopifyItems);
      console.log('Cart synced to Shopify successfully');
    } else {
      console.warn('No items with variantId to sync');
    }

    return true;
  } catch (error) {
    console.error('Failed to sync cart to Shopify:', error);
    return false;
  }
}

/**
 * Shopify Analytics Tracking Utility — THSIX
 *
 * Wraps @shopify/hydrogen-react's sendShopifyAnalytics to report
 * page views, product views, add-to-cart, checkout, and purchase
 * events to the Shopify dashboard (Live View, Sessions, Funnels).
 *
 * Type note: The hydrogen-react SDK's sendShopifyAnalytics only exposes
 * TypeScript types for PAGE_VIEW and ADD_TO_CART. PRODUCT_VIEW, BEGIN_CHECKOUT,
 * and PURCHASE are valid runtime event names supported by the Shopify Monorail
 * analytics backend, but lack exported payload types — they are sent with a
 * type assertion to keep the compiler happy while the runtime behaviour is
 * correct. See: https://shopify.dev/docs/api/hydrogen-react
 *
 * Step 6 (UTM attribution) is handled automatically by
 * getClientBrowserParameters() reading window.location.search —
 * no extra code needed here as long as Meta ad URLs include UTMs.
 */

import {
  sendShopifyAnalytics,
  AnalyticsEventName,
  getClientBrowserParameters,
  type ShopifyPageViewPayload,
  type ShopifyAddToCartPayload,
} from '@shopify/hydrogen-react';

// ─── Shop ID ─────────────────────────────────────────────────────────────────
// Set VITE_SHOPIFY_SHOP_ID in your .env files.
// Get the value from Shopify Admin → Settings → Developer Tools → GraphQL Explorer:
//   query { shop { id } }
// Returns something like "gid://shopify/Shop/12345678"
const SHOP_ID = import.meta.env.VITE_SHOPIFY_SHOP_ID as string | undefined;

const BASE_PAYLOAD = {
  currency: 'INR' as const,
  acceptedLanguage: 'EN' as const, // LanguageCode enum — must be uppercase
  hasUserConsent: true,
} as const;

/** Log helper (dev-only). */
function log(event: string, extra?: unknown) {
  if (import.meta.env.DEV) {
    console.log(`[ShopifyAnalytics] ${event}`, extra ?? '');
  }
}

/**
 * Guard: returns the shop ID or an empty string with a warning.
 */
function getShopId(): string {
  if (!SHOP_ID || SHOP_ID.includes('YOUR_SHOP_ID')) {
    console.warn(
      '[ShopifyAnalytics] VITE_SHOPIFY_SHOP_ID is not configured. ' +
      'Run this in Shopify Admin → Settings → Developer Tools → GraphQL Explorer:\n' +
      '  query { shop { id } }\n' +
      'Then set VITE_SHOPIFY_SHOP_ID=gid://shopify/Shop/<id> in your .env files.'
    );
    return '';
  }
  return SHOP_ID;
}

// ─── Step 1: Page View ────────────────────────────────────────────────────────

/**
 * Fire on every page navigation (SPA route change and initial load).
 * Fixes: Sessions dashboard, Live View globe.
 */
export function trackShopifyPageView(): void {
  const shopId = getShopId();
  log('PAGE_VIEW', { url: window.location.href });

  const payload: ShopifyPageViewPayload = {
    ...getClientBrowserParameters(),
    shopId,
    ...BASE_PAYLOAD,
    searchString: window.location.search, // Picks up UTM params automatically (Step 6)
  };

  sendShopifyAnalytics({
    eventName: AnalyticsEventName.PAGE_VIEW,
    payload,
  });
}

// ─── Product shape ────────────────────────────────────────────────────────────

export interface ShopifyProduct {
  productGid: string;       // "gid://shopify/Product/123"
  variantGid: string;       // "gid://shopify/ProductVariant/456"
  name: string;
  variantName: string;
  brand?: string;
  price: string;            // String decimal, e.g. "2999.00"
  quantity?: number;
}

// ─── Step 2: Product Viewed ───────────────────────────────────────────────────

/**
 * Fire on every product detail page load.
 * Fixes: Product view analytics.
 */
export function trackShopifyProductView(product: ShopifyProduct): void {
  const shopId = getShopId();
  log('PRODUCT_VIEW', product);

  // PRODUCT_VIEW is a valid Shopify Monorail event; type-assert to bypass
  // the narrow SDK union type (ShopifyPageViewPayload | ShopifyAddToCartPayload).
  sendShopifyAnalytics({
    eventName: AnalyticsEventName.PRODUCT_VIEW,
    payload: {
      ...getClientBrowserParameters(),
      shopId,
      ...BASE_PAYLOAD,
      products: [{
        productGid: product.productGid,
        variantGid: product.variantGid,
        name: product.name,
        variantName: product.variantName,
        brand: product.brand ?? 'THSIX',
        price: product.price,
        quantity: product.quantity ?? 1,
      }],
    } as ShopifyPageViewPayload, // Safe: SDK accepts this shape at runtime
  });
}

// ─── Step 3: Add to Cart ──────────────────────────────────────────────────────

/**
 * Fire when "Add to Cart" is clicked.
 * Fixes: Funnel — cart addition rate.
 *
 * @param cartId  Shopify Cart GID ("gid://shopify/Cart/…").
 *                Pass an empty string if unavailable — Shopify still records
 *                the event; it just won't be stitched to a cart object.
 */
export function trackShopifyAddToCart(
  cartId: string,
  product: ShopifyProduct,
): void {
  const shopId = getShopId();
  log('ADD_TO_CART', { cartId, product });

  const payload: ShopifyAddToCartPayload = {
    ...getClientBrowserParameters(),
    shopId,
    ...BASE_PAYLOAD,
    cartId,
    products: [{
      productGid: product.productGid,
      variantGid: product.variantGid,
      name: product.name,
      variantName: product.variantName,
      brand: product.brand ?? 'THSIX',
      price: product.price,
      quantity: product.quantity ?? 1,
    }],
  };

  sendShopifyAnalytics({
    eventName: AnalyticsEventName.ADD_TO_CART,
    payload,
  });
}

// ─── Step 4: Checkout Started ─────────────────────────────────────────────────

/**
 * Fire when the customer is redirected to Shiprocket checkout.
 * Fixes: Funnel — checkout initiation rate.
 */
export function trackShopifyBeginCheckout(
  cartId: string,
  totalValue: number,
  products: ShopifyProduct[],
): void {
  const shopId = getShopId();
  log('BEGIN_CHECKOUT', { cartId, totalValue, products });

  // BEGIN_CHECKOUT is supported by Shopify Monorail at runtime. Type-assert to
  // ShopifyAddToCartPayload (closest structural match) to satisfy the compiler.
  sendShopifyAnalytics({
    eventName: 'BEGIN_CHECKOUT',
    payload: {
      ...getClientBrowserParameters(),
      shopId,
      ...BASE_PAYLOAD,
      cartId,
      totalValue,
      products: products.map(p => ({
        productGid: p.productGid,
        variantGid: p.variantGid,
        name: p.name,
        variantName: p.variantName,
        brand: p.brand ?? 'THSIX',
        price: p.price,
        quantity: p.quantity ?? 1,
      })),
    } as ShopifyAddToCartPayload,
  });
}

// ─── Step 5: Purchase Completed ───────────────────────────────────────────────

/**
 * Fire after a successful purchase (called from CheckoutSuccess page).
 * Fixes: Full conversion tracking, revenue attribution.
 */
export function trackShopifyPurchase(
  cartId: string,
  orderId: string,
  orderValue: number,
  products: ShopifyProduct[],
): void {
  const shopId = getShopId();
  log('PURCHASE', { orderId, orderValue, products });

  // PURCHASE is supported by Shopify Monorail at runtime. Type-assert to
  // ShopifyAddToCartPayload (closest structural match) to satisfy the compiler.
  sendShopifyAnalytics({
    eventName: 'PURCHASE',
    payload: {
      ...getClientBrowserParameters(),
      shopId,
      ...BASE_PAYLOAD,
      cartId,
      orderId,
      orderValue,
      totalValue: orderValue,
      products: products.map(p => ({
        productGid: p.productGid,
        variantGid: p.variantGid,
        name: p.name,
        variantName: p.variantName,
        brand: p.brand ?? 'THSIX',
        price: p.price,
        quantity: p.quantity ?? 1,
      })),
    } as ShopifyAddToCartPayload,
  });
}

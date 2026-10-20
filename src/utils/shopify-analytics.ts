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
// Hardcoded fallback guarantees that even if Vercel build environment variables fail to bind,
// the events will ALWAYS have the real shop ID attached!
const FALLBACK_SHOP_ID = 'gid://shopify/Shop/78307623077';
const ENV_SHOP_ID = import.meta.env.VITE_SHOPIFY_SHOP_ID as string | undefined;
const SHOP_ID = (ENV_SHOP_ID && !ENV_SHOP_ID.includes('YOUR_SHOP_ID')) ? ENV_SHOP_ID : FALLBACK_SHOP_ID;

// ─── Storefront ID ───────────────────────────────────────────────────────────
// Set VITE_SHOPIFY_STOREFRONT_ID to the Hydrogen storefront's ID (Shopify admin →
// Hydrogen → Environments → PUBLIC_STOREFRONT_ID). Numeric ID or full GID both work.
// Without it Monorail receives hydrogenSubchannelId "0" and the events are not
// attributed to the storefront, so Live View / Sessions stay empty.
const ENV_STOREFRONT_ID = (import.meta.env.VITE_SHOPIFY_STOREFRONT_ID as string | undefined)?.trim();
const STOREFRONT_ID = ENV_STOREFRONT_ID?.split('/').pop() || undefined;

if (!STOREFRONT_ID) {
  console.error('[ShopifyAnalytics] VITE_SHOPIFY_STOREFRONT_ID is not set; Shopify Live View will not receive events.');
}

const BASE_PAYLOAD = {
  currency: 'INR' as const,
  acceptedLanguage: 'EN' as const, // LanguageCode enum — must be uppercase
  hasUserConsent: true,
  // Consent flags. The SDK defaults them to false, and Shopify's reports (Live View, Sessions)
  // skip events whose analytics_allowed is false. This store sells in India only and shows no
  // consent banner, so they mirror hasUserConsent. If a consent banner is ever added, read these
  // from window.Shopify.customerPrivacy instead (the Hydrogen app already does).
  analyticsAllowed: true,
  marketingAllowed: true,
  saleOfDataAllowed: true,
  // Same channel attribution Hydrogen's <Analytics.Provider> sends
  shopifySalesChannel: 'hydrogen' as const,
  storefrontId: STOREFRONT_ID,
} as const;

/** Helper to generate UUID */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Ensure Shopify visitor tracking cookies (_shopify_y and _shopify_s) exist.
 * Hydrogen-react reads document.cookie for these tokens. Without them, Monorail
 * cannot associate events with a live visitor session.
 */
function ensureShopifyTokens(): { uniqueToken: string; visitToken: string } {
  if (typeof document === 'undefined') {
    return { uniqueToken: '', visitToken: '' };
  }

  let uniqueToken = document.cookie.match(/\b_shopify_y=([^;]+)/)?.[1];
  let visitToken = document.cookie.match(/\b_shopify_s=([^;]+)/)?.[1];

  if (!uniqueToken) {
    uniqueToken = generateUUID();
    // 1 year persistence
    document.cookie = `_shopify_y=${uniqueToken}; path=/; max-age=31536000; SameSite=Lax`;
  }

  if (!visitToken) {
    visitToken = generateUUID();
    // 30 minute session
    document.cookie = `_shopify_s=${visitToken}; path=/; max-age=1800; SameSite=Lax`;
  }

  return { uniqueToken, visitToken };
}

/** Log helper. */
function log(event: string, extra?: unknown) {
  if (import.meta.env.DEV) {
    console.log(`[ShopifyAnalytics] ${event}`, extra ?? '');
  }
}

/**
 * Guard: returns the shop ID.
 */
function getShopId(): string {
  return SHOP_ID;
}

// ─── Step 1: Page View ────────────────────────────────────────────────────────

/**
 * Helper to determine pageType from current path for Shopify Analytics schema
 */
function getPageTypeFromPath(pathname: string): string {
  if (pathname === '/' || pathname === '') return 'index';
  if (pathname.startsWith('/product/')) return 'product';
  if (pathname.startsWith('/brand/') || pathname.startsWith('/collection/')) return 'collection';
  if (pathname.startsWith('/contact')) return 'page';
  if (pathname.startsWith('/about')) return 'page';
  if (pathname.startsWith('/policy/')) return 'policy';
  return 'page';
}

/**
 * Fire on every page navigation (SPA route change and initial load).
 * Fixes: Sessions dashboard, Live View globe.
 */
export function trackShopifyPageView(): void {
  const shopId = getShopId();
  const tokens = ensureShopifyTokens();
  log('PAGE_VIEW', { url: window.location.href, tokens });

  const clientParams = getClientBrowserParameters();

  const payload: ShopifyPageViewPayload = {
    ...clientParams,
    uniqueToken: clientParams.uniqueToken || tokens.uniqueToken,
    visitToken: clientParams.visitToken || tokens.visitToken,
    shopId,
    ...BASE_PAYLOAD,
    pageType: getPageTypeFromPath(window.location.pathname),
    searchString: window.location.search, // Picks up UTM params automatically (Step 6)
  };

  // PAGE_VIEW_2 is the page-view schema Hydrogen itself sends
  sendShopifyAnalytics({
    eventName: AnalyticsEventName.PAGE_VIEW_2,
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
  const tokens = ensureShopifyTokens();
  const clientParams = getClientBrowserParameters();
  log('PRODUCT_VIEW', product);

  // PRODUCT_VIEW is a valid Shopify Monorail event; type-assert to bypass
  // the narrow SDK union type (ShopifyPageViewPayload | ShopifyAddToCartPayload).
  sendShopifyAnalytics({
    eventName: AnalyticsEventName.PRODUCT_VIEW,
    payload: {
      ...clientParams,
      uniqueToken: clientParams.uniqueToken || tokens.uniqueToken,
      visitToken: clientParams.visitToken || tokens.visitToken,
      shopId,
      ...BASE_PAYLOAD,
      pageType: 'product',
      resourceId: product.productGid,
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
  const tokens = ensureShopifyTokens();
  const clientParams = getClientBrowserParameters();
  log('ADD_TO_CART', { cartId, product });

  const payload: ShopifyAddToCartPayload = {
    ...clientParams,
    uniqueToken: clientParams.uniqueToken || tokens.uniqueToken,
    visitToken: clientParams.visitToken || tokens.visitToken,
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
  const tokens = ensureShopifyTokens();
  const clientParams = getClientBrowserParameters();
  log('BEGIN_CHECKOUT', { cartId, totalValue, products });

  // BEGIN_CHECKOUT is supported by Shopify Monorail at runtime. Type-assert to
  // ShopifyAddToCartPayload (closest structural match) to satisfy the compiler.
  sendShopifyAnalytics({
    eventName: 'BEGIN_CHECKOUT',
    payload: {
      ...clientParams,
      uniqueToken: clientParams.uniqueToken || tokens.uniqueToken,
      visitToken: clientParams.visitToken || tokens.visitToken,
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
  const tokens = ensureShopifyTokens();
  const clientParams = getClientBrowserParameters();
  log('PURCHASE', { orderId, orderValue, products });

  // PURCHASE is supported by Shopify Monorail at runtime. Type-assert to
  // ShopifyAddToCartPayload (closest structural match) to satisfy the compiler.
  sendShopifyAnalytics({
    eventName: 'PURCHASE',
    payload: {
      ...clientParams,
      uniqueToken: clientParams.uniqueToken || tokens.uniqueToken,
      visitToken: clientParams.visitToken || tokens.visitToken,
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

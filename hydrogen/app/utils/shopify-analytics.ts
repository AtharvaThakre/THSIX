/**
 * Shopify Analytics (Monorail) — THSIX on Hydrogen
 *
 * - Page views: <Analytics.Provider> in root.tsx (every navigation).
 * - Product views: <Analytics.ProductView> on the product page.
 * - Add to cart: sent here. The provider derives add-to-cart from a Shopify Cart, but THSIX
 *   keeps its cart in localStorage and checks out through Shiprocket, so the event is sent
 *   directly with the same shop, storefront and consent fields the provider uses.
 * - Begin checkout / purchase: Monorail has no such storefront events (sendShopifyAnalytics
 *   silently drops them). Shopify records the sale when /api/webhooks/order creates the order
 *   through the Admin API.
 *
 * UTM attribution is picked up by getClientBrowserParameters() from the URL.
 */

import {
  sendShopifyAnalytics,
  AnalyticsEventName,
  getClientBrowserParameters,
} from '@shopify/hydrogen';
import { SHOP_ID, STOREFRONT_ID, IS_DEV } from '../lib/config';

type CustomerPrivacy = {
  consentStatus?: string;
  analyticsProcessingAllowed?: () => boolean;
  marketingAllowed?: () => boolean;
  saleOfDataAllowed?: () => boolean;
  currentVisitorConsent?: () => { analytics?: string };
};

// Version reported by Hydrogen's own events (asset_version_id)
const ASSET_VERSION_ID = '2026.4.7';

export interface ShopifyProduct {
  productGid: string;       // "gid://shopify/Product/123"
  variantGid: string;       // "gid://shopify/ProductVariant/456"
  name: string;
  variantName: string;
  brand?: string;
  price: string;            // String decimal, e.g. "2999.00"
  quantity?: number;
}

/** Consent exactly as <Analytics.Provider> reads it (Shopify Customer Privacy API). */
function consentFlags() {
  const privacy = (window as unknown as { Shopify?: { customerPrivacy?: CustomerPrivacy } })
    .Shopify?.customerPrivacy;
  if (!privacy || privacy.consentStatus !== 'loaded') return null;

  const analyticsAllowed = Boolean(privacy.analyticsProcessingAllowed?.());
  const marketingAllowed = Boolean(privacy.marketingAllowed?.());
  const saleOfDataAllowed = Boolean(privacy.saleOfDataAllowed?.());
  const deniedAnalytics = privacy.currentVisitorConsent?.().analytics === 'no';
  return {
    hasUserConsent: analyticsAllowed && !deniedAnalytics,
    analyticsAllowed,
    marketingAllowed,
    saleOfDataAllowed,
    ccpaEnforced: !saleOfDataAllowed,
    gdprEnforced: !(marketingAllowed && analyticsAllowed),
  };
}

/**
 * Fire when "Add to Cart" is clicked on the product page.
 * No Shopify Cart exists in this flow, so the event carries no cart token.
 */
export function trackShopifyAddToCart(product: ShopifyProduct): void {
  if (typeof window === 'undefined') return;

  if (!STOREFRONT_ID) {
    if (IS_DEV) console.warn('[ShopifyAnalytics] PUBLIC_STOREFRONT_ID is not set; ADD_TO_CART skipped');
    return;
  }
  const consent = consentFlags();
  if (!consent?.hasUserConsent) return;

  const payload = {
    ...getClientBrowserParameters(),
    ...consent,
    shopifySalesChannel: 'hydrogen' as const,
    assetVersionId: ASSET_VERSION_ID,
    shopId: SHOP_ID,
    hydrogenSubchannelId: STOREFRONT_ID,
    currency: 'INR' as const,
    acceptedLanguage: 'EN' as const,
    cartId: '',
    totalValue: parseFloat(product.price) * (product.quantity ?? 1),
    products: [
      {
        productGid: product.productGid,
        variantGid: product.variantGid,
        name: product.name,
        variantName: product.variantName,
        brand: product.brand ?? 'THSIX',
        price: product.price,
        quantity: product.quantity ?? 1,
      },
    ],
  };

  if (IS_DEV) console.log('[ShopifyAnalytics] ADD_TO_CART', payload);

  sendShopifyAnalytics({ eventName: AnalyticsEventName.ADD_TO_CART, payload }).catch(() => {
    // Logged by sendShopifyAnalytics; analytics must never break the cart
  });
}

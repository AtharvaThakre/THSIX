/**
 * Public (browser-safe) configuration.
 *
 * root.tsx's loader sends these values from the Oxygen env and the layout writes them to
 * `window.ENV` before any module script runs. On the server (SSR) `window` doesn't exist, so
 * the defaults below apply; nothing that needs a different value runs during SSR.
 * Shopify data is fetched by route loaders, so no Storefront API token is needed here.
 */
declare global {
  interface Window {
    ENV?: Partial<Record<PublicEnvKey, string>>;
  }
}

export type PublicEnvKey =
  | 'PUBLIC_SHOPIFY_SHOP_ID'
  | 'PUBLIC_GA4_MEASUREMENT_ID'
  | 'PUBLIC_META_PIXEL_ID'
  | 'PUBLIC_STOREFRONT_ID';

const DEFAULTS: Record<PublicEnvKey, string> = {
  PUBLIC_SHOPIFY_SHOP_ID: 'gid://shopify/Shop/78307623077',
  PUBLIC_GA4_MEASUREMENT_ID: '',
  PUBLIC_META_PIXEL_ID: '1294973553696322',
  // No default: analytics must never be attributed to a placeholder storefront
  PUBLIC_STOREFRONT_ID: '',
};

const read = (key: PublicEnvKey): string => {
  const value = typeof window !== 'undefined' ? window.ENV?.[key] : undefined;
  return value || DEFAULTS[key];
};

export const SHOP_ID = read('PUBLIC_SHOPIFY_SHOP_ID');
export const GA4_MEASUREMENT_ID = read('PUBLIC_GA4_MEASUREMENT_ID') || undefined;
export const META_PIXEL_ID = read('PUBLIC_META_PIXEL_ID');
/** Numeric Hydrogen storefront ID (normalised by the root loader), or '' if not configured. */
export const STOREFRONT_ID = read('PUBLIC_STOREFRONT_ID');
export const IS_DEV = import.meta.env.DEV;

/**
 * Transforms Shopify CDN image URLs to request specific dimensions.
 *
 * Shopify CDN supports image transformation via URL parameters:
 * - width: Resize to specific width (maintains aspect ratio)
 * - height: Resize to specific height (maintains aspect ratio)
 * - crop: Crop mode (center, top, bottom, left, right)
 *
 * Format: when a `width` is requested the CDN negotiates the output format from
 * the browser's Accept header (AVIF or WebP for modern browsers, JPEG/PNG for
 * others), so no `format` parameter is needed. Requests without `width` return
 * the original upload, which can be several hundred KB, so always pass a width.
 *
 * Example: https://cdn.shopify.com/s/files/1/.../image.jpg?v=123&width=750
 *
 * PageSpeed Insights identified that product images are loaded at 750×750
 * but displayed at 371×371, causing unnecessary bandwidth usage.
 */

export interface ShopifyImageTransformOptions {
  width?: number;
  height?: number;
  crop?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Add Shopify CDN transformation parameters to an image URL.
 * 
 * @param url - Original Shopify CDN image URL
 * @param options - Transform options (width, height, crop)
 * @returns Transformed URL with CDN parameters
 */
export function transformShopifyImageUrl(
  url: string | null | undefined,
  options: ShopifyImageTransformOptions
): string {
  if (!url) return '';
  
  // Only transform Shopify CDN URLs
  if (!url.includes('cdn.shopify.com')) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    // Add width parameter if specified
    if (options.width) {
      params.set('width', options.width.toString());
    }
    
    // Add height parameter if specified
    if (options.height) {
      params.set('height', options.height.toString());
    }
    
    // Add crop parameter if specified
    if (options.crop) {
      params.set('crop', options.crop);
    }
    
    return urlObj.toString();
  } catch {
    // If URL parsing fails, return original
    return url;
  }
}

/**
 * Build a `srcset` string ("url 300w, url 600w") for a Shopify CDN image.
 * Returns undefined for non-Shopify URLs (local assets have no width variants),
 * so callers can spread the result onto <img> without an empty attribute.
 */
export function buildShopifySrcSet(
  url: string | null | undefined,
  widths: readonly number[]
): string | undefined {
  if (!url || !url.includes('cdn.shopify.com')) return undefined;
  return widths
    .map((w) => `${transformShopifyImageUrl(url, { width: w })} ${w}w`)
    .join(', ');
}

/**
 * Optimized product image sizes based on actual display dimensions.
 * 
 * - Product cards: 371×371 (was loading 750×750 = 2x waste)
 * - Product detail: 600×600 for main, 100×100 for thumbnails
 */
export const PRODUCT_IMAGE_SIZES = {
  card: 371,          // Product card in grid
  cardRetina: 742,    // Product card @2x
  detail: 600,        // Product detail main image
  detailRetina: 1200, // Product detail @2x
  thumbnail: 100,     // Product detail thumbnails
  thumbnailRetina: 200 // Thumbnail @2x
} as const;

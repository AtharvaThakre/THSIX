/**
 * Transforms Shopify CDN image URLs to request specific dimensions.
 * 
 * Shopify CDN supports image transformation via URL parameters:
 * - width: Resize to specific width (maintains aspect ratio)
 * - height: Resize to specific height (maintains aspect ratio)
 * - crop: Crop mode (center, top, bottom, left, right)
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
 * Generate srcSet string for responsive images from Shopify CDN.
 * 
 * @param url - Original Shopify CDN image URL
 * @param widths - Array of widths to generate (e.g., [375, 750, 1500])
 * @returns srcSet string for use in <img> or <source>
 */
export function generateShopifySrcSet(
  url: string | null | undefined,
  widths: number[]
): string {
  if (!url) return '';
  
  return widths
    .map(width => `${transformShopifyImageUrl(url, { width })} ${width}w`)
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

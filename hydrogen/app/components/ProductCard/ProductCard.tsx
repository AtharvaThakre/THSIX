import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { ProductCardFragment } from 'storefrontapi.generated';
import { buildShopifySrcSet, transformShopifyImageUrl } from '../../utils/shopify-image-transform';
import './ProductCard.css';

export type ProductCardData = ProductCardFragment;

const formatMoney = (amount: string, currencyCode: string) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: currencyCode }).format(parseFloat(amount));

// Covers the card's rendered image width (about 170-300px) at 1x-2x
const CARD_IMAGE_WIDTHS = [220, 300, 440, 600];

interface ProductCardProps {
  product: ProductCardData;
  /** `sizes` for the image; depends on the layout the card sits in (carousel or grid). */
  sizes: string;
  /** Above-the-fold cards load eagerly; everything else lazily. */
  loading?: 'eager' | 'lazy';
}

/**
 * Product card used by the home carousels and the collection grid. Server-rendered from
 * Storefront API data; links to the product page. The card's width comes from its container.
 */
export const ProductCard = ({ product, sizes, loading = 'lazy' }: ProductCardProps) => {
  const variant = product.selectedOrFirstAvailableVariant;
  const image = variant?.image;
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageFailed, setImageFailed] = useState(false);

  // An image that failed before hydration never fires onError in React, so check once on mount
  useEffect(() => {
    const img = imageRef.current;
    if (img?.complete && img.naturalWidth === 0) setImageFailed(true);
  }, []);

  return (
    <div className="product-card">
      <Link
        className="product-card__link"
        to={`/product/${product.handle}`}
        data-product-handle={product.handle}
        prefetch="intent"
      >
        <div className="product-card__image-container">
          {image && !imageFailed ? (
            <img
              ref={imageRef}
              className="product-card__image"
              src={transformShopifyImageUrl(image.url, { width: 600 })}
              srcSet={buildShopifySrcSet(image.url, CARD_IMAGE_WIDTHS)}
              sizes={sizes}
              alt={image.altText ?? product.title}
              width={image.width ?? 300}
              height={image.height ?? 280}
              loading={loading}
              decoding="async"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="product-card__placeholder" role="img" aria-label={product.title}>
              <span className="product-card__placeholder-text">THSIX</span>
            </div>
          )}
        </div>
        <div className="product-card__info">
          <div className="product-card__details">
            <h3 className="product-card__title">{product.title}</h3>
            <p className="product-card__color">{product.vendor}</p>
            <p className="product-card__price">
              {variant ? formatMoney(variant.price.amount, variant.price.currencyCode) : null}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
};

import { Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { Brand } from '../../types/brand';
import { brandProductImages } from '../../data/brands';
import { trackCustomEvent } from '../../utils/metaPixel';

/**
 * The product image fills the card's 1:1 box minus its 16px padding on each side:
 * 268px wide on desktop, 248px at 768-1099px and 218px on mobile (<=767px).
 */
const BRAND_IMAGE_SIZES = '(max-width: 767px) 218px, (max-width: 1099px) 248px, 268px';

interface BrandCardProps {
  brand: Brand;
}

export const BrandCard = ({ brand }: BrandCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (brand.available && brand.id === 'adidas') {
      trackCustomEvent('BrandClicked', { brand_name: brand.name, brand_id: brand.id });
      void navigate(`/brands/${brand.id}`);
    } else {
      trackCustomEvent('LockedBrandClicked', { brand_name: brand.name, brand_id: brand.id });
    }
  };

  // Look up optimized WebP images for this brand
  const imgSet = brandProductImages[brand.id];

  return (
    <div 
      className={`brand-card brand-card--${brand.id} ${brand.available ? 'brand-card--available' : 'brand-card--locked'}`}
      role="link"
      tabIndex={brand.available ? 0 : -1}
      aria-disabled={!brand.available}
      onClick={brand.available ? handleClick : undefined}
      onKeyDown={(e) => {
        if (brand.available && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
      style={{ cursor: brand.available ? 'pointer' : 'default' }}
    >
      <div className="brand-card__image-container">
        {brand.productImage ? (
          <picture>
            {imgSet?.avif && imgSet.avif2x && (
              <source
                srcSet={`${imgSet.avif} 300w, ${imgSet.avif2x} 600w`}
                sizes={BRAND_IMAGE_SIZES}
                type="image/avif"
              />
            )}
            {imgSet && (
              <source
                srcSet={`${imgSet.webp} 300w, ${imgSet.webp2x} 600w`}
                sizes={BRAND_IMAGE_SIZES}
                type="image/webp"
              />
            )}
            <img 
              src={imgSet?.fallback || brand.productImage} 
              alt={`${brand.name} product`} 
              className={`brand-card__product-image brand-card__product-image--${brand.id}`} 
              loading="lazy"
              decoding="async"
              width="300"
              height="300"
              onError={(e) => {
                console.error(`Failed to load image: ${brand.productImage}`);
                e.currentTarget.style.display = 'none';
              }}
            />
          </picture>
        ) : (
          <div className="brand-card__placeholder" />
        )}
      </div>

      <div className="brand-card__footer">
        {brand.available && brand.id === 'adidas' ? (
          <div className="brand-card__action">
            <button
              type="button"
              className="brand-card__see-all-btn"
              onClick={(e) => {
                e.stopPropagation();
                trackCustomEvent('BrandClicked', { brand_name: brand.name, brand_id: brand.id });
                void navigate('/brands/adidas');
              }}
              aria-label="See all Adidas products"
            >
              <span>See All</span>
              <ArrowRight size={13} strokeWidth={2} className="brand-card__see-all-arrow" />
            </button>
          </div>
        ) : (
          !brand.available && (
            <div className="brand-card__status">
              <Lock size={15} strokeWidth={1.5} className="brand-card__lock" aria-hidden="true" />
            </div>
          )
        )}
      </div>
    </div>
  );
};

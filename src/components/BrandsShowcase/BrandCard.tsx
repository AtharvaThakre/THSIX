import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Brand } from '../../types/brand';
import { BrandLogo } from './BrandLogos';
import { brandProductImages } from '../../data/brands';

interface BrandCardProps {
  brand: Brand;
}

export const BrandCard = ({ brand }: BrandCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (brand.available && brand.id === 'adidas') {
      navigate(`/brands/${brand.id}`);
    }
  };

  // Look up optimized WebP images for this brand
  const imgSet = brandProductImages[brand.id];

  return (
    <div 
      className={`brand-card brand-card--${brand.id} ${brand.available ? 'brand-card--available' : 'brand-card--locked'}`}
      onClick={brand.available ? handleClick : undefined}
      style={{ cursor: brand.available ? 'pointer' : 'default' }}
    >
      <div className="brand-card__logo-wrapper">
        <BrandLogo brandId={brand.id} name={brand.name} customLogo={brand.logo} />
      </div>

      <div className="brand-card__image-container">
        {brand.productImage ? (
          <picture>
            {imgSet && (
              <source
                srcSet={`${imgSet.webp} 300w, ${imgSet.webp2x} 600w`}
                sizes="(max-width: 767px) 250px, (max-width: 1099px) 280px, 300px"
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
        {brand.available ? (
          <div className="brand-card__status">
            <span className="brand-card__status-text">{brand.status}</span>
          </div>
        ) : (
          <div className="brand-card__status">
            <span className="brand-card__status-text">{brand.status}</span>
            <Lock size={15} strokeWidth={1.5} className="brand-card__lock" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
};

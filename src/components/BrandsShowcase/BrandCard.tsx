import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Brand } from '../../types/brand';
import { BrandLogo } from './BrandLogos';

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

  return (
    <div 
      className={`brand-card ${brand.available ? 'brand-card--available' : 'brand-card--locked'}`}
      onClick={brand.available ? handleClick : undefined}
      style={{ cursor: brand.available ? 'pointer' : 'default' }}
    >
      <div className="brand-card__logo-wrapper">
        <BrandLogo brandId={brand.id} name={brand.name} customLogo={brand.logo} />
      </div>

      <div className="brand-card__image-container">
        {brand.productImage ? (
          <picture>
            <source
              srcSet={`/assets/products/${brand.id}.webp 400w, /assets/products/${brand.id}@2x.webp 800w`}
              type="image/webp"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            />
            <img 
              src={brand.productImage} 
              alt={`${brand.name} product`} 
              className="brand-card__product-image" 
              loading="lazy"
              decoding="async"
              width="400"
              height="400"
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

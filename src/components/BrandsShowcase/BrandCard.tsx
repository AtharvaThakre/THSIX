import { ArrowRight, Lock } from 'lucide-react';
import type { Brand } from '../../types/brand';
import { BrandLogo } from './BrandLogos';

interface BrandCardProps {
  brand: Brand;
}

export const BrandCard = ({ brand }: BrandCardProps) => {
  return (
    <div className={`brand-card ${brand.available ? 'brand-card--available' : 'brand-card--locked'}`}>
      <div className="brand-card__logo-wrapper">
        <BrandLogo brandId={brand.id} name={brand.name} customLogo={brand.logo} />
      </div>

      <div className="brand-card__image-container">
        {brand.productImage ? (
          <img 
            src={brand.productImage} 
            alt={`${brand.name} product`} 
            className="brand-card__product-image" 
            loading="lazy" 
          />
        ) : (
          <div className="brand-card__placeholder" />
        )}
      </div>

      <div className="brand-card__footer">
        {brand.available ? (
          <a href={brand.href} className="brand-card__cta">
            <span>{brand.status}</span>
            <ArrowRight size={14} strokeWidth={1.5} className="brand-cta-arrow" />
          </a>
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

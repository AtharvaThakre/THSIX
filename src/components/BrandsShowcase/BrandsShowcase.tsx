import { ArrowRight } from 'lucide-react';
import { brandsData } from '../../data/brands';
import { BrandCard } from './BrandCard';
import './BrandsShowcase.css';

export const BrandsShowcase = () => {
  return (
    <section className="brands-showcase">
      <div className="brands-showcase__header">
        <div className="brands-showcase__header-left">
          <h2 className="brands-showcase__title">MORE BRANDS. A BIGGER TOMORROW.</h2>
          <p className="brands-showcase__subtitle">SAMBA IS JUST THE BEGINNING.</p>
        </div>

        <a href="/brands" className="brands-showcase__explore">
          <span>EXPLORE BRANDS</span>
          <ArrowRight size={14} strokeWidth={1.5} className="explore-arrow" />
        </a>
      </div>

      <div className="brands-showcase__grid">
        {brandsData.map((brand) => (
          <BrandCard key={brand.id} brand={brand} />
        ))}
      </div>
    </section>
  );
};

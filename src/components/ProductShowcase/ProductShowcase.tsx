import { ArrowRight } from 'lucide-react';
import { sambaProducts } from '../../data/products';
import { ProductCard } from './ProductCard';
import './ProductShowcase.css';

export const ProductShowcase = () => {
  return (
    <section className="product-showcase">
      <div className="product-showcase__header">
        <div className="product-showcase__header-left">
          <span className="product-showcase__eyebrow">DROP 01</span>
          <h2 className="product-showcase__title">ADIDAS SAMBAS</h2>
          <p className="product-showcase__subtitle">CLASSIC SILHOUETTES. MODERN MOVES.</p>
        </div>
        
        <a href="#shop" className="product-showcase__view-all">
          <span>VIEW ALL</span>
          <ArrowRight size={14} strokeWidth={1.5} className="view-all-arrow" />
        </a>
      </div>

      <div className="product-showcase__grid">
        {sambaProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

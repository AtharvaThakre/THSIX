import { ShoppingBag } from 'lucide-react';
import type { Product } from '../../types/product';
import { formatPrice } from '../../data/products';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <div className="product-card">
      <a href={`/products/${product.id}`} className="product-card__image-link" aria-label={`View ${product.title} - ${product.color}`}>
        <div className="product-card__image-container">
          {product.image ? (
            <img 
              src={product.image} 
              alt={`${product.title} - ${product.color}`} 
              className="product-card__image" 
              loading="lazy" 
            />
          ) : (
            <div className="product-card__placeholder" />
          )}
        </div>
      </a>

      <div className="product-card__info">
        <div className="product-card__details">
          <h3 className="product-card__title">{product.title}</h3>
          <p className="product-card__color">{product.color}</p>
          <p className="product-card__price">{formatPrice(product.price, product.currency)}</p>
        </div>

        <button 
          className="product-card__action" 
          aria-label={`Add ${product.title} to bag`}
          onClick={(e) => {
            e.preventDefault();
          }}
        >
          <ShoppingBag size={18} strokeWidth={1.4} />
        </button>
      </div>
    </div>
  );
};

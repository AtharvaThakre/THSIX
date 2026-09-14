import { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import './FloatingCartButton.css';

interface FloatingCartButtonProps {
  onOpenCart: () => void;
}

export const FloatingCartButton = ({ onOpenCart }: FloatingCartButtonProps) => {
  const { totalItems } = useCart();
  const [isPulsing, setIsPulsing] = useState(false);

  // Trigger animation when items are added
  useEffect(() => {
    if (totalItems > 0) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 600);
      return () => clearTimeout(timer);
    }
  }, [totalItems]);

  const handleOpenCart = () => {
    onOpenCart();
  };

  return (
    <button
      className={`floating-cart-btn ${isPulsing ? 'floating-cart-btn--notify' : ''} ${totalItems > 0 ? 'floating-cart-btn--has-items' : ''}`}
      onClick={handleOpenCart}
      aria-label={`Open Shopping Cart ${totalItems > 0 ? `with ${totalItems} item${totalItems > 1 ? 's' : ''}` : ''}`}
      title="Shopping Cart"
    >
      <div className="floating-cart-btn__icon-wrapper">
        <ShoppingBag className="floating-cart-btn__icon" strokeWidth={1.75} />
        {totalItems > 0 && (
          <span className="floating-cart-btn__badge floating-cart-btn__badge--count">
            {totalItems}
          </span>
        )}
      </div>
    </button>
  );
};

import { ShoppingBag, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import './Header.css';

export const Header = () => {
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
    const cart = (
      document.getElementById('product-cart') || 
      document.getElementById('global-cart') || 
      document.getElementById('home-cart')
    ) as any;
    if (cart?.showModal) cart.showModal();
  };

  return (
    <header className="header">
      <div className="header-left">
        <strong>THSIX</strong>
      </div>
      <nav className="header-center">
        <a href="#shop" className="nav-link">SHOP</a>
        <a href="#brands" className="nav-link">BRANDS</a>
        <a href="#about" className="nav-link">ABOUT</a>
        <a href="#journal" className="nav-link">JOURNAL</a>
      </nav>
      <div className="header-right">
        <button
          className={`icon-btn cart-btn ${isPulsing ? 'cart-btn--notify' : ''} ${totalItems > 0 ? 'cart-btn--has-items' : ''}`}
          aria-label={`Cart ${totalItems > 0 ? `with ${totalItems} item${totalItems > 1 ? 's' : ''}` : ''}`}
          onClick={handleOpenCart}
          type="button"
        >
          <div className="cart-btn__icon-wrapper">
            <ShoppingBag size={24} strokeWidth={1.5} />
            {totalItems > 0 && (
              <span className="cart-btn__badge cart-btn__badge--count">
                {totalItems}
              </span>
            )}
          </div>
        </button>
        <button className="icon-btn mobile-only" aria-label="Menu">
          <Menu size={20} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
};

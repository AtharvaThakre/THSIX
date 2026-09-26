import { ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { openCart } from '../Cart/openCart';
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

  const handleLogoClick = () => {
    window.location.href = '/';
  };

  // On the home page scroll to the section; elsewhere the /#id link loads home and
  // HomePage scrolls to the hash
  const handleSectionLink = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const element = document.getElementById(id);
    if (window.location.pathname === '/' && element) {
      e.preventDefault();
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `/#${id}`);
    }
  };

  return (
    <header className="header">
      <div className="header-left" onClick={handleLogoClick}>
        <strong>THSIX</strong>
      </div>
      <nav className="header-center">
        <a href="/#shop" onClick={(e) => handleSectionLink(e, 'shop')} className="nav-link">SHOP</a>
        <a href="/#brands" onClick={(e) => handleSectionLink(e, 'brands')} className="nav-link">BRANDS</a>
        <a href="/#about" onClick={(e) => handleSectionLink(e, 'about')} className="nav-link">ABOUT</a>
        <a href="/#contact" onClick={(e) => handleSectionLink(e, 'contact')} className="nav-link">CONTACT US</a>
      </nav>
      <div className="header-right">
        <button
          className={`icon-btn cart-btn ${isPulsing ? 'cart-btn--notify' : ''} ${totalItems > 0 ? 'cart-btn--has-items' : ''}`}
          aria-label={`Cart ${totalItems > 0 ? `with ${totalItems} item${totalItems > 1 ? 's' : ''}` : ''}`}
          onClick={openCart}
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
      </div>
    </header>
  );
};

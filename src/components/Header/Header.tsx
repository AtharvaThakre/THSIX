import { Search, UserRound, ShoppingBag, Menu } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { Logo } from './Logo';
import './Header.css';

export const Header = () => {
  const { totalItems } = useCart();

  return (
    <header className="header">
      <div className="header-left">
        <Logo />
      </div>
      <nav className="header-center">
        <a href="#shop" className="nav-link">SHOP</a>
        <a href="#brands" className="nav-link">BRANDS</a>
        <a href="#about" className="nav-link">ABOUT</a>
        <a href="#journal" className="nav-link">JOURNAL</a>
      </nav>
      <div className="header-right">
        <button className="icon-btn desktop-only" aria-label="Search">
          <Search size={20} strokeWidth={1.5} />
        </button>
        <button className="icon-btn desktop-only" aria-label="Account">
          <UserRound size={20} strokeWidth={1.5} />
        </button>
        <button
          className={`icon-btn cart-btn ${totalItems > 0 ? 'cart-btn--has-items' : ''}`}
          aria-label={`Cart ${totalItems > 0 ? `with ${totalItems} item${totalItems > 1 ? 's' : ''}` : ''}`}
          onClick={() => {
            const cart = (document.getElementById('global-cart') || document.getElementById('home-cart')) as any;
            if (cart?.showModal) cart.showModal();
          }}
        >
          <div className="cart-btn__icon-wrapper">
            <ShoppingBag size={20} strokeWidth={1.5} />
            {totalItems > 0 && (
              <span className="cart-btn__badge">
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

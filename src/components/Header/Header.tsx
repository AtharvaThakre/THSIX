import { Search, UserRound, ShoppingBag, Menu } from 'lucide-react';
import { Logo } from './Logo';
import './Header.css';

export const Header = () => {
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
          className="icon-btn"
          aria-label="Cart"
          onClick={() => {
            const cart = (document.getElementById('global-cart') || document.getElementById('home-cart')) as any;
            if (cart?.showModal) cart.showModal();
          }}
        >
          <ShoppingBag size={20} strokeWidth={1.5} />
        </button>
        <button className="icon-btn mobile-only" aria-label="Menu">
          <Menu size={20} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
};

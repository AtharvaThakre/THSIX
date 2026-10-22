import { Menu, ShoppingBag } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useCart } from '../../contexts/CartContext';
import { openCart } from '../Cart/openCart';
import { CollectionMenu, type MenuNavLink } from '../CollectionMenu/CollectionMenu';
import { announceMenuOpen, COLLECTION_MENU_ID } from '../CollectionMenu/menuEvents';
import { trackCustomEvent } from '../../utils/metaPixel';
import './Header.css';

const NAV_LINKS: MenuNavLink[] = [
  { href: '/#shop', label: 'Shop', sectionId: 'shop' },
  { href: '/#brands', label: 'Brands', sectionId: 'brands' },
  { href: '/#about', label: 'About', sectionId: 'about' },
  { href: '/contactus', label: 'Contact' },
];

export const Header = () => {
  const { totalItems } = useCart();
  const [isPulsing, setIsPulsing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const openMenu = () => {
    announceMenuOpen(); // closes the cart if it is open
    setIsMenuOpen(true);
    trackCustomEvent('MenuIconClicked');
  };

  // Trigger animation when items are added
  useEffect(() => {
    if (totalItems > 0) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 600);
      return () => clearTimeout(timer);
    }
  }, [totalItems]);

  const handleLogoClick = () => {
    trackCustomEvent('LogoClicked');
    window.location.href = '/';
  };

  // On the home page scroll to the section; elsewhere the /#id link loads home and
  // HomePage scrolls to the hash
  const handleSectionLink = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    trackCustomEvent('NavLinkClicked', { section: id });
    const element = document.getElementById(id);
    if (window.location.pathname === '/' && element) {
      e.preventDefault();
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `/#${id}`);
    }
  };

  // Menu (mobile) nav links: close the drawer first, then scroll once its scroll lock is released
  const handleMenuNavClick = (e: React.MouseEvent<HTMLAnchorElement>, link: MenuNavLink) => {
    setIsMenuOpen(false);
    if (!link.sectionId) return;
    const id = link.sectionId;
    trackCustomEvent('NavLinkClicked', { section: id });
    if (window.location.pathname === '/' && document.getElementById(id)) {
      e.preventDefault();
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', `/#${id}`);
      }, 60);
    }
  };

  return (
    <>
    <header className="header">
      <div
        className="header-left"
        role="link"
        tabIndex={0}
        onClick={handleLogoClick}
        onKeyDown={(e) => e.key === 'Enter' && handleLogoClick()}
      >
        <strong>THSIX</strong>
      </div>
      <nav className="header-center">
        <a href="/#shop" onClick={(e) => handleSectionLink(e, 'shop')} className="nav-link">SHOP</a>
        <a href="/#brands" onClick={(e) => handleSectionLink(e, 'brands')} className="nav-link">BRANDS</a>
        <a href="/#about" onClick={(e) => handleSectionLink(e, 'about')} className="nav-link">ABOUT</a>
        <a href="/contactus" className="nav-link">CONTACT US</a>
      </nav>
      <div className="header-right">
        <button
          ref={menuBtnRef}
          className="icon-btn menu-btn"
          aria-label="Open collections menu"
          aria-haspopup="dialog"
          aria-expanded={isMenuOpen}
          aria-controls={COLLECTION_MENU_ID}
          onClick={openMenu}
          type="button"
        >
          <Menu size={24} strokeWidth={1.5} />
        </button>
        <button
          className={`icon-btn cart-btn ${isPulsing ? 'cart-btn--notify' : ''} ${totalItems > 0 ? 'cart-btn--has-items' : ''}`}
          aria-label={`Cart ${totalItems > 0 ? `with ${totalItems} item${totalItems > 1 ? 's' : ''}` : ''}`}
          onClick={() => { openCart(); trackCustomEvent('CartIconClicked', { item_count: totalItems }); }}
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
    <CollectionMenu
      isOpen={isMenuOpen}
      onClose={closeMenu}
      triggerRef={menuBtnRef}
      navLinks={NAV_LINKS}
      onNavLinkClick={handleMenuNavClick}
    />
    </>
  );
};

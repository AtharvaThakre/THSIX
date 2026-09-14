import { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import './FloatingCartButton.css';

export const FloatingCartButton = () => {
  const [hasNotification, setHasNotification] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    // Intercept clicks on any Add to Cart buttons across the site
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const btn = target.closest('button, [role="button"]') as HTMLElement | null;
      if (!btn) return;

      const onclickAttr = btn.getAttribute('onclick') || '';
      const isAddBtn = 
        onclickAttr.includes('addLine') ||
        btn.classList.contains('product-detail__add-btn') ||
        btn.classList.contains('shop-modal__add-btn') ||
        btn.classList.contains('product-card__action');

      if (isAddBtn) {
        setHasNotification(true);
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 600);
      }
    };

    document.addEventListener('click', handleGlobalClick, true);

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, []);

  const handleOpenCart = () => {
    setHasNotification(false);
    
    // Find global cart or fallback to any cart element on page
    const cart = (
      document.getElementById('global-cart') ||
      document.getElementById('product-cart') ||
      document.getElementById('shop-cart') ||
      document.getElementById('home-cart')
    ) as any;

    if (cart && typeof cart.showModal === 'function') {
      cart.showModal();
    } else if (cart && typeof cart.show === 'function') {
      cart.show();
    }
  };

  return (
    <button
      className={`floating-cart-btn ${isPulsing ? 'floating-cart-btn--notify' : ''}`}
      onClick={handleOpenCart}
      aria-label="Open Shopping Cart"
      title="Shopping Cart"
    >
      <ShoppingBag className="floating-cart-btn__icon" strokeWidth={1.75} />
      {hasNotification && <span className="floating-cart-btn__badge" aria-label="New item in cart" />}
    </button>
  );
};

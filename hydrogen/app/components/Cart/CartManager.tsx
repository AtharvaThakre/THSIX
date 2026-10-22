import { useState, useEffect } from 'react';
import { FloatingWhatsApp } from '../FloatingWhatsApp/FloatingWhatsApp';
import { Cart } from './Cart';
import { OPEN_CART_EVENT } from './openCart';
import { OPEN_MENU_EVENT } from '../CollectionMenu/menuEvents';

export const CartManager = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const open = () => setIsCartOpen(true);
    // The collections menu and the cart are mutually exclusive
    const close = () => setIsCartOpen(false);
    window.addEventListener(OPEN_CART_EVENT, open);
    window.addEventListener(OPEN_MENU_EVENT, close);
    return () => {
      window.removeEventListener(OPEN_CART_EVENT, open);
      window.removeEventListener(OPEN_MENU_EVENT, close);
    };
  }, []);

  const closeCart = () => setIsCartOpen(false);

  return (
    <>
      <FloatingWhatsApp />
      <Cart isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
};
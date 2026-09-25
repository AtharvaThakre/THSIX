import { useState, useEffect } from 'react';
import { FloatingWhatsApp } from '../FloatingWhatsApp/FloatingWhatsApp';
import { Cart } from './Cart';
import { OPEN_CART_EVENT } from './openCart';

export const CartManager = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const open = () => setIsCartOpen(true);
    window.addEventListener(OPEN_CART_EVENT, open);
    return () => window.removeEventListener(OPEN_CART_EVENT, open);
  }, []);

  const closeCart = () => setIsCartOpen(false);

  return (
    <>
      <FloatingWhatsApp whatsappUrl="https://wa.me/1234567890" />
      <Cart isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
};
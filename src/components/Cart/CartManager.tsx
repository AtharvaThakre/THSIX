import { useState } from 'react';
import { FloatingWhatsApp } from '../FloatingWhatsApp/FloatingWhatsApp';
import { Cart } from './Cart';

export const CartManager = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <>
      <FloatingWhatsApp whatsappUrl="https://wa.me/1234567890" />
      <Cart isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
};
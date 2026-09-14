import { useState } from 'react';
import { FloatingCartButton } from './FloatingCartButton';
import { Cart } from './Cart';

export const CartManager = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <>
      <FloatingCartButton onOpenCart={openCart} />
      <Cart isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
};
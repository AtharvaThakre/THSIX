import React, { useState, useEffect } from 'react';
import { Check, ShoppingBag } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import './AddToCartButton.css';

interface AddToCartButtonProps {
  productId: string;
  productTitle: string;
  productPrice: number;
  productImage: string;
  productHandle?: string;
  variantId?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  productId,
  productTitle,
  productPrice,
  productImage,
  productHandle,
  variantId,
  disabled = false,
  className = '',
  children,
}) => {
  const { addItem, isItemInCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check if item is already in cart
  useEffect(() => {
    setIsAdded(isItemInCart(productId));
  }, [productId, isItemInCart]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || isAnimating) return;

    setIsAnimating(true);
    setIsAdded(true);

    // Add to cart
    addItem({
      id: productId,
      title: productTitle,
      price: productPrice,
      image: productImage,
      variantId,
      handle: productHandle,
    });

    // Reset button after animation
    setTimeout(() => {
      setIsAnimating(false);
    }, 2000);
  };

  return (
    <button
      className={`add-to-cart-btn ${className} ${isAdded ? 'add-to-cart-btn--added' : ''} ${isAnimating ? 'add-to-cart-btn--animating' : ''}`}
      onClick={handleAddToCart}
      disabled={disabled || isAnimating}
      aria-label={isAdded ? 'Added to cart' : 'Add to cart'}
    >
      <div className="add-to-cart-btn__content">
        <div className="add-to-cart-btn__icon">
          {isAdded ? (
            <Check size={18} className="add-to-cart-btn__check" />
          ) : (
            <ShoppingBag size={18} className="add-to-cart-btn__bag" />
          )}
        </div>
        <span className="add-to-cart-btn__text">
          {children || (isAdded ? 'Added' : 'Add to Cart')}
        </span>
      </div>
    </button>
  );
};
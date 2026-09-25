import { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { checkoutFromCart, waitForShiprocket } from '../../services/shiprocket-shopify';
import { loadPickrrScript } from '../../utils/pickrr-loader';
import './Cart.css';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Cart = ({ isOpen, onClose }: CartProps) => {
  const { items, totalItems, totalPrice, updateQuantity, removeItem } = useCart();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 200);
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const products = items.map(item => ({
        variantId: item.variantId ?? '',
        quantity: item.quantity,
      }));

      if (products.some(p => !p.variantId)) {
        throw new Error('Some items in your cart are out of date. Please remove and re-add them.');
      }

      await loadPickrrScript();
      const isReady = await waitForShiprocket(10000);
      if (!isReady) {
        throw new Error('Checkout service is not available. Please refresh the page and try again.');
      }

      await checkoutFromCart(products);
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError(
        error instanceof Error 
          ? error.message 
          : 'Failed to initiate checkout. Please try again.'
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  const formatPrice = (price: number) => {
    // Ensure price is a valid number
    const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(numPrice);
  };

  // Shiprocket prices the order from Shopify (tax-inclusive) and applies its own
  // shipping/COD rules, so the cart shows the item subtotal only.
  const subtotal = totalPrice;

  if (!isOpen) return null;

  return (
    <div className={`cart-overlay ${isAnimating ? 'cart-overlay--open' : ''}`} onClick={handleClose}>
      <div className={`cart-panel ${isAnimating ? 'cart-panel--open' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <div className="cart-header__content">
            <h2 className="cart-title">Shopping Cart</h2>
            <span className="cart-count">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
          </div>
          <button className="cart-close" onClick={handleClose} aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        <div className="cart-content">
          {items.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty__icon">
                <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
              </div>
              <h3 className="cart-empty__title">Your cart is empty</h3>
              <p className="cart-empty__text">Add some items to get started</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {items.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item__image">
                      <img src={item.image} alt={item.title} />
                    </div>
                    
                    <div className="cart-item__details">
                      <h3 className="cart-item__title">{item.title.trim()}</h3>
                      {item.variantTitle && (
                        <span className="cart-item__variant">Size: {item.variantTitle}</span>
                      )}
                      <div className="cart-item__price">
                        {formatPrice(item.price)}
                      </div>
                    </div>

                    <div className="cart-item__quantity">
                      <button
                        className="quantity-btn quantity-btn--minus"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="quantity-display">{item.quantity}</span>
                      <button
                        className="quantity-btn quantity-btn--plus"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="cart-item__total">
                      {formatPrice(item.price * item.quantity)}
                    </div>

                    <button
                      className="cart-item__remove"
                      onClick={() => removeItem(item.id)}
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="cart-summary__row">
                  <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                <div className="cart-summary__row">
                  <span>Shipping & taxes</span>
                  <span>Calculated at checkout</span>
                </div>

                <div className="cart-summary__divider"></div>

                <div className="cart-summary__row cart-summary__row--total">
                  <span>Total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            {checkoutError && (
              <div className="cart-error">
                {checkoutError}
              </div>
            )}
            <button 
              className="cart-checkout-btn"
              onClick={handleCheckout}
              disabled={isCheckingOut}
            >
              <CreditCard size={18} />
              {isCheckingOut ? 'Processing...' : `Checkout • ${formatPrice(subtotal)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
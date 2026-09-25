import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import './CheckoutSuccess.css';

export const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const { clearCart } = useCart();

  useEffect(() => {
    // Reaching this page means the order went through, so always empty the cart.
    // Order details come from Shiprocket's confirmation email/SMS.
    clearCart();
  }, [clearCart]);

  return (
    <div className="checkout-success">
      <div className="checkout-success__content">
        <CheckCircle size={64} className="success-icon" />

        <h1>Order Placed Successfully!</h1>

        <p className="success-message">
          Thank you for your order. We'll send you a confirmation email shortly.
        </p>

        <div className="success-actions">
          <button onClick={() => navigate('/')} className="continue-shopping-btn">
            Continue Shopping
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import './CheckoutSuccess.css';

export const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();

  // Shiprocket redirects back with ?oid=<order id>&ost=<SUCCESS|FAILED>
  const orderId = searchParams.get('oid');
  const failed = searchParams.get('ost')?.toUpperCase() === 'FAILED';

  useEffect(() => {
    // Keep the cart when payment failed so the shopper can retry
    if (!failed) clearCart();
  }, [failed, clearCart]);

  return (
    <div className="checkout-success">
      <div className="checkout-success__content">
        {failed ? (
          <>
            <XCircle size={64} className="success-icon" />
            <h1>Payment Not Completed</h1>
            <p className="success-message">
              Your order wasn't placed. Your cart has been saved, so you can try again.
            </p>
          </>
        ) : (
          <>
            <CheckCircle size={64} className="success-icon" />
            <h1>Order Placed Successfully!</h1>
            <p className="success-message">
              Thank you for your order. We'll send you a confirmation email shortly.
            </p>
            {orderId && (
              <p className="success-message">Order ID: {orderId}</p>
            )}
          </>
        )}

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

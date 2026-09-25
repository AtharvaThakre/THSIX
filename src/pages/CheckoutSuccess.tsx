import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { fetchOrderDetails } from '../services/shiprocket';
import { useCart } from '../contexts/CartContext';
import './CheckoutSuccess.css';

export const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reaching this page means the order went through, so always empty the cart
    clearCart();

    const orderId = searchParams.get('order_id');

    if (orderId) {
      // Details are a nice-to-have; the order is placed either way
      fetchOrderDetails(orderId)
        .then((details) => setOrderDetails(details))
        .catch((err) => console.warn('Order details unavailable:', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [searchParams, clearCart]);

  if (loading) {
    return (
      <div className="checkout-success">
        <div className="checkout-success__content">
          <div className="loading-spinner"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-success">
      <div className="checkout-success__content">
        <CheckCircle size={64} className="success-icon" />
        
        <h1>Order Placed Successfully!</h1>
        
        <p className="success-message">
          Thank you for your order. We'll send you a confirmation email shortly.
        </p>

        {orderDetails && (
          <div className="order-details">
            <div className="order-info">
              <div className="order-info__item">
                <span className="label">Order ID:</span>
                <span className="value">{orderDetails.order_id || orderDetails.platform_order_id}</span>
              </div>
              
              {orderDetails.email && (
                <div className="order-info__item">
                  <span className="label">Email:</span>
                  <span className="value">{orderDetails.email}</span>
                </div>
              )}
              
              {orderDetails.total_amount_payable && (
                <div className="order-info__item">
                  <span className="label">Total Amount:</span>
                  <span className="value">
                    ₹{orderDetails.total_amount_payable.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
              )}
              
              {orderDetails.payment_type && (
                <div className="order-info__item">
                  <span className="label">Payment Type:</span>
                  <span className="value">
                    {orderDetails.payment_type === 'PREPAID' ? 'Prepaid' : 'Cash on Delivery'}
                  </span>
                </div>
              )}

              {orderDetails.edd && (
                <div className="order-info__item">
                  <span className="label">Estimated Delivery:</span>
                  <span className="value">
                    {new Date(orderDetails.edd).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="tracking-info">
              <Package size={24} />
              <p>You can track your order status using the order ID above.</p>
            </div>
          </div>
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

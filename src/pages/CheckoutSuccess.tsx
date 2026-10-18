import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { trackPurchase } from '../utils/metaPixel';
import { trackGA4Purchase } from '../utils/ga4';
import { trackShopifyPurchase } from '../utils/shopify-analytics';
import './CheckoutSuccess.css';

export const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const hasFired = useRef(false);

  // Shiprocket redirects back with ?oid=<order id>&ost=<SUCCESS|FAILED>
  const orderId = searchParams.get('oid');
  const failed = searchParams.get('ost')?.toUpperCase() === 'FAILED';

  useEffect(() => {
    // Keep the cart when payment failed so the shopper can retry
    if (failed || hasFired.current) return;
    hasFired.current = true;

    clearCart();

    // Retrieve the checkout value saved before the Shiprocket redirect.
    // localStorage is used as primary source because cross-origin payment-gateway
    // redirects (Shiprocket) can wipe sessionStorage on some browsers.
    // sessionStorage is kept as a fallback for older write-paths.
    let checkoutValue = 0;
    let checkoutItems: any[] = [];
    let currency = 'INR';
    let shopifyProducts: any[] = [];
    let shopifyCartId = '';
    try {
      const saved =
        localStorage.getItem('thsix_checkout_value') ||
        sessionStorage.getItem('thsix_checkout_value');
      if (saved) {
        const parsed = JSON.parse(saved);
        checkoutValue = parsed.value || 0;
        checkoutItems = parsed.items || [];
        currency = parsed.currency || 'INR';
        shopifyProducts = parsed.shopifyProducts || [];
        shopifyCartId = parsed.shopifyCartId || '';
        localStorage.removeItem('thsix_checkout_value');
        sessionStorage.removeItem('thsix_checkout_value');
      }
    } catch (e) {
      console.error('[CheckoutSuccess] Failed to read checkout value:', e);
    }

    // Meta Pixel Purchase (now with actual value)
    trackPurchase({
      value: checkoutValue,
      currency,
      order_id: orderId || undefined,
    });

    // GA4 Purchase
    trackGA4Purchase(
      orderId || 'unknown',
      checkoutItems,
      checkoutValue
    );

    // ── Shopify Purchase (Step 5) ──────────────────────────────────────
    if (shopifyProducts.length > 0) {
      trackShopifyPurchase(
        shopifyCartId,
        orderId || 'unknown',
        checkoutValue,
        shopifyProducts
      );
    }
  }, [failed, clearCart, orderId]);

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

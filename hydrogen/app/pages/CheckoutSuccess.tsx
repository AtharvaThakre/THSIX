import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { trackPurchase } from '../utils/metaPixel';
import { trackGA4Purchase } from '../utils/ga4';
import './CheckoutSuccess.css';

// Duplicate Shopify orders are prevented server-side (order lock), so the first try can be
// immediate; retries cover Shiprocket still indexing a just-placed order
const CONFIRM_DELAYS_MS = [0, 5000, 15000, 30000];
const REPORTED_KEY = 'thsix_purchases_reported';

/**
 * Asks the server to verify the order with Shiprocket (and create it in Shopify if needed).
 * Resolves to the order value if Shiprocket says it was really placed, otherwise null.
 */
async function confirmOrder(orderId: string): Promise<number | null> {
  for (const delay of CONFIRM_DELAYS_MS) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      const res = await fetch('/api/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
        keepalive: true,
      });
      // 4xx won't get better by retrying; 5xx = order still indexing or Shopify busy
      if (res.status < 500) {
        const data = (await res.json().catch(() => ({}))) as { placed?: boolean; value?: number };
        return data.placed ? Number(data.value) || 0 : null;
      }
    } catch { /* network blip: retry */ }
  }
  return null;
}

/** True the first time an order id is seen on this browser (refreshes don't count twice). */
function firstReport(orderId: string): boolean {
  try {
    const seen: string[] = JSON.parse(localStorage.getItem(REPORTED_KEY) || '[]');
    if (seen.includes(orderId)) return false;
    localStorage.setItem(REPORTED_KEY, JSON.stringify([...seen, orderId].slice(-20)));
  } catch { /* storage unavailable: report; Meta dedupes by event id anyway */ }
  return true;
}

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
    try {
      const saved =
        localStorage.getItem('thsix_checkout_value') ||
        sessionStorage.getItem('thsix_checkout_value');
      if (saved) {
        const parsed = JSON.parse(saved);
        checkoutValue = parsed.value || 0;
        checkoutItems = parsed.items || [];
        currency = parsed.currency || 'INR';
        localStorage.removeItem('thsix_checkout_value');
        sessionStorage.removeItem('thsix_checkout_value');
      }
    } catch (e) {
      console.error('[CheckoutSuccess] Failed to read checkout value:', e);
    }

    // Without an order id there is nothing to verify, so it isn't reported as a purchase
    if (!orderId) return;

    // The server verifies the order with Shiprocket (and makes sure it reaches Shopify). Purchase
    // is reported only for orders Shiprocket really placed — not abandoned or unpaid checkouts —
    // and once per order, so a refresh or revisit doesn't count again.
    void confirmOrder(orderId).then((verifiedValue) => {
      if (verifiedValue === null || !firstReport(orderId)) return;
      const value = verifiedValue || checkoutValue;

      // Meta Pixel Purchase. event_id = order id, matching the server-side CAPI Purchase
      trackPurchase({ value, currency, order_id: orderId }, orderId);
      trackGA4Purchase(orderId, checkoutItems, value);
    });
  }, [failed, clearCart, orderId]);

  return (
    <div className="checkout-success">
      <div className="checkout-success__content">
        {failed ? (
          <>
            <XCircle size={64} className="success-icon" />
            <h1>Payment Not Completed</h1>
            <p className="success-message">
              Your order wasn&apos;t placed. Your cart has been saved, so you can try again.
            </p>
          </>
        ) : (
          <>
            <CheckCircle size={64} className="success-icon" />
            <h1>Order Placed Successfully!</h1>
            <p className="success-message">
              Thank you for your order. We&apos;ll send you a confirmation email shortly.
            </p>
            {orderId && (
              <p className="success-message">Order ID: {orderId}</p>
            )}
          </>
        )}

        <div className="success-actions">
          <button onClick={() => void navigate('/')} className="continue-shopping-btn">
            Continue Shopping
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

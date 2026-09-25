import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import './CheckoutNotice.css';

// When Shiprocket can't start checkout it sends the shopper back to our fallbackUrl
// with attributes[fastrr_redirect]=1 appended. Without this the page just reloads.
const REDIRECT_PARAMS = [
  'attributes[fastrr_redirect]',
  'attributes[fastrr_redirect_uuid]',
  'attributes[fastrr_redirect_time]',
];

export const CheckoutNotice = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(REDIRECT_PARAMS[0])) return;

    REDIRECT_PARAMS.forEach((p) => url.searchParams.delete(p));
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="checkout-notice" role="alert">
      <span>
        We couldn't start checkout just now. Please try again in a moment, or email{' '}
        <a href="mailto:support@thsix.com">support@thsix.com</a> to place your order.
      </span>
      <button className="checkout-notice__close" onClick={() => setVisible(false)} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
};

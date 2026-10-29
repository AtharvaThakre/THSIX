/**
 * Partial COD: the shopper pays an advance online (e.g. ₹199) at Shiprocket Checkout and the
 * balance in cash on delivery.
 *
 * Shiprocket doesn't document how its order record reports the advance, so this reads every
 * plausible field: an explicit advance/prepaid/paid amount, a COD amount still to collect
 * (advance = total - that), or the online payment's own amount when it's below the total.
 * `/api/orders/reconcile?order_id=…&inspect=1` shows the real fields of an order.
 */

const num = (value) => {
  const n = typeof value === 'string' ? Number(value.replace(/[^\d.]/g, '')) : Number(value);
  return Number.isFinite(n) ? n : NaN;
};

// Amount already paid online
const PAID_KEYS = /^(advance|prepaid|partial|online|paid|upfront)_?(payment_?)?(amount|value|paid)$|^amount_?paid$|^paid_?amount$|^partial_?(cod_?)?(payment_?)?amount$|^advance$/i;
// Amount still to collect in cash on delivery
const DUE_KEYS = /^(cod|balance|remaining|pending|due)_?(amount|collectible|to_?collect|due|payable)$|^amount_?to_?collect$|^collectable_?amount$|^cod_?value$/i;
// Where a payment record (with its own amount) may sit
const PAYMENT_OBJECTS = ['paymentDetails', 'payment_details', 'payment', 'payment_info', 'partial_payment', 'partial_cod'];

function firstAmount(obj, pattern, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 3) return NaN;
  for (const [key, value] of Object.entries(obj)) {
    if (pattern.test(key) && typeof value !== 'object') {
      const n = num(value);
      if (n > 0) return n;
    }
  }
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') {
      const n = firstAmount(value, pattern, depth + 1);
      if (n > 0) return n;
    }
  }
  return NaN;
}

/**
 * @param {object} raw   Shiprocket order record
 * @param {number} total Order total
 * @returns {{partial: boolean, paid: number, due: number, source: string}}
 *   `partial` when some, but not all, of the total was paid online
 */
export function paymentBreakdown(raw, total) {
  const none = { partial: false, paid: 0, due: total, source: 'none' };
  if (!raw || !(total > 0)) return none;
  // Shiprocket says so, or the online part is at most half the total. Without that, a smaller
  // online amount is more likely a prepaid discount than an advance, and treating it as partial
  // would have the courier collect cash from someone who paid in full.
  const flagged = PARTIAL_FLAG.test(String(raw.payment_type || '') + ' ' + String(raw.payment_method || '') + ' ' + String(raw.payment_mode || ''))
    || raw.is_partial_cod === true || raw.partial_cod === true || raw.is_partial === true;
  const isPartial = (paid) => paid > 0 && paid < total - 0.5 && (flagged || paid <= total / 2);
  const result = (paid, source) => ({ partial: true, paid: round(paid), due: round(total - paid), source });

  const paid = firstAmount(raw, PAID_KEYS);
  if (isPartial(paid)) return result(paid, 'advance amount');

  const due = firstAmount(raw, DUE_KEYS);
  if (due > 0 && isPartial(total - due)) return result(total - due, 'COD amount to collect');

  for (const key of PAYMENT_OBJECTS) {
    const record = raw[key];
    const amount = record && typeof record === 'object' ? num(record.amount ?? record.paid_amount ?? record.value) : NaN;
    if (isPartial(amount)) return result(amount, `${key}.amount`);
  }
  for (const record of Array.isArray(raw.payments) ? raw.payments : []) {
    const amount = num(record && record.amount);
    if (isPartial(amount)) return result(amount, 'payments[].amount');
  }
  return none;
}

const PARTIAL_FLAG = /partial|advance/i;

const round = (n) => Math.round(n * 100) / 100;

// Never shown by inspect: customer identity and address
const PRIVATE_KEYS = /name|phone|mobile|email|mail|address|line\d|street|city|pin|zip|postal|state|landmark|lat|lng|ip|token|otp|upi_?id|vpa|card/i;

/**
 * The order's payment-related fields with their values, for diagnosis. Customer details are
 * left out.
 */
export function paymentFields(raw, depth = 0, prefix = '', out = {}) {
  if (!raw || typeof raw !== 'object' || depth > 3) return out;
  for (const [key, value] of Object.entries(raw)) {
    if (PRIVATE_KEYS.test(key)) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        if (/pay|transaction/i.test(key)) value.slice(0, 5).forEach((v, i) => paymentFields(v, depth + 1, `${path}[${i}]`, out));
      } else {
        paymentFields(value, depth + 1, path, out);
      }
    } else if (/pay|amount|cod|total|paid|prepaid|advance|partial|status|charge|discount|price|gateway|method|mode|balance|due|collect|type|is_/i.test(key)) {
      out[path] = value;
    }
  }
  return out;
}

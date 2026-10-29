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

/** Shiprocket says "CASH_ON_DELIVERY" (other places "COD"). */
export function isCashOnDelivery(type) {
  return /^(cod|cash[s_-]*on[s_-]*delivery|partial[s_-]*cod)$/i.test(String(type || '').trim());
}

/**
 * The store's fixed partial-COD advance (Oxygen env PARTIAL_COD_ADVANCE, e.g. 199): every COD
 * order pays it online at checkout and the rest on delivery. Shiprocket doesn't report it on
 * the order, so it is applied to every COD order. 0 = off.
 */
export function advanceSplit(total, advance) {
  if (!(advance > 0) || !(total > advance)) return null;
  return { partial: true, paid: round(advance), due: round(total - advance), source: 'store partial-COD advance (PARTIAL_COD_ADVANCE)' };
}

const round = (n) => Math.round(n * 100) / 100;

// Never shown: customer identity, address and payment credentials. Matched on whole words of a
// field name (customer_phone, shippingAddress, …), so e.g. shipping_charges stays visible.
const PRIVATE_WORDS = new Set(['name', 'phone', 'mobile', 'email', 'mail', 'address', 'line1', 'line2', 'line3',
  'street', 'city', 'pincode', 'pin', 'zip', 'zipcode', 'postal', 'postcode', 'state', 'landmark', 'lat', 'lng',
  'latitude', 'longitude', 'ip', 'token', 'otp', 'vpa', 'upi', 'card', 'gstin', 'pan', 'dob', 'firstname', 'lastname', 'fullname']);
const words = (key) => String(key).replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const isPrivate = (key) => words(key).some((w) => PRIVATE_WORDS.has(w));

const PAYMENT_KEY = /pay|amount|cod|total|paid|prepaid|advance|partial|status|charge|discount|price|gateway|method|mode|balance|due|collect|type|is_/i;

/** Scalar fields, flattened to dotted paths, skipping private ones; `keep` filters by key. */
function flatten(raw, keep, depth = 0, prefix = '', out = {}) {
  if (!raw || typeof raw !== 'object' || depth > 4) return out;
  for (const [key, value] of Object.entries(raw)) {
    if (isPrivate(key)) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      value.slice(0, 3).forEach((v, i) => {
        if (v && typeof v === 'object') flatten(v, keep, depth + 1, `${path}[${i}]`, out);
        else if (keep(key)) out[`${path}[${i}]`] = v;
      });
      if (value.length === 0 && keep(key)) out[path] = [];
    } else if (value && typeof value === 'object') {
      flatten(value, keep, depth + 1, path, out);
    } else if (keep(key)) {
      out[path] = typeof value === 'string' && value.length > 80 ? `${value.slice(0, 80)}…` : value;
    }
  }
  return out;
}

/** The order's payment-related fields with their values. Customer details are left out. */
export const paymentFields = (raw) => flatten(raw, (key) => PAYMENT_KEY.test(key));

/** Every field of the order except customer details, for finding where a value is reported. */
export const allFields = (raw) => flatten(raw, () => true);

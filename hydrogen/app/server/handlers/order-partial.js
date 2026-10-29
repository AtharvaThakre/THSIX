import { adminGraphQL, findOrderByTag, addOrderNote } from '../lib/shopify-admin.js';
import { paymentFields } from '../lib/partial-cod.js';
import { getShiprocketOrder, normalizeOrder } from './webhook-order.js';

/**
 * Inspect: Shiprocket's payment fields for one order (no customer details) and what the server
 * makes of them. Read-only.
 */
export async function inspectOrder(orderId) {
  const raw = await getShiprocketOrder(orderId);
  if (!raw) return { status: 404, payload: { ok: false, order_id: orderId, message: 'Shiprocket has no such order' } };
  const order = normalizeOrder(raw, orderId);
  return {
    status: 200,
    payload: {
      ok: true,
      order_id: orderId,
      detected: {
        payment_type: order.payment_type,
        payment_status: order.payment_status,
        total: Number(order.total_amount_payable) || 0,
        partial_cod: order.partial_cod,
      },
      shiprocket_payment_fields: paymentFields(raw),
    },
  };
}

/**
 * Bring an existing Shopify order in line with a partial-COD payment: the advance recorded as
 * paid, the balance left to collect. Preview unless `apply`.
 */
export async function fixPartialOrder(orderId, { apply = false } = {}) {
  const reply = (status, payload) => ({ status, payload: { order_id: orderId, applied: false, ...payload } });

  const raw = await getShiprocketOrder(orderId);
  if (!raw) return reply(404, { ok: false, message: 'Shiprocket has no such order' });
  const { partial_cod: partial, total_amount_payable: total } = normalizeOrder(raw, orderId);
  if (!partial.partial) {
    return reply(200, { ok: true, result: 'not partial COD according to Shiprocket — nothing to change' });
  }

  const found = await findOrderByTag(`sr-${orderId}`);
  if (!found) return reply(404, { ok: false, message: 'No Shopify order tagged with this Shiprocket id' });

  const data = await adminGraphQL(
    `query ($id: ID!) { order(id: $id) {
      name displayFinancialStatus
      totalReceivedSet { shopMoney { amount currencyCode } }
      totalPriceSet { shopMoney { amount } }
    } }`,
    { id: found.gid },
  );
  const o = data?.data?.order;
  if (!o) return reply(502, { ok: false, message: 'Could not read the Shopify order' });
  const received = Number(o.totalReceivedSet.shopMoney.amount) || 0;
  const plan = {
    shopify_order: o.name,
    shopify_status: o.displayFinancialStatus,
    order_total: Number(o.totalPriceSet.shopMoney.amount) || Number(total) || 0,
    advance_paid_online: partial.paid,
    balance_to_collect: partial.due,
    already_received_in_shopify: received,
  };
  const charged = Number(total) || 0;
  if (charged > 0 && plan.order_total - charged > 0.5) {
    // An offer Shiprocket applied isn't on this older order, so Shopify's balance is too high
    plan.total_mismatch = `Shiprocket charged ₹${charged} but the Shopify order totals ₹${plan.order_total}. ` +
      `Shopify will show ₹${(plan.order_total - partial.paid).toFixed(2)} due; the courier should collect ₹${partial.due}. ` +
      `To match, edit the order in Shopify admin (Edit → add a ₹${(plan.order_total - charged).toFixed(2)} discount).`;
  }

  if (Math.abs(received - partial.paid) < 0.5) {
    return reply(200, { ok: true, ...plan, result: 'already correct' });
  }
  if (received > partial.paid + 0.5) {
    // e.g. marked fully paid: lowering what Shopify says was received is a refund record, which
    // is left to a person to do in Shopify admin rather than done automatically
    return reply(200, {
      ok: true,
      ...plan,
      result: 'needs a manual correction',
      how: `Shopify records ₹${received} received but only ₹${partial.paid} was paid online. In Shopify admin open ${o.name} → Refund → refund ₹${(received - partial.paid).toFixed(2)} with "Restock" off and no customer notification, so ₹${partial.paid} stays recorded and ₹${partial.due} shows as due. Check with your payment gateway that this records only and moves no money.`,
    });
  }

  const missing = Math.round((partial.paid - received) * 100) / 100;
  if (!apply) {
    return reply(200, { ok: true, ...plan, result: `preview: would record ₹${missing} as paid (advance), leaving ₹${partial.due} to collect` });
  }

  const res = await adminGraphQL(
    `mutation ($id: ID!, $amount: MoneyInput!, $method: String) {
      orderCreateManualPayment(id: $id, amount: $amount, paymentMethodName: $method) {
        order { displayFinancialStatus totalReceivedSet { shopMoney { amount } } }
        userErrors { field message }
      }
    }`,
    { id: found.gid, amount: { amount: missing.toFixed(2), currencyCode: o.totalReceivedSet.shopMoney.currencyCode || 'INR' }, method: 'Shiprocket Checkout (advance)' },
  );
  const errors = res?.errors || res?.data?.orderCreateManualPayment?.userErrors || [];
  if (errors.length || !res?.data?.orderCreateManualPayment) {
    return reply(502, { ok: false, ...plan, message: errors.map((e) => e.message).join('; ') || 'Shopify did not record the payment' });
  }
  await adminGraphQL(
    'mutation ($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { message } } }',
    { id: found.gid, tags: ['partial-cod'] },
  ).catch(() => {});
  await addOrderNote(found.gid, `Partial COD: ₹${partial.paid} advance paid online via Shiprocket Checkout. Collect ₹${partial.due} on delivery.`).catch(() => {});
  const after = res.data.orderCreateManualPayment.order;
  return reply(200, {
    ok: true,
    applied: true,
    ...plan,
    shopify_status: after?.displayFinancialStatus,
    result: `recorded ₹${missing} advance; ₹${partial.due} left to collect`,
  });
}

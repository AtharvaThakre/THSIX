import { config } from './config.js';

/**
 * Shared-secret check for the Shiprocket webhooks and the catalogue sync.
 *
 * Shiprocket's webhooks are not signed, so when WEBHOOK_SECRET is set a webhook must carry it,
 * either in the URL registered with Shiprocket (`/api/webhooks/order?token=<secret>`) or in a
 * header (`X-Webhook-Token`, or `X-Api-Key`, which is what the Shiprocket Shipping panel's
 * "Token" field sends). Without WEBHOOK_SECRET the webhooks stay open, as they were on Vercel.
 */

/** Constant-time string comparison (Web Crypto has no timingSafeEqual on Workers). */
export function safeEqual(a, b) {
  const left = new TextEncoder().encode(String(a ?? ''));
  const right = new TextEncoder().encode(String(b ?? ''));
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

/** @returns {{ ok: boolean, enforced: boolean }} */
export function checkWebhookSecret(req) {
  const secret = config.webhookSecret;
  if (!secret) return { ok: true, enforced: false };

  const candidates = [
    req.query && req.query.token,
    req.headers['x-webhook-token'],
    req.headers['x-api-key'],
  ].filter(Boolean);
  return { ok: candidates.some((value) => safeEqual(value, secret)), enforced: true };
}

/** True when the request carries `Authorization: Bearer <CRON_SECRET>`. */
export function hasCronSecret(req) {
  const secret = config.cronSecret;
  if (!secret) return false;
  return safeEqual(req.headers.authorization || '', `Bearer ${secret}`);
}

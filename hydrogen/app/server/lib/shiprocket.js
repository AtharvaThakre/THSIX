import { config } from './config.js';

/**
 * Signed calls to Shiprocket Checkout (Custom channel).
 * Every request carries X-Api-Key and X-Api-HMAC-SHA256: a base64 HMAC-SHA256 of the
 * exact body string, keyed with the API secret. The body must be sent byte-for-byte as
 * signed, so callers pass an object and this module serialises it once.
 */
async function sign(payload) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(config.shiprocketApiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
  let binary = '';
  for (const byte of signature) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function isConfigured() {
  return Boolean(config.shiprocketApiKey && config.shiprocketApiSecret);
}

async function shiprocketPost(path, body) {
  const payload = JSON.stringify(body);
  const response = await fetch(`${config.shiprocketBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': config.shiprocketApiKey,
      'X-Api-HMAC-SHA256': await sign(payload),
    },
    body: payload,
  });

  const text = await response.text();
  return { status: response.status, ok: response.ok, data: safeParse(text), text };
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export { isConfigured, shiprocketPost, safeParse, };

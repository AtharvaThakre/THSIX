const crypto = require('crypto');
const { config } = require('./config');

/**
 * Signed calls to Shiprocket Checkout (Custom channel).
 * Every request carries X-Api-Key and X-Api-HMAC-SHA256: a base64 HMAC-SHA256 of the
 * exact body string, keyed with the API secret. The body must be sent byte-for-byte as
 * signed, so callers pass an object and this module serialises it once.
 */
function sign(payload) {
  return crypto.createHmac('sha256', config.shiprocketApiSecret).update(payload, 'utf8').digest('base64');
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
      'X-Api-HMAC-SHA256': sign(payload),
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

module.exports = {
  isConfigured,
  shiprocketPost,
  safeParse,
};

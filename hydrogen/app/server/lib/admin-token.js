/**
 * Shopify Admin API access token.
 *
 * Dev Dashboard apps have no permanent token: the server exchanges the app's client ID and
 * secret for one (client credentials grant) that lasts about 24 hours. It is cached here and
 * renewed shortly before it expires. A permanent SHOPIFY_ADMIN_ACCESS_TOKEN (legacy custom
 * app) is used when no client credentials are set, or when the exchange fails.
 */
import { config } from './config.js';

const REFRESH_MARGIN_MS = 5 * 60 * 1000;

let cached = null; // { token, expiresAt }
let pending = null;

const hasClientCredentials = () =>
  Boolean(config.shopifyAdminClientId && config.shopifyAdminClientSecret);

/** True when the server can call the Admin API at all. */
export function isAdminConfigured() {
  return hasClientCredentials() || Boolean(config.shopifyAdminToken);
}

async function requestToken() {
  const res = await fetch(`${config.shopifyStoreDomain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.shopifyAdminClientId,
      client_secret: config.shopifyAdminClientSecret,
    }).toString(),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  let data;
  try { data = JSON.parse(text); } catch { data = null; }
  if (!data?.access_token) {
    throw new Error('response had no access_token');
  }
  const ttlMs = (Number(data.expires_in) || 86399) * 1000;
  cached = { token: data.access_token, expiresAt: Date.now() + ttlMs };
  return cached.token;
}

/** Returns a valid Admin API token ('' when nothing is configured). */
export async function getAdminToken() {
  if (!hasClientCredentials()) return config.shopifyAdminToken;
  if (cached && cached.expiresAt - REFRESH_MARGIN_MS > Date.now()) return cached.token;

  pending ??= requestToken().finally(() => { pending = null; });
  try {
    return await pending;
  } catch (err) {
    console.error('[shopify-admin] Client credentials token request failed:', err.message);
    if (config.shopifyAdminToken) return config.shopifyAdminToken;
    throw err;
  }
}

/** JSON + auth headers for an Admin API request. */
export async function adminAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': await getAdminToken(),
  };
}

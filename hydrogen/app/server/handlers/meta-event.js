import { config } from '../lib/config.js';
import { jsonResponder, readBody, clientIp } from '../lib/http.js';
import { safeParse } from '../lib/shiprocket.js';
import { isCapiConfigured, sendCapiEvent } from '../lib/meta-capi.js';

/**
 * POST /api/meta/event  { event_name, event_id, event_source_url, custom_data }
 * The server-side (Conversions API) copy of a browser pixel event. The site sends it next to
 * each pixel event with the same event_id, so Meta counts the pair once and still gets the
 * event when an ad blocker stops the pixel. The server adds what Meta matches visitors by:
 * IP, user agent and the pixel's _fbp/_fbc cookies.
 *
 * Purchase is not accepted here: it is sent only by the server, once the order is verified with
 * Shiprocket and exists in Shopify (handlers/webhook-order.js). Only the site's own pages may
 * call this, with the standard events and fields below.
 */
const EVENTS = new Set(['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Lead']);

// Per-isolate limit, as in handlers/contact.js: enough for fast browsing, not for flooding
const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 60 * 1000;
const seen = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const entry = seen.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW_MS) {
    if (seen.size > 5000) seen.clear();
    seen.set(ip, { count: 1, start: now });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

const siteHost = () => {
  try { return new URL(config.websiteBaseUrl).hostname; } catch { return ''; }
};

/** True when the request comes from the site's own pages. */
function fromSite(request) {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin') return false;
  const origin = request.headers.get('origin');
  if (origin) {
    try { return new URL(origin).hostname === siteHost(); } catch { return false; }
  }
  return fetchSite === 'same-origin';
}

function cookie(request, name) {
  const match = (request.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

const text = (value, max) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined);

/** Only the standard fields Meta uses, with checked types and sizes. */
function cleanCustomData(data) {
  if (!data || typeof data !== 'object') return {};
  const out = {};
  const value = Number(data.value);
  if (data.value !== undefined && Number.isFinite(value) && value >= 0 && value < 10_000_000) out.value = Math.round(value * 100) / 100;
  if (typeof data.currency === 'string' && /^[A-Za-z]{3}$/.test(data.currency)) out.currency = data.currency.toUpperCase();
  if (Array.isArray(data.content_ids)) {
    const ids = data.content_ids.map((id) => text(String(id), 64)).filter(Boolean).slice(0, 50);
    if (ids.length) out.content_ids = ids;
  }
  if (data.content_type === 'product' || data.content_type === 'product_group') out.content_type = data.content_type;
  const name = text(data.content_name, 200);
  if (name) out.content_name = name;
  const items = Number(data.num_items);
  if (Number.isInteger(items) && items > 0 && items < 1000) out.num_items = items;
  return out;
}

export default async function handler(request) {
  const reply = jsonResponder({ 'Cache-Control': 'no-store' });
  if (request.method !== 'POST') return reply(405, { ok: false, message: 'Method not allowed' });
  if (!fromSite(request)) return reply(403, { ok: false, message: 'Forbidden' });

  const rawBody = await readBody(request);
  const body = (typeof rawBody === 'string' ? safeParse(rawBody) : rawBody) || {};
  const eventName = String(body.event_name || '');
  const eventId = String(body.event_id || '');
  if (!EVENTS.has(eventName) || !/^[A-Za-z0-9._:-]{8,64}$/.test(eventId)) {
    return reply(400, { ok: false, message: 'Invalid event' });
  }
  let sourceUrl;
  try {
    sourceUrl = new URL(String(body.event_source_url || ''));
  } catch {
    return reply(400, { ok: false, message: 'Invalid event' });
  }
  if (sourceUrl.hostname !== siteHost()) return reply(400, { ok: false, message: 'Invalid event' });

  const ip = clientIp(request);
  if (isRateLimited(ip)) return reply(429, { ok: false });
  if (!isCapiConfigured()) return reply(204);

  // _fbc is the pixel's click-id cookie; without it (pixel blocked) it is built from ?fbclid=
  const fbclid = sourceUrl.searchParams.get('fbclid');
  const fbc = text(cookie(request, '_fbc'), 500) || (fbclid ? `fb.1.${Date.now()}.${fbclid.slice(0, 400)}` : undefined);
  const fbp = text(cookie(request, '_fbp'), 200);
  const userAgent = text(request.headers.get('user-agent') || '', 512);

  await sendCapiEvent({
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: 'website',
    event_source_url: sourceUrl.toString().slice(0, 1000),
    user_data: {
      ...(ip && ip !== 'unknown' && { client_ip_address: ip }),
      ...(userAgent && { client_user_agent: userAgent }),
      ...(fbp && { fbp }),
      ...(fbc && { fbc }),
    },
    custom_data: cleanCustomData(body.custom_data),
  });
  return reply(204);
}

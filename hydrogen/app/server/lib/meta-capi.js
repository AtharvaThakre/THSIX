import { config } from './config.js';

// Graph API versions expire ~2 years after release; v19.0 (Jan 2024) is past that
const META_CAPI_VERSION = 'v23.0';

/**
 * SHA-256 hash a string for Meta CAPI PII fields (email, phone, country).
 * Meta requires lowercase + trimmed input before hashing.
 */
export async function hashPII(value) {
  if (!value) return undefined;
  const clean = String(value).trim().toLowerCase();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(clean));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function isCapiConfigured() {
  return Boolean(config.metaPixelId && config.metaCAPIToken);
}

/**
 * Sends one server event to the Meta Conversions API (dataset = the site's pixel). The event
 * carries the same event_id as its browser pixel event, so Meta counts the pair once.
 * Never throws: a failed send is logged and reported as false.
 */
export async function sendCapiEvent(event) {
  if (!isCapiConfigured()) {
    console.warn('[CAPI] Meta pixel ID or META_CAPI_TOKEN not set — skipping server-side event');
    return false;
  }
  const payload = {
    data: [event],
    // Set META_TEST_EVENT_CODE to see the events under Events Manager > Test events
    ...(config.metaTestEventCode && { test_event_code: config.metaTestEventCode }),
  };
  try {
    const res = await fetch(
      `https://graph.facebook.com/${META_CAPI_VERSION}/${config.metaPixelId}/events?access_token=${encodeURIComponent(config.metaCAPIToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    const text = await res.text();
    if (!res.ok) {
      console.error(`[CAPI] ${event.event_name} failed:`, res.status, text.slice(0, 400));
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[CAPI] Network error sending ${event.event_name}:`, err.message);
    return false;
  }
}

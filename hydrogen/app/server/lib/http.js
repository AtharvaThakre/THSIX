import { setServerEnv } from './config.js';

/**
 * Fetch-API helpers for the /api/* resource routes.
 *
 * Each handler takes the route's `Request` and returns a `Response`. Shiprocket calls the
 * catalogue and webhook endpoints from its own servers, so every API response carries these
 * CORS headers unless a handler overrides them.
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key, X-Api-HMAC-SHA256',
};

/**
 * Returns `reply(status, payload?)`, which builds a JSON `Response` (no body when `payload` is
 * omitted) with the CORS headers plus `headers`.
 */
export function jsonResponder(headers = {}) {
  return (status, payload) => {
    const responseHeaders = new Headers({ ...CORS_HEADERS, ...headers });
    if (payload === undefined) {
      return new Response(null, { status, headers: responseHeaders });
    }
    responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
    return new Response(JSON.stringify(payload), { status, headers: responseHeaders });
  };
}

/** Request body: parsed JSON for `application/json` (`{}` when empty), otherwise the raw text. */
export async function readBody(request) {
  if (request.method === 'GET' || request.method === 'HEAD') return undefined;
  const text = await request.text();
  if (!(request.headers.get('content-type') || '').includes('application/json')) return text;
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Query-string parameters as a plain object. */
export function queryParams(request) {
  return Object.fromEntries(new URL(request.url).searchParams);
}

/** The shopper's IP: Oxygen sets `oxygen-buyer-ip`; the rest cover local development. */
export function clientIp(request) {
  const value =
    request.headers.get('oxygen-buyer-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';
  return value.split(',')[0].trim();
}

/**
 * Runs an API handler from a resource route's loader/action with the Oxygen environment
 * loaded into lib/config.js. An unhandled error becomes a JSON 500.
 */
export async function handleApi(handler, request, env) {
  setServerEnv(env);
  try {
    return await handler(request);
  } catch (error) {
    console.error('[api] Unhandled handler error:', error);
    return jsonResponder()(500, { ok: false, message: 'Internal server error' });
  }
}

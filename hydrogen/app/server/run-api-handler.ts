import {setServerEnv} from './lib/config.js';

/**
 * Runs a legacy Vercel-style handler `(req, res) => …` inside a React Router resource route.
 *
 * The THSIX API handlers (Shiprocket token, catalogue, webhooks, contact) were written against
 * Node's req/res objects. Rather than rewrite ~1,700 lines of working order/webhook logic,
 * this adapter gives them the small slice of that API they use (method, headers, query, body,
 * status/json/setHeader/end) and turns what they write into a standard `Response`.
 */

type ApiRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  socket: {remoteAddress?: string};
};

type ApiResponse = {
  setHeader(name: string, value: string | number): ApiResponse;
  getHeader(name: string): string | null;
  status(code: number): ApiResponse;
  json(payload: unknown): ApiResponse;
  send(payload?: unknown): ApiResponse;
  end(payload?: unknown): ApiResponse;
};

export type ApiHandler = (req: ApiRequest, res: ApiResponse) => unknown;

// vercel.json attached these to every /api/* response
const DEFAULT_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Api-Key, X-Api-HMAC-SHA256',
};

export async function runApiHandler(
  handler: ApiHandler,
  request: Request,
  env: Env,
): Promise<Response> {
  setServerEnv(env);

  const url = new URL(request.url);
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  // Like Vercel: JSON bodies arrive parsed, anything else as a string
  let body: unknown;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const text = await request.text();
    if ((headers['content-type'] || '').includes('application/json')) {
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        body = text;
      }
    } else {
      body = text;
    }
  }

  const req: ApiRequest = {
    method: request.method,
    url: request.url,
    headers,
    query: Object.fromEntries(url.searchParams),
    body,
    socket: {
      remoteAddress:
        headers['oxygen-buyer-ip'] || headers['cf-connecting-ip'] || headers['x-real-ip'],
    },
  };

  return new Promise<Response>((resolve) => {
    const responseHeaders = new Headers(DEFAULT_CORS_HEADERS);
    let statusCode = 200;
    let done = false;

    const finish = (payload: BodyInit | null) => {
      if (done) return;
      done = true;
      // 1xx/204/304 must not carry a body
      const bodyless = statusCode === 204 || statusCode === 304;
      resolve(
        new Response(bodyless ? null : payload, {
          status: statusCode,
          headers: responseHeaders,
        }),
      );
    };

    const res: ApiResponse = {
      setHeader(name, value) {
        responseHeaders.set(name, String(value));
        return res;
      },
      getHeader: (name) => responseHeaders.get(name),
      status(code) {
        statusCode = code;
        return res;
      },
      json(payload) {
        responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
        finish(JSON.stringify(payload));
        return res;
      },
      send(payload) {
        if (payload !== null && typeof payload === 'object') {
          return res.json(payload);
        }
        finish(payload == null ? null : String(payload));
        return res;
      },
      end(payload) {
        finish(payload == null ? null : String(payload));
        return res;
      },
    };

    Promise.resolve()
      .then(() => handler(req, res))
      .then(() => finish(null))
      .catch((error) => {
        console.error('[api] Unhandled handler error:', error);
        statusCode = 500;
        responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
        finish(JSON.stringify({ok: false, message: 'Internal server error'}));
      });
  });
}

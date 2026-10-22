import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {
  createContentSecurityPolicy,
  type HydrogenRouterContextProvider,
} from '@shopify/hydrogen';
import type {EntryContext} from 'react-router';

/**
 * Third-party origins, from a browser trace of the storefront (home, product, cart, Buy Now,
 * Shiprocket checkout modal, contact, policies). Hydrogen adds 'self', the nonce,
 * cdn.shopify.com, monorail-edge.shopifysvc.com and the store/checkout domains itself.
 */
const SHIPROCKET = {
  // Checkout loader script + CSS, the delivery-promise widget (sr-cdn) and its APIs
  script: [
    'https://checkout-ui.shiprocket.com',
    'https://*.shiprocket.com',
    'https://*.shiprocket.in',
    // OTP login inside the checkout modal talks to its parent window through this script
    'https://otpless.com',
  ],
  // The checkout modal is an iframe on fastrr-boost-ui.pickrr.com (Shiprocket's Fastrr/Pickrr)
  frame: [
    'https://*.shiprocket.com',
    'https://*.shiprocket.in',
    'https://*.pickrr.com',
    'https://*.fastrr.com',
    'https://otpless.com',
    'https://*.otpless.com',
    // UPI intent: the checkout opens the shopper's UPI app through these app-link schemes
    // (list from Shiprocket); without them the browser blocks the UPI options
    'upi:',
    'tez:',
    'phonepe:',
    'paytmmp:',
    'paytm:',
    'credpay:',
    'bhim:',
    'intent:',
    'mobikwik:',
    'myairtel:',
    'amazonpay:',
    'super:',
    'navipay:',
    'lxme:',
    'slice:',
    'popclubapp:',
  ],
  connect: [
    'https://*.shiprocket.com',
    'https://*.shiprocket.in',
    'https://*.pickrr.com',
    'https://*.fastrr.com',
    // UPI app detection (Payment Request API manifests) for CRED and Google Pay
    'https://cred.club',
    'https://tez.google.com',
  ],
  img: ['https://*.shiprocket.com', 'https://*.shiprocket.in', 'https://*.pickrr.com'],
};

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: HydrogenRouterContextProvider,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    scriptSrc: [
      "'self'",
      'https://cdn.shopify.com',
      'https://connect.facebook.net',
      'https://www.googletagmanager.com',
      ...SHIPROCKET.script,
      // Required by Shiprocket's sr-cdn widget script (observed eval); inline scripts still
      // need the per-request nonce
      "'unsafe-eval'",
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      'https://cdn.shopify.com',
      'https://fonts.googleapis.com',
      'https://checkout-ui.shiprocket.com',
    ],
    fontSrc: [
      "'self'",
      'data:',
      'https://fonts.gstatic.com',
      'https://cdn.shopify.com',
      'https://checkout-ui.shiprocket.com',
    ],
    imgSrc: [
      "'self'",
      'data:',
      'blob:',
      'https://cdn.shopify.com',
      'https://www.facebook.com',
      // Meta Pixel reports its own errors with an image beacon
      'https://connect.facebook.net',
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      ...SHIPROCKET.img,
    ],
    connectSrc: [
      "'self'",
      'https://cdn.shopify.com',
      // Hydrogen perf-kit metrics
      'https://otlp-http-production.shopifysvc.com',
      'https://www.facebook.com',
      'https://connect.facebook.net',
      'https://www.google-analytics.com',
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      'https://www.googletagmanager.com',
      ...SHIPROCKET.connect,
    ],
    frameSrc: ["'self'", ...SHIPROCKET.frame],
    mediaSrc: ["'self'", 'blob:', 'https://cdn.shopify.com'],
    objectSrc: ["'none'"],
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
        nonce={nonce}
      />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  // Enforced by default. CSP_REPORT_ONLY=true (Oxygen env var, no code change) switches to
  // report-only, e.g. if a payment method inside Shiprocket needs an origin not traced yet.
  responseHeaders.set(
    context.env.CSP_REPORT_ONLY === 'true'
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy',
    header,
  );

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

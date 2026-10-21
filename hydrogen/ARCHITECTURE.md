# THSIX storefront architecture

THSIX runs on Shopify only: this Hydrogen app (React Router 7 + Hydrogen 2026.4), deployed to
Oxygen from GitHub, reading Shopify through the Storefront API, with checkout through
Shiprocket's headless "Custom" channel. This document records how it is built, the decisions
behind it, and how each part was verified.

```text
GitHub ──push──▶ .github/workflows/oxygen-deployment.yml ──▶ Shopify Oxygen
                                                                │
                                                     Hydrogen / React Router SSR
                                                                │
                              Shopify Storefront API ◀──────────┼──────────▶ Shiprocket Checkout
                              Shopify Admin API (orders)        │            (token, webhooks)
                                                                ▼
                                                             Shopify
```

## 1. Overview

| Concern | Implementation |
| --- | --- |
| Rendering | SSR on Oxygen (React Router 7 + Hydrogen 2026.4) |
| Shopify data | Route loaders → `context.storefront.query` (server, cached); no browser Storefront API calls |
| API | Resource routes `app/routes/api.*.ts` → `handleApi()` → `app/server/handlers/*.js` (Fetch `Request` → `Response`) |
| Cart | localStorage `thsix_cart` (see §3) |
| Checkout | Shiprocket headless "Custom" channel (see §4) |
| Deploys | GitHub Actions → `shopify hydrogen deploy` (see §11) |
| Cron | GitHub Actions `.github/workflows/catalog-sync.yml` (see §7) |
| SEO | Per-route SSR tags, JSON-LD, robots.txt, sitemap.xml (see §8) |

### Server-side data fetching

| Route | Loader query | Notes |
| --- | --- | --- |
| `/` | `HOME_PRODUCTS_QUERY` (250 products) | Product cards are SSR'd |
| `/product/:handle` | `PRODUCT_QUERY` | Real 404 status when missing; Product JSON-LD |
| `/brands/:brandId` | `COLLECTION_QUERY` | adidas → `frontpage`; static Adidas fallback for Shopify outages |
| Policy pages | `STATIC_POLICIES`, else `POLICIES_QUERY` | All four policies are static copy today |
| `/sitemap.xml` | `SITEMAP_PRODUCTS_QUERY` | |

Product cards link with `<Link prefetch="intent">`, so navigation is client-side with loader data.

### API endpoints

Each handler takes the route's Fetch `Request` and returns a `Response`; `app/server/lib/http.js`
holds the shared pieces: `handleApi()` loads the per-request Oxygen `env` into
`app/server/lib/config.js` and turns an unhandled error into a JSON 500, `jsonResponder()` builds
JSON responses with the API's CORS headers (`Access-Control-Allow-*`, needed because Shiprocket
calls the catalogue and webhooks from its own servers), `readBody()` parses JSON bodies (other
bodies arrive as text) and `clientIp()` reads Oxygen's `oxygen-buyer-ip`. Runtime APIs are the
Workers ones: Web Crypto for HMAC/SHA-256, `fetch` for Shiprocket, Resend, Meta and Shopify.

| Endpoint | Methods | Auth | Errors |
| --- | --- | --- | --- |
| `/api/checkout/token` | POST (OPTIONS) | public (browser) | 400 validation, 405, 500 not configured, 502 Shopify/Shiprocket failure |
| `/api/checkout/health` | GET | public, reports booleans only | always 200 |
| `/api/contact` | POST (OPTIONS) | public, 5 req / 10 min / IP / isolate; CORS `https://www.thsix.com` only | 400, 405, 429, 500 not configured, 502 Resend failure |
| `/api/catalog/products` | GET | public (Shiprocket reads it) | 400 pagination, 405, 500 |
| `/api/catalog/collections` | GET | public | same |
| `/api/catalog/products-by-collection` | GET | public | same |
| `/api/catalog/sync` | GET/POST | `Authorization: Bearer $CRON_SECRET` (always 401 when unset) | 401, 500, 502 partial failure |
| `/api/webhooks/order` | POST | `WEBHOOK_SECRET` (see §5) | 400, 401, 405, 500 → Shiprocket retries |
| `/api/webhooks/shipment` | POST (OPTIONS) | `WEBHOOK_SECRET` | 400, 401, 405 |

## 2. Routes and redirects

| URL | Result |
| --- | --- |
| `/`, `/about`, `/contactus`, `/shipping`, `/returns`, `/terms`, `/privacy`, `/payment-policy` | 200 |
| `/product/:handle` | 200, or 404 page with 404 status |
| `/products/:handle` | 301 → `/product/:handle` (query kept) |
| `/brands/:brandId` | 200 for known brands, 404 otherwise |
| `/about-us`, `/about us` | 301 → `/about` |
| `/contact`, `/contact-us` | 301 → `/contactus` |
| `/cart`, `/cart/*` | 302 → `/` |
| `/checkout/success`, `/checkouts/*`, `/:shopId/orders/:token` | checkout result page (noindex) |
| `/policies/{shipping,refund,privacy}-policy`, `/policies/terms-of-service` | 301 → THSIX policy pages |
| `/pages/about(-us)`, `/pages/contact(-us)` | 301 → `/about`, `/contactus` |
| `/collections`, `/collections/all` | 301 → `/#shop`; `/collections/frontpage` → `/brands/adidas`; `/collections/<brand>` → `/brands/<brand>` |
| anything else | 404 (after Shopify admin URL redirects via `storefrontRedirect`) |

## 3. Cart decision: localStorage, not the Shopify Cart API

- Checkout is Shiprocket's headless *Custom* channel. Shiprocket receives
  `[{variant_id, quantity}]` from `/api/checkout/token`; it never reads a Shopify cart, and a
  Shopify cart's `checkoutUrl` leads to Shopify Checkout, which must not replace Shiprocket.
- Prices are not trusted from the browser: `/api/checkout/token` re-reads every variant from
  Shopify (price, availability, title, image) and sends that as `catalog_data`.
- A Shopify cart would add a Storefront API round trip per cart change with no checkout
  benefit; its only gain (Monorail cart attribution) is covered by sending `ADD_TO_CART` directly.

Item shape: `{id, title, price, image, quantity, variantId, variantTitle, handle}`. The cart
syncs across tabs (`storage` event) and is cleared from storage directly on the success page,
so it stays clear on the full page load back from Shiprocket.

## 4. Shiprocket

Flow: product/cart → `POST /api/checkout/token` (server validates, merges duplicate lines,
re-prices from Shopify, signs with HMAC-SHA256 base64 of the exact body using
`SHIPROCKET_API_SECRET`, sends `X-Api-Key`) → `https://checkout-api.shiprocket.com/api/v1/access-token/checkout`
→ browser `HeadlessCheckout.addToCart(null, token, {fallbackUrl})` → Shiprocket redirects to
`/checkout/success?oid=&ost=` → order webhook.

- Credentials are server-only (never in `window.ENV` or the client bundle).
- `redirect_url` is restricted to thsix.com, `WEBSITE_BASE_URL`'s host, `*.myshopify.dev`
  (Oxygen previews) and localhost.
- Scripts/CSS load lazily (first interaction or 4 s); `#sellerDomain` = `thsix.com`.
- Verified on the Oxygen runtime (MiniOxygen) against the real Shiprocket API with dummy keys:
  the signed request was sent, Shiprocket answered 511 (bad credentials) and the shopper saw
  "Checkout is misconfigured. Please contact the store." Signature and payload format are also
  covered by `npm test`. `/api/checkout/health` on the deployed storefront confirms the real
  keys (`credentialsAccepted: true`).

## 5. Webhooks and Shopify orders

Both webhooks come from Shiprocket, not Shopify (THSIX registers no Shopify webhooks), and
Shiprocket does not sign them.

- `WEBHOOK_SECRET`: when set, `/api/webhooks/order` and `/api/webhooks/shipment` require it as
  `?token=` in the registered URL, or an `X-Webhook-Token` / `X-Api-Key` header (the Shiprocket
  Shipping panel's "Token" field). Constant-time comparison. Unset = open, with a warning logged.
  - Register `https://www.thsix.com/api/webhooks/order?token=<WEBHOOK_SECRET>` in Shiprocket
    Checkout > Settings > Webhooks.
  - Put `<WEBHOOK_SECRET>` in the Token field of the Shiprocket Shipping webhook pointing at
    `/api/webhooks/shipment`.
- Customer PII (address, phone, email) is not written to logs; only payload keys and counts are.
- The order webhook verifies orders through Shiprocket's signed Order Details API when the
  payload has no items, returns 500 so Shiprocket retries while an order is indexing, and
  creates Shopify orders idempotently (tag `sr-<order id>`) when Admin API access is configured.
  A body that is not JSON gets a 400.
- Admin API access (`app/server/lib/admin-token.js`): Shopify's Dev Dashboard apps have no
  permanent token, so with `SHOPIFY_ADMIN_CLIENT_ID` + `SHOPIFY_ADMIN_CLIENT_SECRET` the server
  exchanges them for a ~24h token (client credentials grant), caches it per isolate and renews it
  5 minutes before expiry. A permanent `SHOPIFY_ADMIN_ACCESS_TOKEN` is used when no client
  credentials are set, and as the fallback if the exchange fails. App scopes: `read_orders`,
  `write_orders`, `read_customers`, `write_customers`, `read_products`,
  `read_merchant_managed_fulfillment_orders`, `write_merchant_managed_fulfillment_orders`.

## 6. Analytics

| Event | Shopify Monorail / Live View | Meta Pixel | Meta CAPI | GA4 |
| --- | --- | --- | --- | --- |
| Page view | `<Analytics.Provider>` (every navigation) | base code + SPA `PageView` | — | landing `page_view` + SPA `page_view` |
| Product view | `<Analytics.ProductView>` | `ViewContent` | — | `view_item` |
| Add to cart | `ADD_TO_CART` sent directly | `AddToCart` | — | `add_to_cart` |
| Begin checkout | not a Monorail storefront event | `InitiateCheckout` | — | `begin_checkout` |
| Purchase | recorded by Shopify when the webhook creates the order | `Purchase`, eventID = order id | `Purchase`, event_id = order id | `purchase` (transaction_id) |

- `PUBLIC_STOREFRONT_ID` is read from the environment only (Oxygen injects `1000182960`) and
  normalised to the numeric ID Monorail expects; a GID works too. Without it the provider gets
  no shop and nothing is sent (there is no `'0'` fallback).
- Consent comes from Shopify's Customer Privacy API, so events carry the visitor's real
  `analytics_allowed` value (Shopify's reports skip events without analytics consent).
- Browser and server `Purchase` share the Shiprocket order id, so Meta deduplicates them.
  Graph API v23.0. A visit to the success page without an order id or a pending checkout does
  not fire Purchase.
- GA4 is off until `PUBLIC_GA4_MEASUREMENT_ID` is set; it sends the landing `page_view` on init.

## 7. Catalogue sync (cron)

Oxygen has no cron. `.github/workflows/catalog-sync.yml` calls
`GET https://www.thsix.com/api/catalog/sync` with `Authorization: Bearer $THSIX_CRON_SECRET`
daily at 20:30 UTC (02:00 IST) and on demand ("Run workflow"). It fails the run on a non-2xx
response, so GitHub emails on failure. Manual call:

```sh
curl -H "Authorization: Bearer $CRON_SECRET" https://www.thsix.com/api/catalog/sync
```

The endpoint returns 401 for every request while `CRON_SECRET` is unset.

## 8. SEO

- Every route SSRs `<title>`, description (≤160 chars), self-referencing canonical, Open Graph
  and Twitter tags (`app/lib/seo.ts`).
- Product pages: Shopify SEO title/description when set, product image as `og:image`,
  `og:type=product`, Product JSON-LD with an Offer per size and its availability.
- Home: Organization JSON-LD. Brand pages: collection SEO fields.
- `noindex` on the checkout result and 404 pages. `/payment-policy` canonicalises to `/terms`.
- `/robots.txt` (disallows `/api/`, `/cart`, `/checkout/`) and `/sitemap.xml` (static pages,
  brands, all products with `lastmod`).

## 9. Content Security Policy

Enforced by default (`Content-Security-Policy`, `app/entry.server.tsx`), built from a browser
trace of home, product pages, cart, Buy Now, the Shiprocket checkout modal, contact and policy
pages. Origins are vendor scoped; there is no bare `*`:

- Shopify: `cdn.shopify.com`, Monorail, `otlp-http-production.shopifysvc.com` (perf kit), the
  store/checkout domains.
- Meta: `connect.facebook.net`, `www.facebook.com`. GA4: `www.googletagmanager.com`,
  `*.google-analytics.com`, `*.analytics.google.com`. Google Fonts.
- Shiprocket: `checkout-ui.shiprocket.com`, `*.shiprocket.com`, `*.shiprocket.in`; the modal
  iframe `*.pickrr.com` / `*.fastrr.com`; OTP login `otpless.com`; UPI app detection
  `cred.club`, `tez.google.com`. `'unsafe-eval'` is required by Shiprocket's `sr-cdn` widget.
  Inline scripts need the per-request nonce.
- `frame-ancestors 'none'`, `base-uri 'self'`, `object-src 'none'`.

Payment pages run inside Shiprocket's iframe, which has its own CSP. If a payment method needs
a new top-level origin, set `CSP_REPORT_ONLY=true` on Oxygen (no code change), read the
console, add the origin in `app/entry.server.tsx` and remove the variable.

## 10. Performance

- Shopify data is SSR'd and cached (`CacheShort`/`CacheLong`). There is no client Storefront
  traffic.
- GSAP, Lenis and below-the-fold sections are lazy.
- Product cards use Shopify CDN `srcset` (220–600 px) with `loading="lazy"`.
- Heavy sources in `public/assets` are never downloaded: `<picture>` serves the WebP versions.
- The hero video (15 MB) loads during idle time after the poster image and is skipped for Data
  Saver and 2G connections. `scripts/optimize-hero-video.{sh,ps1}` (ffmpeg) re-encode it; that
  needs a visual sign-off.
- Tailwind v4 scans only `app/` (`@import "tailwindcss" source("../")`).

## 11. Deployment (GitHub → Oxygen)

`.github/workflows/oxygen-deployment.yml` runs on every push: `npm ci` (`.npmrc` sets
`legacy-peer-deps`), `npm run typecheck`, `npm test`, then `npx shopify hydrogen deploy` with
the `OXYGEN_DEPLOYMENT_TOKEN` secret. Oxygen maps the branch to an environment: `main` →
Production, any other branch → Preview. Runtime variables live in the Oxygen environments
(Shopify admin > Hydrogen > Storefront settings > Environments and variables), never in GitHub.

Manual deploy from a machine linked to the storefront: `cd hydrogen && npx shopify hydrogen deploy`.

### Environment variables

Oxygen injects `PUBLIC_STOREFRONT_ID`, `PUBLIC_STOREFRONT_API_TOKEN`,
`PRIVATE_STOREFRONT_API_TOKEN`, `PUBLIC_STORE_DOMAIN`, `SHOP_ID` and the Customer Account API
values. `SESSION_SECRET` and everything below are custom variables; `.env.example` documents
each one.

- Secrets: `SHIPROCKET_API_KEY`, `SHIPROCKET_API_SECRET`, `RESEND_API_KEY`, `META_CAPI_TOKEN`,
  `CRON_SECRET`, `WEBHOOK_SECRET`, `SHOPIFY_ADMIN_CLIENT_ID` + `SHOPIFY_ADMIN_CLIENT_SECRET`
  (or a legacy `SHOPIFY_ADMIN_ACCESS_TOKEN`).
- Config: `PUBLIC_CHECKOUT_DOMAIN`, `PUBLIC_META_PIXEL_ID`, `PUBLIC_GA4_MEASUREMENT_ID`
  (optional), `WEBSITE_BASE_URL`, `SUPPORT_EMAIL`, `CONTACT_FROM_EMAIL` (a sender on a domain
  verified in Resend). Optional: `SHIPROCKET_BASE_URL`, `CHECKOUT_SUCCESS_URL`,
  `SHIPROCKET_DEFAULT_WEIGHT_GRAMS`, `META_PIXEL_ID`, `PUBLIC_SHOPIFY_SHOP_ID`, `CSP_REPORT_ONLY`.

## 12. Verification

| Check | Result |
| --- | --- |
| `npm ci` from a clean `node_modules` (no flags; `.npmrc` supplies `legacy-peer-deps`) | pass |
| `npm run codegen` | pass |
| `npm run typecheck` | pass |
| `npm run lint` | 0 errors (warnings: server `console.log`, index keys on static lists) |
| `npm test` (API handlers with mocked fetch: Shiprocket signing, CAPI, Resend, auth, CORS, preflight, catalogue validation; Admin token exchange) | 49/49 and 14/14 |
| `npm run build` | pass |
| `shopify hydrogen preview` (MiniOxygen) + HTTP audit of every `/api/*` route | pass |
| Browser QA, Chrome headless, desktop 1440px + mobile 390px (cart, checkout calls, analytics, CSP, redirects, SEO) | 82/82 |

## 13. Known limitations

- `react-router` 7.16.0 (pinned by Hydrogen 2026.4.x, `~7.16.0`) has published advisories fixed
  in 7.18.x (open redirect via backslash in `<Link>`/`useNavigate`, route-matching DoS,
  SSR error deserialization). No Hydrogen 2026.4 release allows 7.18 yet, and Hydrogen 2026.10
  is a new framework-agnostic SDK rather than a drop-in upgrade. Track it with `npm audit`.
- Product pages show a hardcoded rating summary (`fakeRatingBreakdown` in
  `app/pages/ProductDetailPage.tsx`), not real customer reviews.
- The contact rate limiter is per-isolate memory. Use an Oxygen/edge rule for stronger protection.
- Cart prices shown are the prices at add time. Checkout always charges current Shopify prices.
- Meta `ViewContent` uses the product GID while `AddToCart`/`InitiateCheckout` use the numeric
  variant ID, kept so existing catalogue/audience setup isn't disturbed.
- MiniOxygen returns 500 for malformed percent-encoded URLs before the app runs (local tooling
  only).

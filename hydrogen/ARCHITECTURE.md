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
| every page (root) | `MENU_COLLECTIONS_QUERY` | All collections for the menu drawer; returned unawaited (streams after the shell), cached 60 s + 10 min SWR |
| `/` | `HOME_PRODUCTS_QUERY` (250 products + 250 collections × 20) | "All Products" row + one row per collection with products; one request, SSR'd |
| `/product/:handle` | `PRODUCT_QUERY` | Real 404 status when missing; Product JSON-LD |
| `/collections/:handle` | `COLLECTION_QUERY` (24 per page, cursor pagination) | Any Shopify collection; 404 / empty / 503 states |
| `/brands/:brandId` | `MENU_COLLECTIONS_QUERY` | Redirect only (see §2) |
| Policy pages | `STATIC_POLICIES`, else `POLICIES_QUERY` | All four policies are static copy today |
| `/sitemap.xml` | `SITEMAP_PRODUCTS_QUERY` | Products + collections that have products |

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
| `/api/orders/confirm` | POST | none (order re-read from Shiprocket) | 400, 405, 500 |
| `/api/orders/reconcile` | GET, POST | `CRON_SECRET` (Bearer) | 401, 500, 502 |

## 2. Routes and redirects

| URL | Result |
| --- | --- |
| `/`, `/about`, `/contactus`, `/shipping`, `/returns`, `/terms`, `/privacy`, `/payment-policy` | 200 |
| `/product/:handle` | 200, or 404 page with 404 status |
| `/products/:handle` | 301 → `/product/:handle` (query kept) |
| `/collections/:handle` | 200 (`noindex` while the collection is empty), 404 page with 404 status for unknown handles, 503 when Shopify is unreachable; a different-case handle 301s to Shopify's handle |
| `/brands/:brandId` | 301 → `/collections/<handle>` when a collection has that handle; 302 when matched by title (`adidas` → the "ADIDAS" collection, handle `frontpage`) or unmatched (→ 404) |
| `/about-us`, `/about us` | 301 → `/about` |
| `/contact`, `/contact-us` | 301 → `/contactus` |
| `/cart`, `/cart/*` | 302 → `/` |
| `/checkout/success`, `/checkouts/*`, `/:shopId/orders/:token` | checkout result page (noindex) |
| `/policies/{shipping,refund,privacy}-policy`, `/policies/terms-of-service` | 301 → THSIX policy pages |
| `/pages/about(-us)`, `/pages/contact(-us)` | 301 → `/about`, `/contactus` |
| `/collections`, `/collections/all` | 301 → `/#shop` (unless a real collection uses the handle `all`) |
| anything else | 404 (after Shopify admin URL redirects via `storefrontRedirect`) |

### Collections (Shopify is the source of truth)

Nothing about collections is hardcoded: adding, renaming, emptying or unpublishing a collection in
Shopify admin changes the site with no code change.

- **Menu** (`app/components/CollectionMenu/`): the menu button next to the cart opens a drawer
  listing every published collection (Shopify title, `/collections/<handle>`). The links are in the
  SSR HTML (crawlable); the drawer is `inert` while closed, traps focus while open, closes on
  Esc / overlay / link / route change, and is mutually exclusive with the cart drawer.
- **Home**: the existing carousel (`ProductShowcase` → `ProductCarousel`) shows "All Products",
  then one row per collection that has at least one product, each with a "View all" link.
  Empty collections get no row.
- **Collection page** (`app/pages/CollectionPage.tsx`): 2 columns on mobile, 3 from 768 px, 4 from
  1024 px; Hydrogen `<Pagination>` with crawlable "Load more" / "Load previous" links.
- Product cards everywhere use `app/components/ProductCard/` (one `ProductCard` GraphQL fragment).
- Changes appear within about a minute (menu cache) and within seconds elsewhere (`CacheShort`).
- The homepage "More brands" cards (`app/data/brands.ts`) are static marketing art; they link
  through `/brands/:id`, which resolves the collection from Shopify.

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
- Shiprocket's `shopify.js` + `shopify.css` (which pull in ~2 MB of `fastrr-boost-ui.pickrr.com`
  chunks) are not loaded on page view. `app/utils/pickrr-loader.ts` injects them on checkout
  intent: cart drawer opens, an item is added, Checkout / Buy Now is hovered or focused, and
  as a fallback the Checkout / Buy Now click itself (which awaits the script). `#sellerDomain` =
  `thsix.com` is in the SSR body.
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
- Two backups make sure an order reaches Shopify when the webhook doesn't (all three share
  `processOrder()` in `webhook-order.js`, so an order is created once whichever path runs first):
  - `POST /api/orders/confirm {order_id}`: the success page sends the `oid` Shiprocket
    redirected back with (after 15s, retrying at 30s and 60s). Public, but the order is re-read
    from Shiprocket's signed API, unpaid prepaid orders are skipped and nothing is echoed back.
  - `GET /api/orders/reconcile?hours=3` (`Authorization: Bearer <CRON_SECRET>`): lists
    Shiprocket orders in the window and creates the missing ones.
    `.github/workflows/order-reconcile.yml` runs it every 15 minutes (needs `THSIX_CRON_SECRET`);
    "Run workflow" with a larger `hours` backfills older orders (max 720).
- No duplicates when paths overlap (`app/server/lib/order-lock.js`): Shopify's order search lags
  behind new orders, so besides the `tag:sr-<id>` search the newest 50 orders are checked
  directly, and creation is claimed with a shop metafield (`$app:shiprocket_orders`, key
  `sr-<id>`) written with `metafieldsSet` + `compareDigest: null`, which only succeeds for the
  first request. The value becomes the Shopify order name once created. A claim is released if
  Shopify rejects the order, kept if the response is lost (so a retry can't make a second copy),
  and taken over after 10 minutes if its order never appeared. If the lock can't be used, the
  two checks still run.
- Full vs partial COD (`app/server/lib/partial-cod.js`): full COD is Shiprocket `CASH_ON_DELIVERY` with no payments and is created at full price, payment pending. Partial COD is `PARTIAL_PAID` with an online payment (e.g. UPI ₹199) plus a COD payment in Shiprocket's record, or a webhook `paymentDetails.amount` below `total_price` (checked against the record, which wins, so a prepaid discount is not mistaken for it). The advance is taken off as a `PARTIAL-COD-ADVANCE` discount so the order total is the balance: Shiprocket Shipping imports orders from Shopify and sets the courier COD amount from the total. Tag `partial-cod`; advance and balance in note attributes.
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
- GA4 is off until `PUBLIC_GA4_MEASUREMENT_ID` is set; it queues the landing `page_view` on init.
- Meta's `fbevents.js` and GA's `gtag.js` are injected after the window `load` event + an idle
  callback (or the first interaction; 8 s cap). The `fbq` stub and the `dataLayer` queue exist
  from the first byte, so `init` and the landing PageView / page_view are queued, not lost.

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
- LCP is the hero poster: a server-rendered `<picture>` (AVIF → WebP → JPEG, separate mobile
  portrait / desktop crops), `fetchpriority="high"`, preloaded per breakpoint in `root.tsx`.
- Hero video: `hero-mobile.mp4` (720×1280, ~0.9 MB) below 768 px, `hero-desktop.mp4`
  (1920×1080, ~1.8 MB) above; was one 15 MB file. It is never preloaded; it is mounted after
  `load` + idle while the hero is on screen, paused off screen, and skipped for
  `prefers-reduced-motion`, Data Saver and 2G/3G.
- Below-the-fold sections (NextDrop, Lookbook, WhyThsix, Newsletter, InstagramReels) are
  server-rendered with their CSS (imported in `HomePage.tsx`), but `LazySection` keeps their
  JavaScript (and GSAP/ScrollTrigger) from loading or hydrating until they are within 600 px of
  the viewport. Reels download only the centre video, when visible.
- Lenis smooth scroll runs only for fine pointers without reduced motion, after `load` + idle,
  and its rAF loop runs only while a smooth scroll is in progress. The ScrollVelocity marquee
  loop pauses off screen and in background tabs.
- Images are sized to their rendered size with `srcset`/`sizes`, AVIF + WebP, and lazy below the
  fold. Shopify CDN images always carry a `width` (the CDN then negotiates AVIF/WebP).
- Fonts: Inter 700/800/900 + Caveat 600, loaded without blocking render.
- Tailwind v4 scans only `app/` (`@import "tailwindcss" source("../")`).
- Lighthouse (local `shopify hydrogen preview`, median of 5, before → after): mobile 60 → 95
  (LCP 8.6 s → 2.5 s, FCP 3.6 s → 2.0 s, payload 17.9 MB → 1.9 MB); desktop 93 → 97
  (LCP 1.2 s → 0.6 s, payload 16.9 MB → 2.8 MB). CLS 0 throughout.

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
| Deferred loading (no Shiprocket/Fastrr before checkout intent, hero video only after `load`, section JS on scroll, centre reel only, `/#shop`, reduced motion) | pass |

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

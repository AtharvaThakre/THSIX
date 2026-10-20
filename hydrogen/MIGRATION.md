# THSIX: Vite + Vercel → Shopify Hydrogen + Oxygen

This document records how the legacy storefront (repository root: `src/`, `api/`,
`vercel.json`) maps onto this Hydrogen app, the decisions taken, how each part was verified,
and what still needs an external action before go-live.

## 1. Architecture

| Concern | Legacy | Hydrogen |
| --- | --- | --- |
| Rendering | Client-only SPA (`index.html`) | SSR on Oxygen (React Router 7 + Hydrogen 2026.4) |
| Shopify data | Browser → Storefront API (`fetch`, web components) | Route loaders → `context.storefront.query` (server, cached) |
| API | Vercel functions in `api/` | Resource routes `app/routes/api.*.ts` → `app/server/handlers/*.js` |
| Cart | localStorage `thsix_cart` | Unchanged (see §3) |
| Checkout | Shiprocket headless "Custom" channel | Unchanged (see §4) |
| Cron | Vercel Cron | GitHub Actions `.github/workflows/catalog-sync.yml` (see §7) |
| SEO | One static set of tags in `index.html` | Per-route SSR tags, JSON-LD, robots.txt, sitemap.xml (see §8) |

### Server-side data fetching

| Route | Loader query | Notes |
| --- | --- | --- |
| `/` | `HOME_PRODUCTS_QUERY` (250 products) | Replaces `<shopify-list-context>`; same card markup, now SSR |
| `/product/:handle` | `PRODUCT_QUERY` | Real 404 status when missing; Product JSON-LD |
| `/brands/:brandId` | `COLLECTION_QUERY` | adidas → `frontpage`; legacy Adidas fallback kept for Shopify outages |
| Policy pages | `STATIC_POLICIES`, else `POLICIES_QUERY` | All four policies are static copy today |
| `/sitemap.xml` | `SITEMAP_PRODUCTS_QUERY` | |

The browser no longer calls the Storefront API at all (verified: zero `/api/*/graphql.json`
requests in the browser trace), and the Shopify web-components script, `<shopify-store>`,
`ShopifyGuard` and `ShopifyContext` are gone. Product cards link with `<Link prefetch="intent">`,
so navigation is client-side with loader data.

### API endpoints (all preserved)

The legacy Vercel `(req, res)` handlers run unchanged through `app/server/run-api-handler.ts`
(the Node `req`/`res` subset they use, mapped to a `Response`). Node-only APIs were replaced:
`node:crypto` HMAC/SHA-256 → Web Crypto, `Buffer` → `Uint8Array`/`TextDecoder`, Resend SDK →
Resend REST API via `fetch`, `process.env` → per-request Oxygen `env`.

| Endpoint | Methods | Auth | Errors |
| --- | --- | --- | --- |
| `/api/checkout/token` | POST (OPTIONS) | public (browser) | 400 validation, 405, 500 not configured, 502 Shopify/Shiprocket failure |
| `/api/checkout/health` | GET | public, reports booleans only | always 200 |
| `/api/contact` | POST (OPTIONS) | public, 5 req / 10 min / IP / isolate | 400, 405, 429, 500 not configured, 502 Resend failure |
| `/api/catalog/products` | GET | public (Shiprocket reads it) | 400 pagination, 405, 500 |
| `/api/catalog/collections` | GET | public | same |
| `/api/catalog/products-by-collection` | GET | public | same |
| `/api/catalog/sync` | GET/POST | `Authorization: Bearer $CRON_SECRET` (always 401 when unset) | 401, 500, 502 partial failure |
| `/api/webhooks/order` | POST | `WEBHOOK_SECRET` (see §5) | 400, 401, 405, 500 → Shiprocket retries |
| `/api/webhooks/shipment` | POST (OPTIONS) | `WEBHOOK_SECRET` | 400, 401, 405 |

CORS headers from `vercel.json` (`Access-Control-Allow-*`) are applied to every API response.

## 2. Routes and redirects (all legacy URLs preserved)

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

## 3. Cart decision: keep the localStorage cart

Audited against Shopify's native Hydrogen cart (`context.cart`, Storefront API Cart). **The
localStorage cart is kept on purpose**:

- Checkout is Shiprocket's headless *Custom* channel. Shiprocket receives
  `[{variant_id, quantity}]` from `/api/checkout/token`; it never reads a Shopify cart, and a
  Shopify cart's `checkoutUrl` leads to Shopify Checkout, which must not replace Shiprocket.
- Prices are not trusted from the browser: `/api/checkout/token` re-reads every variant from
  Shopify (price, availability, title, image) and sends that as `catalog_data`.
- A Shopify cart would add a Storefront API round trip per cart change with no checkout
  benefit; its only gain (Monorail cart attribution) is covered by sending `ADD_TO_CART` directly.

Item shape is unchanged: `{id, title, price, image, quantity, variantId, variantTitle, handle}`.

Fixed while auditing:

- **Cart not cleared after payment.** On the full page load back from Shiprocket, the success
  page's effect ran before the provider loaded the saved cart, so the cart came back. `clearCart`
  now clears storage directly, and the provider never writes the empty server state over the
  saved cart before it has loaded.
- Cart now syncs across tabs (`storage` event).

Verified in Chrome (desktop 1440px and mobile 390px): add to cart with the selected variant,
quantity +/−, remove, empty state, persistence across reload, checkout and Buy Now calling
`/api/checkout/token`, errors shown to the shopper, `thsix_checkout_value` saved before redirect,
success clears the cart (and stays clear after reload), failed payment (`ost=FAILED`) keeps it.

## 4. Shiprocket

Flow: product/cart → `POST /api/checkout/token` (server validates, merges duplicate lines,
re-prices from Shopify, signs with HMAC-SHA256 base64 of the exact body using
`SHIPROCKET_API_SECRET`, sends `X-Api-Key`) → `https://checkout-api.shiprocket.com/api/v1/access-token/checkout`
→ browser `HeadlessCheckout.addToCart(null, token, {fallbackUrl})` → Shiprocket redirects to
`/checkout/success?oid=&ost=` → order webhook.

- Credentials are server-only (never in `window.ENV` or the client bundle).
- `redirect_url` is restricted to thsix.com, `WEBSITE_BASE_URL`'s host, `*.myshopify.dev`
  (Oxygen previews) and localhost.
- Scripts/CSS still load lazily (first interaction or 4 s); `#sellerDomain` = `thsix.com`.
- Verified on the Oxygen runtime (MiniOxygen/workerd) against the real Shiprocket API with
  dummy keys: signed request sent, Shiprocket answered 511 (bad credentials), shopper saw
  "Checkout is misconfigured. Please contact the store." Signature and payload format are also
  checked with mocked fetch (HMAC matches Node's `createHmac` output byte-for-byte).
- **Not testable here:** a real token/checkout/order, because no Shiprocket credentials exist
  in this environment.

## 5. Webhooks

Both webhooks come from Shiprocket, not Shopify (THSIX registers no Shopify webhooks), and
Shiprocket does not sign them. Hardening added:

- `WEBHOOK_SECRET`: when set, `/api/webhooks/order` and `/api/webhooks/shipment` require it as
  `?token=` in the registered URL, or an `X-Webhook-Token` / `X-Api-Key` header (the Shiprocket
  Shipping panel's "Token" field). Constant-time comparison. Unset = open (legacy behaviour),
  with a warning logged.
  - Register `https://www.thsix.com/api/webhooks/order?token=<WEBHOOK_SECRET>` in Shiprocket
    Checkout > Settings > Webhooks.
  - Put `<WEBHOOK_SECRET>` in the Token field of the Shiprocket Shipping webhook pointing at
    `/api/webhooks/shipment`.
- Customer PII (address, phone, email) is no longer written to logs; only payload keys are.
- The order webhook still verifies orders through Shiprocket's signed Order Details API when
  the payload has no items, returns 500 so Shiprocket retries while an order is indexing, and
  creates Shopify orders idempotently (tag `sr-<order id>`) when Admin API access is configured.
- Admin API access (`app/server/lib/admin-token.js`): Shopify's Dev Dashboard apps have no
  permanent token, so with `SHOPIFY_ADMIN_CLIENT_ID` + `SHOPIFY_ADMIN_CLIENT_SECRET` the server
  exchanges them for a ~24h token (client credentials grant), caches it per isolate and renews it
  5 minutes before expiry. A permanent `SHOPIFY_ADMIN_ACCESS_TOKEN` is used when no client
  credentials are set, and as the fallback if the exchange fails. The Vercel `api/` has the same module.

## 6. Analytics

| Event | Shopify Monorail / Live View | Meta Pixel | Meta CAPI | GA4 |
| --- | --- | --- | --- | --- |
| Page view | `<Analytics.Provider>` (every navigation) | base code + SPA `PageView` | — | landing `page_view` + SPA `page_view` |
| Product view | `<Analytics.ProductView>` | `ViewContent` | — | `view_item` |
| Add to cart | `ADD_TO_CART` sent directly | `AddToCart` | — | `add_to_cart` |
| Begin checkout | not a Monorail storefront event | `InitiateCheckout` | — | `begin_checkout` |
| Purchase | recorded by Shopify when the webhook creates the order | `Purchase`, eventID = order id | `Purchase`, event_id = order id | `purchase` (transaction_id) |

- `PUBLIC_STOREFRONT_ID` is read from the environment only (never hardcoded) and normalised to
  the numeric ID Monorail expects: Oxygen injects `1000182960`, `.shopify/project.json` holds
  `gid://shopify/HydrogenStorefront/1000182960`, and both work. The previous `'0'` fallback is
  gone: without the variable, the provider gets no shop and nothing is sent.
- Verified in Chrome: Monorail requests carry `hydrogenSubchannelId=1000182960` and
  `shop_id=78307623077`, Monorail answered 200, one page view per navigation, a product view on
  product pages and one `product_added_to_cart` per click (no duplicates).
- Fixed: the legacy `BEGIN_CHECKOUT`/`PURCHASE` Monorail calls were silently dropped by
  `sendShopifyAnalytics`, which doesn't support those names, so they were removed. The product
  view could fire before the publisher existed, so it now uses `<Analytics.ProductView>`.
  Add-to-cart uses the visitor's real consent from the Customer Privacy API instead of
  hardcoded `true`.
- Meta deduplication fixed: the browser `Purchase` used a random eventID while CAPI used the
  order id, so every purchase counted twice. Both now use the Shiprocket order id. CAPI now
  sends whether or not the optional Admin token is configured. Graph API v19.0 (expired)
  → v23.0. A visit to the success page without an order id or a pending checkout no longer
  fires Purchase.
- GA4 previously never sent the landing-page `page_view` (`send_page_view: false`, first
  render skipped). It is sent once on init now. GA4 is off until `PUBLIC_GA4_MEASUREMENT_ID` is set.
- Meta Pixel calls were captured by wrapping `fbq` in the browser test; the event names,
  parameters and eventIDs are listed in this section. Facebook does not send `/tr` beacons from
  `localhost`, so the Pixel Helper check must happen on a deployed domain.

## 7. Catalogue sync (cron)

Oxygen has no cron. `.github/workflows/catalog-sync.yml` calls
`GET https://www.thsix.com/api/catalog/sync` with `Authorization: Bearer $THSIX_CRON_SECRET`
daily at 20:30 UTC (the old Vercel schedule) and on demand ("Run workflow"). It fails
the run on a non-2xx response, so GitHub emails on failure. Manual call:

```sh
curl -H "Authorization: Bearer $CRON_SECRET" https://www.thsix.com/api/catalog/sync
```

The endpoint returns 401 for every request while `CRON_SECRET` is unset.

## 8. SEO

- Every route SSRs `<title>`, description (≤160 chars), self-referencing canonical, Open Graph
  and Twitter tags (`app/lib/seo.ts`). Legacy pointed every URL's canonical at the home page.
- Product pages: Shopify SEO title/description when set, product image as `og:image`,
  `og:type=product`, Product JSON-LD with an Offer per size and its availability.
- Home: Organization JSON-LD. Brand pages: collection SEO fields.
- `noindex` on the checkout result and 404 pages. `/payment-policy` canonicalises to `/terms`.
- `/robots.txt` (disallows `/api/`, `/cart`, `/checkout/`) and `/sitemap.xml` (static pages,
  brands, all products with `lastmod`) are new.

## 9. Content Security Policy

Enforced by default (`Content-Security-Policy`), built from a browser trace of home, product
pages, cart, Buy Now, the Shiprocket checkout modal (opened with a dummy token), contact and
policy pages. A re-run with the policy enforced had zero blocked requests. Origins are vendor
scoped; there is no bare `*`:

- Shopify: `cdn.shopify.com`, Monorail, `otlp-http-production.shopifysvc.com` (perf kit), the
  store/checkout domains.
- Meta: `connect.facebook.net`, `www.facebook.com`. GA4: `www.googletagmanager.com`,
  `*.google-analytics.com`, `*.analytics.google.com`. Google Fonts.
- Shiprocket: `checkout-ui.shiprocket.com`, `*.shiprocket.com`, `*.shiprocket.in`; the modal
  iframe `*.pickrr.com` / `*.fastrr.com`; OTP login `otpless.com`; UPI app detection
  `cred.club`, `tez.google.com`. `'unsafe-eval'` is required by Shiprocket's `sr-cdn` widget.
  Inline scripts still need the per-request nonce.
- `frame-ancestors 'none'`, `base-uri 'self'`, `object-src 'none'`.

The trace could not cover a *completed* payment (no Shiprocket credentials here). Payment
pages run inside Shiprocket's iframe, which has its own CSP. If a payment method still needs
a new top-level origin, set `CSP_REPORT_ONLY=true` on Oxygen, which needs no code change, read
the console, add the origin in `app/entry.server.tsx` and remove the variable.

## 10. Performance

- Shopify data is SSR'd and cached (`CacheShort`/`CacheLong`). There is no client Storefront
  traffic and no web-components script.
- Initial JS is about 240 KB transferred; GSAP, Lenis and below-the-fold sections are lazy.
- Product cards use Shopify CDN `srcset` (220–600 px) with `loading="lazy"`.
- Heavy sources in `public/assets` (11 MB PNGs, 4 MB JPGs) are never downloaded: `<picture>`
  serves the WebP versions.
- The hero video (15 MB) still loads during idle time after the poster image, as before. It is
  now skipped for Data Saver and 2G connections. Re-encoding it is recommended; it needs a
  visual sign-off, so it was not done here.
- Tailwind v4 scans only `app/` (`@import "tailwindcss" source("../")`).

## 11. Verification summary

| Check | Result |
| --- | --- |
| `npm install --legacy-peer-deps` from a clean `node_modules` | pass |
| `npm run typecheck` | pass |
| `npm run codegen` | pass |
| `npm run lint` | 0 errors (60 warnings: intentional server `console.log`) |
| `npm run build` | pass |
| `shopify hydrogen preview` (workerd) + HTTP route/redirect/API audit | pass |
| Browser QA, Chrome headless, desktop + mobile (82 checks) | pass |
| Handler tests with mocked fetch (Shiprocket signing, CAPI, Resend, auth; 37 checks) | pass |

The earlier "memory allocation failed" build failures were the machine running out of commit
memory (about 0.9 GB free of 23 GB at the time), not the project. With memory freed, the
unchanged config builds in about 2 s per environment.

## 12. Go-live checklist (external actions)

1. **Oxygen environment variables** (Shopify admin > Hydrogen > THSIX > Environments and
   variables > Production). Oxygen already provides `PUBLIC_STOREFRONT_ID` (1000182960),
   `PUBLIC_STOREFRONT_API_TOKEN`, `PRIVATE_STOREFRONT_API_TOKEN`, `PUBLIC_STORE_DOMAIN`, `SHOP_ID`
   and `SESSION_SECRET`. Add:
   - Secrets: `SHIPROCKET_API_KEY`, `SHIPROCKET_API_SECRET`, `RESEND_API_KEY`, `META_CAPI_TOKEN`,
     `CRON_SECRET`, `WEBHOOK_SECRET`, optional `SHOPIFY_ADMIN_CLIENT_ID` +
     `SHOPIFY_ADMIN_CLIENT_SECRET` (or a legacy `SHOPIFY_ADMIN_ACCESS_TOKEN`).
   - Config: `PUBLIC_CHECKOUT_DOMAIN`, `PUBLIC_META_PIXEL_ID`, `PUBLIC_GA4_MEASUREMENT_ID`
     (optional), `WEBSITE_BASE_URL`, `SUPPORT_EMAIL`, `CONTACT_FROM_EMAIL` (a sender on a
     domain verified in Resend).
2. Deploy: `cd hydrogen && npx shopify hydrogen deploy` (or connect the repo with
   `working-directory: hydrogen`). Check `/api/checkout/health` → `"ok": true`.
3. On the preview URL, place one real prepaid and one COD order. Watch the console for CSP
   errors, confirm the Shiprocket webhook reaches `/api/webhooks/order` (and creates the Shopify
   order if the Admin token is set), and that Meta Events Manager shows browser + server
   Purchase deduplicated.
4. Meta Pixel Helper on the deployed domain: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase.
5. Shopify admin > Analytics > Live View while browsing the deployed site.
6. Re-register Shiprocket webhook URLs with the token (§5); add the `THSIX_CRON_SECRET` repo secret (§7).
7. Point `www.thsix.com` at Oxygen. Remove Vercel (and the legacy app) only after acceptance.

## 13. Known limitations

- The contact rate limiter is per-isolate memory, as on Vercel. Use a Cloudflare/Oxygen rule
  for stronger protection.
- Cart prices shown are the prices at add time. Checkout always charges current Shopify prices.
- Meta `ViewContent` uses the product GID while `AddToCart`/`InitiateCheckout` use the numeric
  variant ID (legacy behaviour, kept so existing catalogue/audience setup isn't disturbed).
- MiniOxygen returns 500 for malformed percent-encoded URLs before the app runs (local tooling
  only).

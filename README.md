# THSIX

Headless sneaker store at [www.thsix.com](https://www.thsix.com): a React + Vite frontend on Vercel, products from Shopify, and checkout through Shiprocket Checkout.

## How it fits together

- **Products:** the browser reads Shopify through the Storefront API and Shopify Web Components.
- **Cart:** kept in the browser (`src/contexts/CartContext.tsx`).
- **Checkout:** THSIX is a **Custom channel** seller in Shiprocket Checkout, not a Shopify one. Don't use `shiprocketCheckoutEvents.buyDirect()`: it fails with "catalogue service response is null". Instead:
  1. The browser posts the cart to `/api/checkout/token`.
  2. The server looks up live prices in Shopify, signs the request with the Shiprocket API secret and returns a checkout token.
  3. The browser opens checkout with `HeadlessCheckout.addToCart(null, token, { fallbackUrl })`.
  4. After payment, Shiprocket redirects to `/checkout/success?oid=<order id>&ost=SUCCESS|FAILED`.

## API (`/api`, Vercel functions)

| Endpoint | Purpose |
|---|---|
| `POST /api/checkout/token` | Body `{ items: [{ variant_id, quantity }], redirect_url? }` → `{ ok, token, order_id }` |
| `GET /api/checkout/health` | Checks the Shiprocket keys are set and accepted (never reveals them) |
| `GET /api/catalog/products?page&limit` | Shiprocket catalogue: products |
| `GET /api/catalog/collections?page&limit` | Shiprocket catalogue: collections |
| `GET /api/catalog/products-by-collection?collection_id&page&limit` | Shiprocket catalogue: products in a collection |
| `GET /api/catalog/sync` | Pushes the catalogue to Shiprocket's webhooks. Needs `Authorization: Bearer $CRON_SECRET`; Vercel Cron runs it daily |
| `POST /api/webhooks/order` | Shiprocket order webhook. Checks the order with Shiprocket and, if `SHOPIFY_ADMIN_ACCESS_TOKEN` is set, creates it in Shopify |

Shiprocket's API reference: https://documenter.getpostman.com/view/25617008/2sB34bL3ig

## Setup

```bash
npm install
npm run dev      # http://localhost:5173, /api is proxied to production
npm run build
npm run lint
```

Environment variables are listed in `.env.example`. Set the server ones (`SHIPROCKET_*`, `CRON_SECRET`, `SHOPIFY_ADMIN_ACCESS_TOKEN`) in the Vercel dashboard.

In Shiprocket Checkout settings, set:
- Order webhook: `https://www.thsix.com/api/webhooks/order`
- Catalogue URLs: the three `/api/catalog/*` endpoints above

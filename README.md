# THSIX

Sneaker store at [www.thsix.com](https://www.thsix.com), built entirely on Shopify:

```text
GitHub ──▶ Shopify Oxygen ──▶ Hydrogen / React storefront ──▶ Shopify Storefront API ──▶ Shopify
```

Checkout runs through Shiprocket Checkout (headless "Custom" channel).

| Path | Contents |
| --- | --- |
| [`hydrogen/`](./hydrogen) | The storefront: Hydrogen + React Router app, its API routes (Shiprocket checkout token, catalogue, webhooks, contact form) and tests. Start with its [README](./hydrogen/README.md) and [ARCHITECTURE.md](./hydrogen/ARCHITECTURE.md). |
| `.github/workflows/oxygen-deployment.yml` | Deploys `hydrogen/` to Oxygen on every push (`main` → Production, other branches → Preview). |
| `.github/workflows/catalog-sync.yml` | Daily push of the Shopify catalogue to Shiprocket. |
| `Assets/` | Source design media (originals of the images and videos in `hydrogen/public`). |

## Quick start

```bash
cd hydrogen
npm ci
npx shopify hydrogen link      # once, to connect the THSIX Hydrogen storefront
npx shopify hydrogen env pull  # writes .env with the storefront's variables
npm run dev                    # http://localhost:3000
```

In Shiprocket Checkout settings:
- Order webhook: `https://www.thsix.com/api/webhooks/order?token=<WEBHOOK_SECRET>`
- Catalogue URLs: `https://www.thsix.com/api/catalog/products`, `/api/catalog/collections`,
  `/api/catalog/products-by-collection`

Shiprocket's API reference: https://documenter.getpostman.com/view/25617008/2sB34bL3ig

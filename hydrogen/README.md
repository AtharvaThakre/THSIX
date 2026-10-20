# THSIX — Hydrogen storefront

Shopify Hydrogen (React Router 7) port of the THSIX headless store, deployed to Oxygen.
The legacy Vite app and Vercel functions at the repository root stay untouched as the rollback
path until this storefront has passed acceptance. See [MIGRATION.md](./MIGRATION.md) for the
architecture, every design decision, and the remaining go-live steps.

## Requirements

- Node 22 or 24 (`engines` in package.json)
- `npm install --legacy-peer-deps` (lenis declares an optional Nuxt peer that npm can't resolve)

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with MiniOxygen and GraphQL codegen (http://localhost:3000) |
| `npm run build` | Production build (`dist/`) with codegen |
| `npm run preview` | Build, then serve the production bundle in MiniOxygen |
| `npm run typecheck` | React Router typegen + `tsc --noEmit` |
| `npm run codegen` | Regenerate `storefrontapi.generated.d.ts` from `#graphql` queries |
| `npm run lint` | ESLint (0 errors; warnings are intentional server logs) |

## Environment

Copy `.env.example` to `.env`. Public values and server-only secrets are listed separately
there. On Oxygen, set the variables in Shopify admin > Hydrogen > Storefront settings >
Environments and variables (secrets marked "Secret"). Oxygen injects `PUBLIC_STOREFRONT_ID`,
`PUBLIC_STOREFRONT_API_TOKEN`, `PRIVATE_STOREFRONT_API_TOKEN`, `PUBLIC_STORE_DOMAIN`,
`SHOP_ID` and `SESSION_SECRET` for the linked storefront automatically.

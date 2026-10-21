# THSIX — Hydrogen storefront

Shopify Hydrogen (React Router 7) storefront for [www.thsix.com](https://www.thsix.com),
deployed to Shopify Oxygen from GitHub. See [ARCHITECTURE.md](./ARCHITECTURE.md) for how it is
built, the decisions behind it and how it was verified.

## Requirements

- Node 22 or 24 (`engines` in package.json)
- npm (`.npmrc` sets `legacy-peer-deps`: lenis declares an optional Nuxt peer npm can't resolve)

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with MiniOxygen and GraphQL codegen (http://localhost:3000) |
| `npm run build` | Production build (`dist/`) with codegen |
| `npm run preview` | Build, then serve the production bundle in MiniOxygen |
| `npm run typecheck` | React Router typegen + `tsc --noEmit` |
| `npm test` | API handler and Admin-token tests (fetch mocked, no network) |
| `npm run codegen` | Regenerate `storefrontapi.generated.d.ts` from `#graphql` queries |
| `npm run lint` | ESLint (0 errors; warnings are intentional server logs) |

## Deploying

Every push runs `.github/workflows/oxygen-deployment.yml` (typecheck, tests, then
`shopify hydrogen deploy`): `main` deploys to Production, other branches to Preview. It needs
the `OXYGEN_DEPLOYMENT_TOKEN` repository secret (Shopify admin > Hydrogen > Storefront settings >
Oxygen deployments > Deployment tokens). Manual deploy: `npx shopify hydrogen deploy`.

## Environment

Copy `.env.example` to `.env` for local development (`npx shopify hydrogen link` +
`npx shopify hydrogen env pull` fill in the Shopify values). On Oxygen, set the variables in
Shopify admin > Hydrogen > Storefront settings > Environments and variables (secrets marked
"Secret"). Oxygen injects `PUBLIC_STOREFRONT_ID`, `PUBLIC_STOREFRONT_API_TOKEN`,
`PRIVATE_STOREFRONT_API_TOKEN`, `PUBLIC_STORE_DOMAIN` and `SHOP_ID` for the linked storefront.

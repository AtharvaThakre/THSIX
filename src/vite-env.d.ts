/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOPIFY_STORE_DOMAIN: string
  readonly VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_URL: string
  readonly VITE_GA_TRACKING_ID: string
  readonly VITE_SENTRY_DSN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// CSS Module declarations
declare module '*.css' {
  const content: any;
  export default content;
}
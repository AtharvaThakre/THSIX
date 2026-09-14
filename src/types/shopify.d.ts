/**
 * Ambient type declarations for Shopify Storefront Web Components.
 * These custom elements are registered by:
 * <script type="module" src="https://cdn.shopify.com/storefront/web-components.js">
 *
 * This file is automatically included by TypeScript via tsconfig "include": ["src"].
 * It must NOT have any top-level imports/exports so it stays a global declaration file.
 */

/* eslint-disable @typescript-eslint/no-namespace */

declare namespace React {
  namespace JSX {
    interface IntrinsicElements {
      'shopify-store': {
        'store-domain'?: string;
        'public-access-token'?: string;
        country?: string;
        language?: string;
        id?: string;
        key?: React.Key;
        className?: string;
        style?: Record<string, string>;
      };
      'shopify-cart': {
        id?: string;
        target?: string;
        key?: React.Key;
        className?: string;
      };
      'shopify-context': {
        type?: string;
        handle?: string;
        query?: string;
        id?: string;
        key?: React.Key;
        'wait-for-update'?: boolean | string;
        className?: string;
        children?: import('react').ReactNode;
      };
      'shopify-list-context': {
        type?: string;
        query?: string;
        first?: number | string;
        id?: string;
        key?: React.Key;
        className?: string;
        children?: import('react').ReactNode;
      };
      'shopify-data': {
        query?: string;
        id?: string;
        key?: React.Key;
        className?: string;
      };
      'shopify-media': {
        query?: string;
        width?: number | string;
        height?: number | string;
        layout?: string;
        'aspect-ratio'?: number | string;
        priority?: boolean;
        sizes?: string;
        key?: React.Key;
        className?: string;
      };
      'shopify-money': {
        query?: string;
        format?: string;
        key?: React.Key;
        className?: string;
      };
      'shopify-variant-selector': {
        'visible-option'?: string;
        id?: string;
        key?: React.Key;
        className?: string;
      };
    }
  }
}

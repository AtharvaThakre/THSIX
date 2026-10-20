import type { Brand } from '../types/brand';

export interface BrandImageSet {
  webp: string;
  webp2x: string;
  fallback: string;
}

export const brandsData: Brand[] = [
  {
    id: "adidas",
    name: "Adidas",
    logo: "/assets/logos/adidas-logo.png?v=3",
    productImage: "/assets/products/adidas.png?v=4",
    available: true,
    status: "AVAILABLE NOW",
    href: "/brands/adidas"
  },
  {
    id: "nike",
    name: "Nike",
    logo: "/assets/logos/nike-logo.png?v=3",
    productImage: "/assets/products/nike.jpg?v=2",
    available: false,
    status: "COMING SOON",
    href: "/brands/nike"
  },
  {
    id: "new-balance",
    name: "New Balance",
    logo: "/assets/logos/new-balance-logo.png?v=3",
    productImage: "/assets/products/newBalance.jpg?v=2",
    available: false,
    status: "COMING SOON",
    href: "/brands/new-balance"
  },
  {
    id: "puma",
    name: "Puma",
    logo: "/assets/logos/puma-logo.png?v=3",
    productImage: "/assets/products/puma.jpg?v=2",
    available: false,
    status: "COMING SOON",
    href: "/brands/puma"
  },
  {
    id: "asics",
    name: "ASICS",
    logo: "/assets/logos/asics-logo.png?v=3",
    productImage: "/assets/products/asics.jpeg?v=2",
    available: false,
    status: "COMING SOON",
    href: "/brands/asics"
  },
  {
    id: "converse",
    name: "Converse",
    logo: "/assets/logos/converse-logo.png?v=3",
    productImage: "/assets/products/converse.jpg?v=2",
    available: false,
    status: "COMING SOON",
    href: "/brands/converse"
  }
];

/**
 * Optimized WebP image sets for brand product images.
 * Maps brand ID → { webp (1x), webp2x (2x), fallback (original) }
 */
export const brandProductImages: Record<string, BrandImageSet> = {
  adidas: {
    webp: '/assets/products/adidas.webp',
    webp2x: '/assets/products/adidas@2x.webp',
    fallback: '/assets/products/adidas.png?v=4',
  },
  nike: {
    webp: '/assets/products/nike.webp',
    webp2x: '/assets/products/nike@2x.webp',
    fallback: '/assets/products/nike.jpg?v=2',
  },
  'new-balance': {
    webp: '/assets/products/newBalance.webp',
    webp2x: '/assets/products/newBalance@2x.webp',
    fallback: '/assets/products/newBalance.jpg?v=2',
  },
  puma: {
    webp: '/assets/products/puma.webp',
    webp2x: '/assets/products/puma@2x.webp',
    fallback: '/assets/products/puma.jpg?v=2',
  },
  asics: {
    webp: '/assets/products/asics.webp',
    webp2x: '/assets/products/asics@2x.webp',
    fallback: '/assets/products/asics.jpeg?v=2',
  },
  converse: {
    webp: '/assets/products/converse.webp',
    webp2x: '/assets/products/converse@2x.webp',
    fallback: '/assets/products/converse.jpg?v=2',
  },
};

/**
 * Optimized WebP image sets for brand logo images.
 * Maps brand ID → { webp (1x), webp2x (2x), fallback (original) }
 */
export const brandLogoImages: Record<string, BrandImageSet> = {
  adidas: {
    webp: '/assets/logos/adidas-logo.webp',
    webp2x: '/assets/logos/adidas-logo@2x.webp',
    fallback: '/assets/logos/adidas-logo.png?v=3',
  },
  nike: {
    webp: '/assets/logos/nike-logo.webp',
    webp2x: '/assets/logos/nike-logo@2x.webp',
    fallback: '/assets/logos/nike-logo.png?v=3',
  },
  'new-balance': {
    webp: '/assets/logos/new-balance-logo.webp',
    webp2x: '/assets/logos/new-balance-logo@2x.webp',
    fallback: '/assets/logos/new-balance-logo.png?v=3',
  },
  puma: {
    webp: '/assets/logos/puma-logo.webp',
    webp2x: '/assets/logos/puma-logo@2x.webp',
    fallback: '/assets/logos/puma-logo.png?v=3',
  },
  asics: {
    webp: '/assets/logos/asics-logo.webp',
    webp2x: '/assets/logos/asics-logo@2x.webp',
    fallback: '/assets/logos/asics-logo.png?v=3',
  },
  converse: {
    webp: '/assets/logos/converse-logo.webp',
    webp2x: '/assets/logos/converse-logo@2x.webp',
    fallback: '/assets/logos/converse-logo.png?v=3',
  },
};

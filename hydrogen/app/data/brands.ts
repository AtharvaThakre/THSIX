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
    productImage: "/assets/products/adidas.png?v=4",
    available: true,
    status: "AVAILABLE NOW",
    href: "/brands/adidas"
  },
  {
    id: "nike",
    name: "Nike",
    productImage: "/assets/products/nike.jpg?v=2",
    available: false,
    status: "COMING SOON",
    href: "/brands/nike"
  },
  {
    id: "new-balance",
    name: "New Balance",
    productImage: "/assets/products/newBalance.jpg?v=2",
    available: false,
    status: "COMING SOON",
    href: "/brands/new-balance"
  },
  {
    id: "puma",
    name: "Puma",
    productImage: "/assets/products/puma.jpg?v=2",
    available: false,
    status: "COMING SOON",
    href: "/brands/puma"
  },
  {
    id: "asics",
    name: "ASICS",
    productImage: "/assets/products/asics.jpeg?v=2",
    available: false,
    status: "COMING SOON",
    href: "/brands/asics"
  },
  {
    id: "converse",
    name: "Converse",
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


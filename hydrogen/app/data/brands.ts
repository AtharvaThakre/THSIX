import type { Brand } from '../types/brand';

export interface BrandImageSet {
  avif?: string;
  avif2x?: string;
  webp: string;
  webp2x: string;
  fallback: string;
}

export const brandsData: Brand[] = [
  {
    id: "adidas",
    name: "Adidas",
    productImage: "/assets/products/adidas.png?v=5",
    available: true,
    status: "AVAILABLE NOW",
    href: "/brands/adidas"
  },
  {
    id: "nike",
    name: "Nike",
    productImage: "/assets/products/nike.jpg?v=3",
    available: false,
    status: "COMING SOON",
    href: "/brands/nike"
  },
  {
    id: "new-balance",
    name: "New Balance",
    productImage: "/assets/products/newBalance.jpg?v=3",
    available: false,
    status: "COMING SOON",
    href: "/brands/new-balance"
  },
  {
    id: "puma",
    name: "Puma",
    productImage: "/assets/products/puma.jpg?v=3",
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
    productImage: "/assets/products/converse.jpg?v=3",
    available: false,
    status: "COMING SOON",
    href: "/brands/converse"
  }
];

/**
 * Optimized AVIF/WebP image sets for brand product images (served by the BrandCard <picture>).
 * Maps brand ID → { avif/webp (1x, 300w), avif2x/webp2x (2x, 600w), fallback (JPEG/PNG) }
 */
export const brandProductImages: Record<string, BrandImageSet> = {
  adidas: {
    avif: '/assets/products/adidas.avif',
    avif2x: '/assets/products/adidas@2x.avif',
    webp: '/assets/products/adidas.webp',
    webp2x: '/assets/products/adidas@2x.webp',
    fallback: '/assets/products/adidas.png?v=5',
  },
  nike: {
    avif: '/assets/products/nike.avif',
    avif2x: '/assets/products/nike@2x.avif',
    webp: '/assets/products/nike.webp',
    webp2x: '/assets/products/nike@2x.webp',
    fallback: '/assets/products/nike.jpg?v=3',
  },
  'new-balance': {
    avif: '/assets/products/newBalance.avif',
    avif2x: '/assets/products/newBalance@2x.avif',
    webp: '/assets/products/newBalance.webp',
    webp2x: '/assets/products/newBalance@2x.webp',
    fallback: '/assets/products/newBalance.jpg?v=3',
  },
  puma: {
    avif: '/assets/products/puma.avif',
    avif2x: '/assets/products/puma@2x.avif',
    webp: '/assets/products/puma.webp',
    webp2x: '/assets/products/puma@2x.webp',
    fallback: '/assets/products/puma.jpg?v=3',
  },
  asics: {
    avif: '/assets/products/asics.avif',
    avif2x: '/assets/products/asics@2x.avif',
    webp: '/assets/products/asics.webp',
    webp2x: '/assets/products/asics@2x.webp',
    fallback: '/assets/products/asics.jpeg?v=2',
  },
  converse: {
    avif: '/assets/products/converse.avif',
    avif2x: '/assets/products/converse@2x.avif',
    webp: '/assets/products/converse.webp',
    webp2x: '/assets/products/converse@2x.webp',
    fallback: '/assets/products/converse.jpg?v=3',
  },
};


import type { Brand } from '../types/brand';

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

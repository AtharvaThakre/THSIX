export interface Brand {
  id: string;
  name: string;
  logo: string | null;
  productImage: string | null;
  available: boolean;
  status: string;
  href: string;
}

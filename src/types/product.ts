export interface Product {
  id: string;
  title: string;
  color: string;
  price: number;
  currency: string;
  image: string | null;
  available: boolean;
}

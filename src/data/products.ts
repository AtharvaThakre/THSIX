import type { Product } from '../types/product';

export const formatPrice = (price: number, currency: string = 'INR'): string => {
  if (currency === 'INR') {
    return `₹ ${price.toLocaleString('en-IN')}`;
  }
  return `${currency} ${price}`;
};

export const sambaProducts: Product[] = [
  {
    id: "samba-og-cloud-white-core-black",
    title: "Samba OG",
    color: "Cloud White / Core Black",
    price: 10999,
    currency: "INR",
    image: null,
    available: true
  },
  {
    id: "samba-og-core-black-white",
    title: "Samba OG",
    color: "Core Black / White",
    price: 10999,
    currency: "INR",
    image: null,
    available: true
  },
  {
    id: "samba-og-off-white-green",
    title: "Samba OG",
    color: "Off White / Green",
    price: 10999,
    currency: "INR",
    image: null,
    available: true
  },
  {
    id: "samba-og-white-grey",
    title: "Samba OG",
    color: "White / Grey",
    price: 10999,
    currency: "INR",
    image: null,
    available: true
  }
];

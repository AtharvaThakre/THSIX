import type { LucideIcon } from 'lucide-react';
import { ShieldCheck, Truck, PackageCheck, CreditCard } from 'lucide-react';

export interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const features: Feature[] = [
  {
    title: '100% AUTHENTIC',
    description: 'Every product is sourced and verified.',
    icon: ShieldCheck,
  },
  {
    title: 'PAN-INDIA DELIVERY',
    description: 'Fast and reliable shipping across India.',
    icon: Truck,
  },
  {
    title: 'EASY RETURNS',
    description: 'Hassle free and transparent returns.',
    icon: PackageCheck,
  },
  {
    title: 'SECURE PAYMENTS',
    description: 'Multiple safe payment options.',
    icon: CreditCard,
  },
];

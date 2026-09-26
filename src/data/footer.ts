export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  label: string;
  href: string;
  iconName: 'instagram' | 'facebook' | 'pinterest';
}

export const footerColumns: FooterColumn[] = [
  {
    title: 'SHOP',
    links: [
      { label: 'New Drops', href: '/#shop' },
      { label: 'Best sellers', href: '/#shop' },
      { label: 'Brands', href: '/#brands' },
      { label: 'All products', href: '/brands/adidas' },
    ],
  },
  {
    title: 'HELP',
    links: [
      { label: 'Track Order', href: 'https://www.shiprocket.in/shipment-tracking/' },
      { label: 'Contact us via call', href: 'tel:+919022771696' },
      { label: 'Contact us via mail', href: 'mailto:support@thsix.com' },
      { label: 'About us', href: '/#about' },
    ],
  },
  {
    title: 'POLICIES',
    links: [
      { label: 'Shipping policy', href: '/shipping' },
      { label: 'Return and Refund policy', href: '/returns' },
      { label: 'Payment policy', href: '/payment-policy' },
      { label: 'Terms and Conditions', href: '/terms' },
    ],
  },
  {
    title: 'FOLLOW US',
    links: [], // Social links will be displayed separately
  },
];

export const socialLinks: SocialLink[] = [
  { label: 'Instagram', href: 'https://www.instagram.com/thsix.official?stkn=MnUwaHFhczJ4aTN6', iconName: 'instagram' },
  { label: 'Facebook', href: 'https://www.facebook.com/share/1CgrQSppfH/', iconName: 'facebook' },
  { label: 'Pinterest', href: 'https://pin.it/2LqbE5RsJ', iconName: 'pinterest' },
];

export const footerLegal = {
  copyright: '',
  links: [
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
  ],
  tagline: 'Made for a bigger tomorrow.',
};

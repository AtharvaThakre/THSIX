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
    title: 'KNOW MORE',
    links: [
      { label: 'About us', href: '/about' },
      { label: 'Cancellations & Returns', href: '/returns' },
      { label: 'Cash on Delivery Policy', href: '/cod-policy' },
    ],
  },
  {
    title: 'POLICIES',
    links: [
      { label: 'Shipping', href: '/shipping' },
      { label: 'Terms & Conditions', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
  {
    title: 'SUPPORT',
    links: [
      { label: 'Money Back Guarantee FAQ', href: '/faq' },
      { label: 'For resellers', href: '/resellers' },
      { label: 'Our Reviews', href: '/reviews' },
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
  copyright: '© 2025 THSIX. All rights reserved.',
  links: [
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
  ],
  tagline: 'Made for a bigger tomorrow.',
};

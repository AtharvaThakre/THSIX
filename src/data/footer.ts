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
  iconName: 'instagram' | 'tiktok' | 'pinterest' | 'youtube';
}

export const footerColumns: FooterColumn[] = [
  {
    title: 'SHOP',
    links: [
      { label: 'New Arrivals', href: '/shop/new-arrivals' },
      { label: 'Adidas', href: '/brands/adidas' },
      { label: 'Coming Soon', href: '/shop/coming-soon' },
    ],
  },
  {
    title: 'THSIX',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Journal', href: '/journal' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'HELP',
    links: [
      { label: 'Shipping', href: '/shipping' },
      { label: 'Returns', href: '/returns' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
];

export const socialLinks: SocialLink[] = [
  { label: 'Instagram', href: '#', iconName: 'instagram' },
  { label: 'TikTok', href: '#', iconName: 'tiktok' },
  { label: 'Pinterest', href: '#', iconName: 'pinterest' },
  { label: 'YouTube', href: '#', iconName: 'youtube' },
];

export const footerLegal = {
  copyright: '© 2025 THSIX. All rights reserved.',
  links: [
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
  ],
  tagline: 'Made for a bigger tomorrow.',
};

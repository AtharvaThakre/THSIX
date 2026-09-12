import type { SocialLink } from '../../data/footer';

/* Clean outline SVGs — brand icons not available in this lucide version */
const InstagramIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
  </svg>
);

const TikTokIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
  </svg>
);

const PinterestIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <path d="M8 12c0-2.2 1.8-4 4-4 2.2 0 4 1.8 4 4 0 3-2 5-4 5-.7 0-1.4-.2-2-.5l-1 4"/>
    <path d="M12 8v.01"/>
  </svg>
);

const YouTubeIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42C1 8.14 1 12 1 12s0 3.86.46 5.58a2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95C23 15.86 23 12 23 12s0-3.86-.46-5.58z"/>
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" stroke="currentColor" fill="none"/>
  </svg>
);

type IconComponent = (props: { size?: number }) => React.ReactElement;

const iconComponents: Record<SocialLink['iconName'], IconComponent> = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  pinterest: PinterestIcon,
  youtube: YouTubeIcon,
};

interface SocialLinksProps {
  links: SocialLink[];
}

export const SocialLinks = ({ links }: SocialLinksProps) => {
  return (
    <div className="social-links">
      {links.map((link) => {
        const Icon = iconComponents[link.iconName];
        return (
          <a
            key={link.label}
            href={link.href}
            className="social-links__item"
            aria-label={link.label}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon size={18} />
          </a>
        );
      })}
    </div>
  );
};


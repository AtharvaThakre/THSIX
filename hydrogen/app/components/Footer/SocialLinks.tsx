import type { SocialLink } from '../../data/footer';

/* Clean outline SVGs — brand icons not available in this lucide version */
const InstagramIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
  </svg>
);

const PinterestIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <path d="M8 12c0-2.2 1.8-4 4-4 2.2 0 4 1.8 4 4 0 3-2 5-4 5-.7 0-1.4-.2-2-.5l-1 4"/>
    <path d="M12 8v.01"/>
  </svg>
);

const FacebookIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 2h-3a6 6 0 0 0-6 6v3H7v4h2v8h4v-8h3l1-4h-4V8a2 2 0 0 1 2-2h1z"/>
  </svg>
);

type IconComponent = (props: { size?: number }) => React.ReactElement;

const iconComponents: Record<SocialLink['iconName'], IconComponent> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  pinterest: PinterestIcon,
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


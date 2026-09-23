export const BrandLogo = ({ brandId, name, customLogo }: { brandId: string; name: string; customLogo: string | null }) => {
  if (customLogo) {
    return (
      <img 
        src={customLogo} 
        alt={name} 
        className="brand-card__logo-img"
        width="150"
        height="80"
        loading="lazy"
        decoding="async"
      />
    );
  }

  switch (brandId) {
    case 'adidas':
      return (
        <svg viewBox="0 0 100 65" className="brand-card__logo-svg" fill="currentColor">
          <path d="M12 42 L26 42 L18 28 Z" />
          <path d="M30 42 L48 42 L34 16 Z" />
          <path d="M52 42 L74 42 L52 2 Z" />
          <text x="43" y="56" fontSize="15" fontWeight="900" textAnchor="middle" letterSpacing="-0.04em">adidas</text>
        </svg>
      );
    case 'nike':
      return (
        <svg viewBox="0 0 100 50" className="brand-card__logo-svg" fill="currentColor">
          <text x="50" y="24" fontSize="22" fontWeight="900" fontStyle="italic" textAnchor="middle" letterSpacing="0.05em">NIKE</text>
          <path d="M15 36 C35 38 60 28 85 10 C70 28 45 42 20 42 C12 42 10 38 15 36 Z" />
        </svg>
      );
    case 'new-balance':
      return (
        <svg viewBox="0 0 110 50" className="brand-card__logo-svg" fill="currentColor">
          <text x="55" y="28" fontSize="26" fontWeight="900" fontStyle="italic" textAnchor="middle" letterSpacing="-0.05em">NB</text>
          <text x="55" y="44" fontSize="10" fontWeight="700" textAnchor="middle" letterSpacing="0.02em">new balance</text>
        </svg>
      );
    case 'puma':
      return (
        <svg viewBox="0 0 100 50" className="brand-card__logo-svg" fill="currentColor">
          <path d="M72 12 C78 14 84 10 88 6 C86 12 80 18 76 20 C78 24 82 26 86 28 C80 28 74 24 70 20 Z" />
          <text x="44" y="34" fontSize="20" fontWeight="900" letterSpacing="0.08em" textAnchor="middle">PUMA</text>
        </svg>
      );
    case 'asics':
      return (
        <svg viewBox="0 0 100 50" className="brand-card__logo-svg" fill="currentColor">
          <text x="50" y="32" fontSize="22" fontWeight="800" fontStyle="italic" textAnchor="middle" letterSpacing="-0.02em">asics</text>
        </svg>
      );
    case 'converse':
      return (
        <svg viewBox="0 0 100 50" className="brand-card__logo-svg" fill="currentColor">
          <path d="M50 4 L53 14 L63 14 L55 20 L58 30 L50 24 L42 30 L45 20 L37 14 L47 14 Z" transform="scale(0.5) translate(40, 2)" />
          <text x="50" y="36" fontSize="11" fontWeight="800" textAnchor="middle" letterSpacing="0.12em">CONVERSE</text>
        </svg>
      );
    default:
      return <span className="brand-card__logo-fallback">{name}</span>;
  }
};

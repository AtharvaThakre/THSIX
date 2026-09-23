import type { LookbookItem } from '../../data/lookbook';
import './Lookbook.css';

interface LookbookCardProps {
  item: LookbookItem;
}

export const LookbookCard = ({ item }: LookbookCardProps) => {
  return (
    <div className="lookbook-card">
      <div className="lookbook-card__image-wrapper">
        <picture>
          <source
            srcSet={`${item.webp} 450w, ${item.webp2x} 900w`}
            type="image/webp"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 450px"
          />
          <source
            srcSet={item.fallback || item.image}
            type="image/jpeg"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 450px"
          />
          <img
            src={item.fallback || item.image}
            alt={item.alt}
            className="lookbook-card__image"
            loading="lazy"
            decoding="async"
            width="450"
            height="600"
          />
        </picture>
      </div>
      <div className="lookbook-card__label">
        <span className="lookbook-card__title">{item.title}</span>
        <span className="lookbook-card__number">{item.id}</span>
      </div>
    </div>
  );
};

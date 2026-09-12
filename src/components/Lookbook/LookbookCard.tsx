import type { LookbookItem } from '../../data/lookbook';
import './Lookbook.css';

interface LookbookCardProps {
  item: LookbookItem;
}

export const LookbookCard = ({ item }: LookbookCardProps) => {
  return (
    <div className="lookbook-card">
      <div className="lookbook-card__image-wrapper">
        <img
          src={item.image}
          alt={item.alt}
          className="lookbook-card__image"
          loading="lazy"
        />
      </div>
      <div className="lookbook-card__label">
        <span className="lookbook-card__title">{item.title}</span>
        <span className="lookbook-card__number">{item.id}</span>
      </div>
    </div>
  );
};

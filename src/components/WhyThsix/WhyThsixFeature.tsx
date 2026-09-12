import type { Feature } from '../../data/features';

interface WhyThsixFeatureProps {
  feature: Feature;
  isLast: boolean;
}

export const WhyThsixFeature = ({ feature, isLast }: WhyThsixFeatureProps) => {
  const Icon = feature.icon;

  return (
    <div className={`why-feature${isLast ? ' why-feature--last' : ''}`}>
      <div className="why-feature__icon-wrap">
        <Icon
          size={38}
          strokeWidth={1.4}
          className="why-feature__icon"
          aria-hidden="true"
        />
      </div>
      <h3 className="why-feature__title">{feature.title}</h3>
      <p className="why-feature__desc">{feature.description}</p>
    </div>
  );
};

import { ArrowRight } from 'lucide-react';

export const HeroContent = ({ data }: { data: any }) => {
  return (
    <div className="hero-content">
      <div className="hero-eyebrow">{data.eyebrow}</div>
      <h1 className="hero-title">
        {data.title.map((line: string, i: number) => (
          <div key={i} className="hero-title-line-wrapper" style={{ overflow: 'hidden' }}>
            <div className="hero-title-line">{line}</div>
          </div>
        ))}
      </h1>
      <p className="hero-description">{data.description}</p>
      
      <button className="hero-cta">
        <span>{data.cta}</span>
        <ArrowRight size={16} strokeWidth={1.5} className="cta-arrow" />
      </button>

      <div className="hero-tags">
        {data.tags.map((tag: string, i: number) => (
          <span key={i} className="hero-tag-item">
            {tag}
            {i < data.tags.length - 1 && <span className="tag-separator">/</span>}
          </span>
        ))}
      </div>
    </div>
  );
};

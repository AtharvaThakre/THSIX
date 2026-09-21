import { ArrowRight } from 'lucide-react';
import BlurText from './BlurText';

export const HeroContent = ({ data }: { data: any }) => {
  return (
    <div className="hero-content">
      <div className="hero-eyebrow">{data.eyebrow}</div>
      <h1 className="hero-title">
        <BlurText
          text="THE FIRST STEP. THE SAMBA."
          animateBy="words"
          direction="top"
          delay={150}
          stepDuration={0.35}
          className="hero-title-blur"
        />
      </h1>
      <p className="hero-description">{data.description}</p>
      
      <button 
        className="hero-cta"
        onClick={(e) => {
          e.preventDefault();
          const section = document.querySelector('.product-showcase') as HTMLElement;
          if (section) {
            window.scrollTo({
              top: section.offsetTop - 100,
              behavior: 'smooth'
            });
          }
        }}
      >
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

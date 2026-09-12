export const HeroMeta = ({ slide, brandMeta }: { slide: string, brandMeta: string[] }) => {
  return (
    <>
      <div className="hero-meta hero-slide">
        {slide}
      </div>
      <div className="hero-meta hero-brand">
        {brandMeta.map((line: string, i: number) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </>
  );
};

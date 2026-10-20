export const HeroDecoration = ({ text }: { text: string[] }) => {
  return (
    <div className="hero-decoration">
      {text.map((line: string, i: number) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
};

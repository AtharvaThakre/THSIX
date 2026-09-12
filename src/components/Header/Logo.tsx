interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo = ({ className = '', showText = true }: LogoProps) => {
  return (
    <div className={`logo-container ${className}`}>
      <img
        src="/assets/logo.png"
        alt="THSIX"
        className="logo-image"
      />
      {showText && <span className="logo-text">THSIX</span>}
    </div>
  );
};


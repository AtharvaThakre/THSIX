import './FloatingWhatsApp.css';

interface FloatingWhatsAppProps {
  whatsappUrl?: string;
}

export const FloatingWhatsApp = ({ 
  whatsappUrl = 'https://wa.me/1234567890' // Placeholder - will be updated later
}: FloatingWhatsAppProps) => {
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="floating-whatsapp-btn"
      aria-label="Contact us on WhatsApp"
      title="WhatsApp Support"
    >
      <svg 
        className="floating-whatsapp-btn__icon" 
        viewBox="0 0 24 24" 
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* WhatsApp Icon - Clean and Simple */}
        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l6.06-1.83C9.5 21.47 10.75 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.11 0-2.18-.27-3.11-.76l-.22-.12-2.3.7.74-2.3-.14-.23C4.5 15.13 4 13.6 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm4.03-6.97c-.2-.1-1.19-.59-1.38-.66-.19-.06-.33-.1-.47.1-.14.2-.54.67-.66.8-.13.15-.25.16-.45.05-.2-.1-.84-.31-1.6-.99-.59-.53-.99-1.19-1.1-1.39-.12-.2-.01-.31.08-.41.08-.08.2-.21.3-.31.1-.1.13-.17.2-.28.06-.12.03-.23-.03-.32-.07-.1-.47-1.13-.64-1.55-.17-.41-.34-.35-.47-.36-.12-.01-.25-.01-.38-.01-.13 0-.33.05-.5.24-.18.2-.67.65-.67 1.59 0 .94.68 1.85.77 1.98.09.13 1.3 1.98 3.15 2.78.44.19.78.31 1.04.4.44.14.84.12 1.16.07.35-.05 1.09-.45 1.24-.88.15-.43.15-.8.1-.88-.04-.08-.16-.13-.35-.22z"/>
      </svg>
    </a>
  );
};
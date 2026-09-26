import './AnnouncementBar.css';

const announcementItems = {
  left: "INDIA'S PREMIER SNEAKER DESTINATION",
  center: "THE FIRST DROP IS HERE — ADIDAS SAMBAS",
  right: "FREE SHIPPING ON ALL ORDERS"
};

export const AnnouncementBar = () => {
  return (
    <div className="announcement-bar">
      <div className="announcement-content">
        <div className="announcement-left">
          {/* <ArrowLeft size={12} strokeWidth={1.5} /> */}
          <span>{announcementItems.left}</span>
          {/* <ArrowRight size={12} strokeWidth={1.5} /> */}
        </div>
        <div className="announcement-center">
          <span>{announcementItems.center}</span>
        </div>
        <div className="announcement-right">
          {/* <ArrowLeft size={12} strokeWidth={1.5} /> */}
          <span>{announcementItems.right}</span>
          {/* <ArrowRight size={12} strokeWidth={1.5} /> */}
        </div>
      </div>
    </div>
  );
};

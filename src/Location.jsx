import React from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useLanguage } from "./contexts/LanguageContext";
import { translations } from "./translations";

// Configuration - bạn có thể thay đổi địa chỉ tại đây
const LOCATION_CONFIG = {
  venueName: "MAI HOUSE SAIGON HOTEL",
  address: "157 Nam Ky Khoi Nghia Street, Xuan Hoa Ward, Ho Chi Minh City, Vietnam",
  time: "From 6:00 PM to 11:00 PM", // Hoặc "Từ 17:00 đến 01:00"
  latitude: 10.78233, // Latitude của địa điểm
  longitude: 106.69178, // Longitude của địa điểm
  googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=", // Sẽ được thêm tọa độ
  appleMapsUrl: "https://maps.apple.com/?q=", // Sẽ được thêm tọa độ
  imageUrl: "/maihouse.jpg", // URL ảnh location
};

// Detect device type to choose appropriate map app
const getMapUrl = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  const isAndroid = /android/i.test(userAgent);
  
  const lat = LOCATION_CONFIG.latitude;
  const lng = LOCATION_CONFIG.longitude;
  
  if (isIOS) {
    // Apple Maps for iOS
    return `${LOCATION_CONFIG.appleMapsUrl}${lat},${lng}`;
  } else if (isAndroid) {
    // Google Maps for Android
    return `${LOCATION_CONFIG.googleMapsUrl}${lat},${lng}`;
  } else {
    // Default to Google Maps for desktop
    return `${LOCATION_CONFIG.googleMapsUrl}${lat},${lng}`;
  }
};

// Generate Google Maps embed URL (không cần API key - sử dụng place ID hoặc search query)
const getGoogleMapsEmbedUrl = () => {
  const lat = LOCATION_CONFIG.latitude;
  const lng = LOCATION_CONFIG.longitude;
  // Sử dụng cách embed không cần API key - search query
  const address = encodeURIComponent(LOCATION_CONFIG.address);
  return `https://www.google.com/maps?q=${address}&output=embed&z=15&center=${lat},${lng}`;
};

export default function Location() {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;

  const handleOpenMaps = () => {
    // Sử dụng tên hotel để mở trực tiếp trên Google Maps
    const hotelName = encodeURIComponent(LOCATION_CONFIG.venueName);
    const url = `https://www.google.com/maps/search/?api=1&query=${hotelName}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const venueName = language === 'vi' 
    ? (t.locationVenueName || LOCATION_CONFIG.venueName)
    : LOCATION_CONFIG.venueName;
  
  const address = language === 'vi'
    ? (t.locationAddress || LOCATION_CONFIG.address)
    : LOCATION_CONFIG.address;
  
  const time = language === 'vi'
    ? (t.locationTime || LOCATION_CONFIG.time)
    : LOCATION_CONFIG.time;

  return (
    <section className="location">
      <div className="location__wrapper">
        {/* Header with icon and title */}
        <motion.div
          className="location__header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="location__icon-wrapper">
            <MapPin className="location__icon" size={24} />
          </div>
          <h3 className="location__title">{t.location || "Location"}</h3>
        </motion.div>

        {/* Venue name */}
        <motion.h3
          className="location__venue-name"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {venueName}
        </motion.h3>

        {/* Time information */}
        <motion.div
          className="location__time"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <span>{time}</span>
        </motion.div>

        {/* Location image */}
        <motion.div
          className="location__image-wrapper"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <img
            src={LOCATION_CONFIG.imageUrl}
            alt={venueName}
            className="location__image"
            loading="lazy"
            onError={(e) => {
              // Fallback nếu ảnh không tồn tại
              e.currentTarget.style.display = 'none';
            }}
          />
        </motion.div>

        {/* Google Maps embed */}
        <motion.div
          className="location__map-wrapper"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <iframe
            className="location__map"
            src={getGoogleMapsEmbedUrl()}
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Location Map"
          />
        </motion.div>

        {/* Action button */}
        <motion.div
          className="location__actions"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <motion.button
            className="location__button location__button--maps"
            onClick={handleOpenMaps}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <MapPin size={20} />
            <span>{t.openInMaps || "Open in Maps"}</span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

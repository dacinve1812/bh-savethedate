import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "./contexts/LanguageContext";
import { translations } from "./translations";

const rsvpMedia = {
    rsvpImage: "/feature-hero-desktop.jpg",
};

export default function RSVP({ onRSVPClick }) {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  
  const handleRSVPClick = () => {
    if (onRSVPClick) {
      onRSVPClick();
    }
  };

  return (
    <section className="rsvp">
      <div className="rsvp__wrapper">
        <div className="rsvp__content">
          <motion.div
            className="rsvp__image"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{
              duration: 0.8,
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
          </motion.div>
          <motion.button
            className="rsvp__button"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{
              duration: 0.7,
              delay: 0.2,
              ease: [0.25, 0.1, 0.25, 1]
            }}
            onClick={handleRSVPClick}
          >
            {t.rsvpButton}
          </motion.button>
        </div>
      </div>
    </section>
  );
}


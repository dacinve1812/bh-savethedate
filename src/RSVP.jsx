import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "./contexts/LanguageContext";
import { translations } from "./translations";

export default function RSVP({ onGalleryClick }) {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;

  const handleClick = () => {
    if (onGalleryClick) onGalleryClick();
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
              ease: [0.25, 0.1, 0.25, 1],
            }}
          />
          <motion.p
            className="rsvp__message"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{
              duration: 0.7,
              delay: 0.2,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            {t.albumMessage}
          </motion.p>
          <motion.button
            className="rsvp__button"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{
              duration: 0.7,
              delay: 0.3,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            onClick={handleClick}
          >
            {t.albumButton}
          </motion.button>
        </div>
      </div>
    </section>
  );
}

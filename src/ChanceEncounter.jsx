import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "./contexts/LanguageContext";
import { translations } from "./translations";

function renderWithFontChange(text) {
  if (text == null) return null;
  const str = String(text);

  // Supported inline markup: <fc>highlight</fc>
  // Everything else is treated as plain text (no HTML injection).
  const parts = str.split(/(<fc>.*?<\/fc>)/g);
  return parts.map((part, idx) => {
    const match = part.match(/^<fc>(.*?)<\/fc>$/);
    if (match) {
      return (
        <span key={`fc-${idx}`} className="fontchange">
          {match[1]}
        </span>
      );
    }
    return <React.Fragment key={`txt-${idx}`}>{part}</React.Fragment>;
  });
}

export default function ChanceEncounter() {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  
  return (
    <section className="chance-encounter">
      <motion.div 
        className="chance-encounter__text"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{
          duration: 0.65,
          ease: [0.25, 0.1, 0.25, 1]
        }}
      >
        <motion.h2 
          className="chance-encounter__title mb-5"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{
            duration: 0.7,
            delay: 0.15,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          {t.chanceTitle}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{
            duration: 0.7,
            delay: 0.15,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          {renderWithFontChange(t.chanceP1)}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{
            duration: 0.7,
            delay: 0.2,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          {renderWithFontChange(t.chanceP2)}
        </motion.p>   
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{
            duration: 0.7,
            delay: 0.25,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          {renderWithFontChange(t.chanceP3)}
        </motion.p>         
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{
            duration: 0.6,
            delay: 0.3,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          {renderWithFontChange(t.chanceP4)}
        </motion.p>
      </motion.div>

      <motion.div 
        className="chance-encounter__visual"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{
          duration: 0.8,
          delay: 0.2,
          ease: [0.25, 0.1, 0.25, 1]
        }}
      >
        <img src="/chance-map.jpg" alt="" aria-hidden className="chance-encounter__layer chance-encounter__layer--map" />
        <img src="/chance-photo-2.jpg" alt="Couple walking" className="chance-encounter__layer chance-encounter__layer--walk" />
        <img src="/chance-photo-1.jpg" alt="Couple brunch" className="chance-encounter__layer chance-encounter__layer--brunch" />
        <img src="/chance-doodle-hearts.png" alt="" aria-hidden className="chance-encounter__layer chance-encounter__layer--doodle" />
        <img src="/chance-flower.png" alt="" aria-hidden className="chance-encounter__layer chance-encounter__layer--flower" />
      </motion.div>
    </section>
  );
}


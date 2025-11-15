import React from "react";
import { motion } from "framer-motion";

const FEATURE_MEDIA = {
  desktop: "/feature-hero-desktop.jpg",
  mobile: "/feature-hero-mobile.jpg",
};

export default function FeatureIntro() {
  return (
    <section className="feature-intro">
      <div className="feature-intro__overlay" aria-hidden="true" />
      <motion.div 
        className="feature-intro__content"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{
          duration: 0.8,
          ease: [0.25, 0.1, 0.25, 1]
        }}
      >
        {/* <div className="feature-intro__monogram">B & H</div> */}
        <h1 className="feature-intro__heading">Bao & Hau</h1>
      </motion.div>
    </section>
  );
}



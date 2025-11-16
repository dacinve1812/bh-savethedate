import React from "react";
import { motion } from "framer-motion";

export default function FormalInvitation() {
  return (
    <section className="formal-invitation">
      <div className="formal-invitation__wrapper">
        <div className="formal-invitation__content">
          <motion.div 
            className="formal-invitation__image"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{
              duration: 0.8,
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
            <img src="/savethedate.png" alt="Save the date" className="formal-invitation__img" loading="lazy" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{
              duration: 0.7,
              delay: 0.2,
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
            <motion.p 
              className="formal-invitation__p1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{
                duration: 0.6,
                delay: 0.3,
                ease: [0.25, 0.1, 0.25, 1]
              }}
            >
              BAO<span className="fontchange px-2">and</span> HAU
            </motion.p>
            <motion.p 
              className="formal-invitation__p2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{
                duration: 0.6,
                delay: 0.4,
                ease: [0.25, 0.1, 0.25, 1]
              }}
            >
              5.30.2026
            </motion.p>
          </motion.div>
          <motion.p 
            className="formal-invitation__text"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{
              duration: 0.7,
              delay: 0.5,
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
            Formal invitation to follow
          </motion.p>
        </div>
      </div>
    </section>
  );
}


import React from "react";
import { motion } from "framer-motion";

export default function ChanceEncounter() {
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
          className="chance-encounter__title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{
            duration: 0.7,
            delay: 0.1,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          Tie the Knot
        </motion.h2>

        {/* <p>
          As we&apos;re taking the next step in our life together, we&apos;re so happy and excited to celebrate our
          wedding day with you!
        </p> */}
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
          After years of laughter, adventures, and countless shared memories, we&apos;re finally taking the next step in our journey together.<br>
        </br>This day marks not just a celebration of love, but the beginning of a lifetime filled with new dreams, new chapters, and endless moments together.
        </motion.p>      
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{
            duration: 0.6,
            delay: 0.25,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          We&apos;re so grateful for the love and support of our family and friends who have been part of our story from the start.<br>      
        </br>Your presence means the world to us, and we can&apos;t wait to celebrate this special day surrounded by those we love most.
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


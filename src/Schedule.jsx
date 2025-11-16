import React from "react";
import { motion } from "framer-motion";

const EVENTS = [
  { time: "7:00 AM", title: "Bride's Tea Ceremony" },
  { time: "10:00 AM", title: "Groom's Tea Ceremony" },
  { time: "1:00 PM – 4:00 PM", title: "Lunch/Travel & Rest" },
  { time: "6:00 PM", title: "Guest Reception" },
  { time: "7:00 PM", title: "Wedding Ceremony" },
];

export default function Schedule() {
  return (
    <section id="schedule" className="schedule" aria-labelledby="schedule-heading">
      <div className="schedule__wrapper">
        <motion.div 
          className="schedule__container"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          <motion.header 
            className="schedule__header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{
              duration: 0.6,
              delay: 0.1,
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
            <p className="schedule__eyebrow">The Day&apos;s Events</p>
            <h2 id="schedule-heading" className="schedule__title">
              May 30, 2026
            </h2>
          </motion.header>

          <ul className="schedule__list">
            {EVENTS.map((event, index) => (
              <motion.li 
                key={event.time} 
                className="schedule__item"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false }}
                transition={{
                  duration: 0.5,
                  delay: 0.1 + (index * 0.1),
                  ease: [0.25, 0.1, 0.25, 1]
                }}
              >
                <span className="schedule__time">{event.time}</span>
                <span className="schedule__event">{event.title}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div 
          className="schedule__artwork" 
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{
            duration: 0.5,
            delay: 0.15,
            ease: [0.2, 0.1, 0.2, 1]
          }}
        >
          <img src="/artwork.png" alt="" className="schedule__art" loading="lazy" />
        </motion.div>
      </div>
    </section>
  );
}


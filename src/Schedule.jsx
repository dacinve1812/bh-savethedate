import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, X } from "lucide-react";
import { generateCalendarLinks, downloadICalFile } from "./utils/calendarUtils";

const EVENTS = [
  { time: "7:00 AM", title: "Bride's Tea Ceremony" },
  { time: "10:00 AM", title: "Groom's Tea Ceremony" },
  { time: "1:00 PM – 4:00 PM", title: "Lunch/Travel & Rest" },
  { time: "6:00 PM", title: "Guest Reception" },
  { time: "7:00 PM", title: "Wedding Ceremony" },
];

const WEDDING_DATE = new Date(2026, 4, 30); // May 30, 2026

export default function Schedule() {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef(null);
  const buttonRef = useRef(null);

  // Close modal when clicking on backdrop
  useEffect(() => {
    function handleClickBackdrop(event) {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    }

    if (isCalendarOpen) {
      document.addEventListener("mousedown", handleClickBackdrop);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("mousedown", handleClickBackdrop);
        document.body.style.overflow = "unset";
      };
    }
  }, [isCalendarOpen]);

  const calendarLinks = generateCalendarLinks({
    title: "Bao & Hau's Wedding (Đám cưới của Bảo và Hậu)",
    description: "We can't wait to celebrate with you!\n\nSchedule:\n" + 
      EVENTS.map(e => `${e.time} - ${e.title}`).join('\n'),
    location: "",
    startDate: WEDDING_DATE,
    startTime: "7:00 AM",
    endTime: "11:00 PM",
    allDay: false
  });

  // ============================================
  // CẤU HÌNH LOGO CHO CALENDAR OPTIONS
  // ============================================
  // Để thêm logo cho mỗi calendar service:
  // 1. Thêm logo images vào thư mục public (ví dụ: /public/images/calendar-logos/)
  // 2. Thay đổi imageSrc từ null thành đường dẫn đến logo
  // 3. Ví dụ: imageSrc: "/images/calendar-logos/apple-logo.png"
  // 4. Kích thước logo khuyến nghị: 24x24px hoặc 48x48px (sẽ tự scale)
  // 5. Format: PNG, SVG hoặc JPG đều được
  const calendarOptions = [
    { 
      id: "apple", 
      name: "Apple", 
      // TODO: Thay thế đường dẫn này bằng logo Apple của bạn
      // Ví dụ: imageSrc: "/images/calendar-logos/apple-logo.png"
      imageSrc: "/apple-logo.png", // Nếu null sẽ không hiển thị img
      action: () => downloadICalFile(calendarLinks.ical, "wedding.ics") 
    },
    { 
      id: "google", 
      name: "Google", 
      // TODO: Thay thế đường dẫn này bằng logo Google của bạn
      // Ví dụ: imageSrc: "/images/calendar-logos/google-logo.png"
      imageSrc: "/google-calendar-logo.png",
      action: () => window.open(calendarLinks.google, "_blank") 
    },
  ];

  const handleCalendarOption = (option) => {
    option.action();
    setIsCalendarOpen(false);
  };

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

          <motion.div 
            className="schedule__calendar-wrapper"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{
              duration: 0.5,
              delay: 0.6,
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
            <button
              ref={buttonRef}
              className="schedule__calendar-button"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              aria-expanded={isCalendarOpen}
              aria-haspopup="dialog"
            >
              <Calendar size={18} />
              <span>Add to Calendar</span>
            </button>

            <AnimatePresence>
              {isCalendarOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    className="schedule__calendar-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setIsCalendarOpen(false)}
                    aria-hidden="true"
                  />
                  
                  {/* Modal */}
                  <div className="schedule__calendar-modal-wrapper">
                    <motion.div
                      ref={calendarRef}
                      className="schedule__calendar-modal"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="calendar-modal-title"
                    >
                    <div className="schedule__calendar-modal-header">
                      <h3 id="calendar-modal-title" className="schedule__calendar-modal-title">
                        Add to Calendar
                      </h3>
                      <button
                        className="schedule__calendar-modal-close"
                        onClick={() => setIsCalendarOpen(false)}
                        aria-label="Close modal"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <ul className="schedule__calendar-options">
                      {calendarOptions.map((option) => (
                        <li key={option.id}>
                          <button
                            className="schedule__calendar-option"
                            onClick={() => handleCalendarOption(option)}
                          >
                            {option.imageSrc ? (
                              <img 
                                src={option.imageSrc} 
                                alt={`${option.name} logo`}
                                className="schedule__calendar-logo"
                              />
                            ) : (
                              <span className="schedule__calendar-icon-placeholder" />
                            )}
                            <span className="schedule__calendar-label">{option.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    </motion.div>
                  </div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
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


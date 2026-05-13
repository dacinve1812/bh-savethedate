import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import envelopeImg from "../public/envelope.png"; // ảnh envelope nội bộ
import InvitationBody from "./InvitationBody";
import RSVPPage from "./RSVPPage";
import AdminGalleryPage from "./pages/AdminGalleryPage";
import FindYourSeatPage from "./pages/FindYourSeatPage";
import AdminSeatingPage from "./pages/AdminSeatingPage";
import EventHighlightsPage from "./pages/EventHighlightsPage";
import AdminEventHighlightsPage from "./pages/AdminEventHighlightsPage";
import MusicPlayer from "./MusicPlayer";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import LanguageSelector from "./components/LanguageSelector";
import { translations } from "./translations";
import "./App.css";

const SAVE_THE_DATE = {
  heading: "Save the Date",
};

// const COUPLE = {
//   monogram: "B ❤ H",
//   tagline: "A little love story in sage & ivory",
// };

// const GALLERY = [
//   "https://images.unsplash.com/photo-1525286116112-b59af11adad1",
//   "https://images.unsplash.com/photo-1520975693410-001d8a8e3f1b",
//   "https://images.unsplash.com/photo-1519741497674-611481863552",
//   "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
//   "https://images.unsplash.com/photo-1520975600649-49b5a2c7ee08",
//   "https://images.unsplash.com/photo-1520975963690-7b3d9e9d6d2a",
// ];

export default function WeddingSite() {
  return (
    <LanguageProvider>
    <Router>
      <Routes>
          <Route path="/rsvp" element={<RSVPPageWithMusic />} />
        <Route path="/find-your-seat" element={<FindYourSeatPage />} />
        <Route path="/event-highlights" element={<EventHighlightsPage />} />
        <Route path="/admin" element={<AdminGalleryPage />} />
        <Route path="/admin/seating" element={<AdminSeatingPage />} />
        <Route path="/admin/event-highlights" element={<AdminEventHighlightsPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
    </LanguageProvider>
  );
}

function RSVPPageWithMusic() {
  return (
    <>
      <RSVPPage />
      <MusicPlayer audioSrc="/music.m4a" />
    </>
  );
}

function HomePage() {
  const galleryHash =
    typeof window !== "undefined" &&
    (() => {
      const raw = window.location.hash.slice(1);
      return raw === "gallery" || raw.startsWith("gallery/");
    })();

  const [isOpen, setIsOpen] = useState(() => Boolean(galleryHash));
  const [tab, setTab] = useState(() => (galleryHash ? "gallery" : "home"));
  const [lightbox, setLightbox] = useState(null);
  const { language } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(() => !galleryHash);
  const t = translations[language] || translations.en;

  // Hide modal when invitation is opened; when closed, re-show language unless URL targets gallery
  useEffect(() => {
    if (isOpen) {
      setShowLanguageModal(false);
    } else {
      const raw = window.location.hash.slice(1);
      const toGallery = raw === "gallery" || raw.startsWith("gallery/");
      if (!toGallery) {
        setShowLanguageModal(true);
      }
    }
  }, [isOpen]);

  const handleLanguageSelect = () => {
    setShowLanguageModal(false);
  };

  return (
    <div className="min-h-screen bg-[#f6f7ef] text-[#1c2321]">
      {/* Language Selector Modal - hiển thị ở initial page (trước envelope) */}
      {!isOpen && showLanguageModal && (
        <LanguageSelector 
          key="language-selector"
          onSelect={handleLanguageSelect} 
          isOpen={showLanguageModal}
          onClose={() => setShowLanguageModal(false)}
        />
      )}
      
      <AnimatePresence>
        {!isOpen && !showLanguageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-[#f6f7ef]"
          >
            <div className="flex flex-col items-center">

              <Envelope onOpen={() => setIsOpen(true)} />

              <motion.p 
                className="open-me-text"
              >
                {t.openMe}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="invitation-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="invitation-content-wrapper"
          >
            <InvitationBody
              tab={tab}
              onTabChange={setTab}
              lightbox={lightbox}
              onLightbox={setLightbox}
              saveTheDate={SAVE_THE_DATE}
              // couple={COUPLE}
              // gallery={GALLERY}
              isInvitationOpen={isOpen}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Music Player - hiển thị khi đã mở invitation, autoPlay vì user đã click envelope */}
      {isOpen && <MusicPlayer audioSrc="/music.m4a" autoPlay={true} />}
    </div>
  );
}


function Envelope({ onOpen }) {
  const [clicked, setClicked] = useState(false);
  return (
    <button
      onClick={() => {
        setClicked(true);
        setTimeout(onOpen, 650);
      }}
      className="relative grid place-items-center"
      aria-label="Open invitation"
    >
      <motion.img 
        src={envelopeImg} 
        alt="Envelope" 
        className="w-[520px] max-w-[80vw] drop-shadow-xl rounded-2xl"
        animate={{
          y: [0, -25, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.img
        src="/click me.gif"
        alt="Click me"
        className="absolute w-[80px] max-w-[15vw] pointer-events-none"
        style={{ top: '58%', left: '45%' }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          scale: [1, 1.1, 1],
        }}
        transition={{
          opacity: { duration: 0.5, delay: 0.3 },
          scale: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      />
    </button>
  );
}

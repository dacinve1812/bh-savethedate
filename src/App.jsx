import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import envelopeImg from "../public/envelope.png"; // ảnh envelope nội bộ
import InvitationBody from "./InvitationBody";
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
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState("home");
  const [lightbox, setLightbox] = useState(null);

  return (
    <div className="min-h-screen bg-[#f6f7ef] text-[#1c2321]">
      <AnimatePresence>
        {!isOpen && (
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
                Open me!
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

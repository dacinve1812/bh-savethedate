import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import envelopeImg from "./assets/envelope.png"; // ảnh envelope nội bộ
import InvitationBody from "./InvitationBody";
import "./App.css";

const SAVE_THE_DATE = {
  heading: "Save the Date",
  names: "Bao & Hau",
  date: "Sat • Nov 22, 2025",
  time: "4:30 PM",
  venue: "The Conservatory, Atlanta Botanical Garden",
  address: "1345 Piedmont Ave NE, Atlanta, GA",
  googleMaps: "https://maps.google.com/",
  note: "Formal attire • Reception to follow",
  rsvpLink: "https://forms.gle/your-form",
  email: "baonguyen@example.com",
};

const COUPLE = {
  monogram: "B ❤ H",
  tagline: "A little love story in sage & ivory",
};

const GALLERY = [
  "https://images.unsplash.com/photo-1525286116112-b59af11adad1",
  "https://images.unsplash.com/photo-1520975693410-001d8a8e3f1b",
  "https://images.unsplash.com/photo-1519741497674-611481863552",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  "https://images.unsplash.com/photo-1520975600649-49b5a2c7ee08",
  "https://images.unsplash.com/photo-1520975963690-7b3d9e9d6d2a",
];

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
            <div className="flex flex-col items-center gap-6">

              <Envelope onOpen={() => setIsOpen(true)} />

              <p className="text-xs text-gray-500">Tap the envelope to open</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <InvitationBody
        tab={tab}
        onTabChange={setTab}
        lightbox={lightbox}
        onLightbox={setLightbox}
        saveTheDate={SAVE_THE_DATE}
        couple={COUPLE}
        gallery={GALLERY}
      />
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
      <img src={envelopeImg} alt="Envelope" className="w-[520px] max-w-[80vw] drop-shadow-xl rounded-2xl" />
    </button>
  );
}

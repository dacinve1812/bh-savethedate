import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "./contexts/LanguageContext";
import { translations } from "./translations";

export default function TopNav({ tab, onTabChange }) {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const [canShow, setCanShow] = useState(false);
  const navRef = useRef(null);

  const TABS = [
    { key: "home", label: t.home },
    { key: "gallery", label: t.gallery },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setCanShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleHomeClick = () => {
    window.scrollTo({ top: 0, behavior: "instant" });
    if (tab !== "home") {
      setTimeout(() => {
        onTabChange("home");
      }, 0);
    }
  };

  return (
    <motion.div
      ref={navRef}
      initial={{ y: -24, opacity: 0 }}
      animate={{
        y: canShow ? 0 : -24,
        opacity: canShow ? 1 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      }}
      className="relative z-20 w-full bg-[#f6f7ef]/95 backdrop-blur-sm"
    >
      <nav className="mx-auto flex w-full justify-center py-3">
        <div className="relative flex items-center gap-8 rounded-full px-6">
          {TABS.map(({ key, label }) => (
            <TabButton
              key={key}
              label={label}
              active={tab === key}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "instant" });
                if (key === "home") {
                  handleHomeClick();
                } else {
                  setTimeout(() => {
                    onTabChange(key);
                  }, 10);
                }
              }}
            />
          ))}
        </div>
      </nav>
    </motion.div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`topnav__tab relative pb-2 text-sm font-medium tracking-wide text-gray-600 transition-colors ${
        active ? "text-[#253126]" : "hover:text-[#253126]"
      }`}
    >
      {label}
      {active && (
        <motion.span
          layoutId="topnav-underline"
          className="absolute inset-x-0 bottom-0 h-0.5 bg-[#5c6f54]"
          initial={false}
          transition={{
            layout: {
              type: "spring",
              stiffness: 500,
              damping: 30,
              duration: 0.3,
            },
          }}
        />
      )}
    </button>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const TABS = [
  { key: "home", label: "Home" },
  { key: "gallery", label: "Gallery" },
];

export default function TopNav({ tab, onTabChange }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const threshold = navRef.current?.offsetHeight ?? 0;
      setIsScrolled(window.scrollY > threshold);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={navRef}
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex w-full justify-center">
        <div className="relative flex items-center gap-8 rounded-full px-6 py-3 transition-colors">
          {TABS.map(({ key, label }) => (
            <TabButton
              key={key}
              label={label}
              active={tab === key}
              onClick={() => onTabChange(key)}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative pb-2 text-sm font-medium tracking-wide text-gray-600 transition-colors ${
        active ? "text-[#253126]" : "hover:text-[#253126]"
      }`}
    >
      {label}
      {active && (
        <motion.span
          layoutId="topnav-underline"
          className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-[#5c6f54]"
        />
      )}
    </button>
  );
}

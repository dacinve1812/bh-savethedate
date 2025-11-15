import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";

const TABS = [
  { key: "home", label: "Home" },
  { key: "gallery", label: "Gallery" },
];

export default function TopNav({ tab, onTabChange }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const navRef = useRef(null);
  const lastScrollY = useRef(0);
  const { scrollY } = useScroll();

  useEffect(() => {
    const handleScroll = () => {
      const threshold = navRef.current?.offsetHeight ?? 0;
      setIsScrolled(window.scrollY > threshold);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY.current;
    
    if (latest > previous && latest > 100) {
      // Scrolling down - hide navbar
      setIsVisible(false);
    } else if (latest < previous) {
      // Scrolling up - show navbar
      setIsVisible(true);
    }
    
    lastScrollY.current = latest;
  });

  return (
    <motion.div
      ref={navRef}
      initial={{ y: 0 }}
      animate={{ 
        y: isVisible ? 0 : -100,
        opacity: isVisible ? 1 : 0
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }}
      className={`fixed top-0 left-0 right-0 z-40 ${
        isScrolled ? "bg-white/25 backdrop-blur-sm shadow-sm" : "bg-transparent"
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
    </motion.div>
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

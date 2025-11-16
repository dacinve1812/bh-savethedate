import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";

const TABS = [
  { key: "home", label: "Home" },
  { key: "gallery", label: "Gallery" },
];

export default function TopNav({ tab, onTabChange }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [canShow, setCanShow] = useState(false); // delay initial reveal
  const navRef = useRef(null);
  const lastScrollY = useRef(0);
  const { scrollY } = useScroll();

  useEffect(() => {
    // Delay showing the navbar to allow HeroShowcase animations (~2s) to play
    const t = setTimeout(() => setCanShow(true), 2000);

    const handleScroll = () => {
      const threshold = navRef.current?.offsetHeight ?? 0;
      setIsScrolled(window.scrollY > threshold);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", handleScroll);
    };
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

  const scrollToSchedule = (duration = 800) => {
    const scheduleSection = document.getElementById("schedule");
    if (!scheduleSection) return;

    const startPosition = window.pageYOffset;
    const targetPosition = scheduleSection.offsetTop; // Scroll đến đúng start của section
    const distance = targetPosition - startPosition;
    let startTime = null;

    const easeInOutCubic = (t) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      window.scrollTo(0, startPosition + distance * ease);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };

  const handleTimelineClick = () => {
    // Nếu đang ở tab Gallery, chuyển về Home trước
    if (tab !== "home") {
      onTabChange("home");
      // Đợi component render xong rồi mới scroll
      setTimeout(() => {
        scrollToSchedule(1500); // 800ms duration
      }, 100);
    } else {
      // Nếu đã ở Home, scroll ngay
      scrollToSchedule(1500); // 800ms duration
    }
  };

  const scrollToTop = (duration = 800) => {
    const startPosition = window.pageYOffset;
    const targetPosition = 0;
    const distance = targetPosition - startPosition;
    let startTime = null;

    const easeInOutCubic = (t) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      window.scrollTo(0, startPosition + distance * ease);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };

  const handleHomeClick = () => {
    if (tab !== "home") {
      onTabChange("home");
      setTimeout(() => {
        scrollToTop(800);
      }, 100);
    } else {
      scrollToTop(800);
    }
  };

  return (
    <motion.div
      ref={navRef}
      initial={{ y: -100, opacity: 0 }}
      animate={{ 
        y: canShow ? (isVisible ? 0 : -100) : -100,
        opacity: canShow ? (isVisible ? 1 : 0) : 0
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }}
      className={`fixed top-0 left-0 right-0 z-40 ${
        isScrolled ? "bg-white/35 backdrop-blur-sm shadow-sm" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex w-full justify-center">
        <div className="relative flex items-center gap-8 rounded-full px-6 py-3 transition-colors">
          {TABS.map(({ key, label }) => (
            <TabButton
              key={key}
              label={label}
              active={tab === key}
              onClick={() => (key === "home" ? handleHomeClick() : onTabChange(key))}
            />
          ))}
          <TabButton
            label="Timeline"
            active={false}
            onClick={handleTimelineClick}
          />
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
          className="absolute inset-x-0 top-6 h-0.5 bg-[#5c6f54]"
        />
      )}
    </button>
  );
}

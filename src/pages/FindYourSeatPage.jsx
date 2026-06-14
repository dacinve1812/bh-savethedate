import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { loadSeating, findSeatsForQuery, getGuestRecommendations } from "../utils/seatingData";
import { fetchSeatingRemote, isSeatingSyncConfigured } from "../utils/seatingApi";

const FLOOR_PLAN_SRC = "/Table.png";

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.035, delayChildren: 0.04 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } },
};

import { buildGalleryHash } from "../utils/galleryHash";

const galleryLink = { pathname: "/", hash: buildGalleryHash({ category: "pre-wedding" }) };

function SearchAgainButton({ onClick, className = "" }) {
  return (
    <Motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-medium border border-[#5c6f54]/35 bg-white/90 text-[#1c2321] shadow-sm hover:border-[#5c6f54]/55 hover:bg-white transition-colors ${className}`}
    >
      Search again
    </Motion.button>
  );
}

export default function FindYourSeatPage() {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [matches, setMatches] = useState([]);
  const [seating, setSeating] = useState(() => loadSeating());

  useEffect(() => {
    if (!isSeatingSyncConfigured()) return undefined;

    let cancelled = false;
    const refresh = async () => {
      try {
        const data = await fetchSeatingRemote();
        if (!cancelled) setSeating(data);
      } catch {
        if (!cancelled) setSeating(loadSeating());
      }
    };

    refresh();
    const interval = window.setInterval(refresh, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const recommendations = useMemo(() => getGuestRecommendations(name, seating, 8), [name, seating]);

  useEffect(() => {
    const onUpdate = () => {
      const data = loadSeating();
      setSeating(data);
      if (submitted && name.trim()) {
        setMatches(findSeatsForQuery(name, data));
      }
    };
    window.addEventListener("seating_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("seating_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [submitted, name]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = name.trim();
    if (!q) return;
    setMatches(findSeatsForQuery(q, seating));
    setSubmitted(true);
  };

  const handleNewSearch = () => {
    setSubmitted(false);
    setMatches([]);
    setName("");
  };

  const pickSuggestion = (guestName) => {
    setName(guestName);
  };

  return (
    <div className="min-h-[100dvh] bg-[#f6f7ef] text-[#1c2321] flex flex-col relative overflow-x-hidden">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-10%,rgba(92,111,84,0.12),transparent_55%)]"
        aria-hidden
      />

      <main className="min-h-[100dvh] w-full max-w-lg sm:max-w-xl mx-auto relative z-[1] grid grid-rows-[1fr_auto] px-5 sm:px-8">
        <div className="flex min-h-0 items-center justify-center py-8 sm:py-10">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <Motion.div
                key="search"
                className="w-full flex flex-col items-center text-center"
                {...pageTransition}
              >
                <Motion.div variants={stagger} initial="initial" animate="animate" className="w-full space-y-8">
                  <Motion.div variants={fadeUp}>
                    <h1 className="font-serif text-[clamp(1.75rem,5.5vw,2.75rem)] text-[#1c2321] tracking-tight leading-tight">
                      Please Find Your Seat
                    </h1>
                    <Motion.div
                      className="mt-6 h-px w-24 sm:w-32 mx-auto bg-[#5c6f54]/35 origin-center"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.1, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      aria-hidden
                    />
                  </Motion.div>

                  <Motion.form
                    variants={fadeUp}
                    onSubmit={handleSubmit}
                    className="w-full max-w-md mx-auto space-y-6 flex flex-col items-center justify-center text-center"
                  >
                    <div className="space-y-1 w-full flex flex-col items-center">
                      <label htmlFor="guest-name" className="block text-xs uppercase tracking-[0.2em] text-[#5c6f54]">
                        Your name
                      </label>
                      <div className="relative group w-full max-w-sm">
                        <input
                          id="guest-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          autoComplete="name"
                          placeholder="As on your invitation"
                          className="find-seat-input w-full bg-transparent text-[#1c2321] placeholder:text-gray-400/80 text-lg sm:text-xl py-3 text-center outline-none border-0 shadow-none ring-0 focus:ring-0"
                        />
                        <span
                          className="find-seat-input-line pointer-events-none absolute left-0 right-0 bottom-0 h-px bg-[#5c6f54]/25 group-focus-within:h-0.5 group-focus-within:bg-[#5c6f54] transition-all duration-200"
                          aria-hidden
                        />
                      </div>
                    </div>

                    <div className="min-h-[4.5rem] w-full flex flex-col items-center justify-center">
                      <AnimatePresence mode="popLayout">
                        {recommendations.length > 0 && (
                          <Motion.div
                            key="recs"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden w-full flex justify-center"
                          >
                            <ul className="flex flex-wrap gap-x-4 gap-y-2 justify-center items-center pt-1 max-w-full">
                              {recommendations.map(({ guest, table }, idx) => (
                                <Motion.li
                                  key={`${guest}-${table}`}
                                  initial={{ opacity: 0, scale: 0.94 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: idx * 0.025, duration: 0.16 }}
                                  className="flex items-center justify-center"
                                >
                                  <button
                                    type="button"
                                    onClick={() => pickSuggestion(guest)}
                                    className="text-sm font-medium text-[#1c2321] bg-transparent border-0 shadow-none px-2 py-1 hover:text-[#5c6f54] underline underline-offset-4 decoration-[#5c6f54]/25 hover:decoration-[#5c6f54]/50 transition-colors"
                                  >
                                    {guest}
                                  </button>
                                </Motion.li>
                              ))}
                            </ul>
                          </Motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <Motion.button
                      type="submit"
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3.5 rounded-full bg-[#1c2321] text-white text-xs font-medium uppercase tracking-[0.2em] shadow-lg shadow-[#1c2321]/15 hover:opacity-92 transition-opacity"
                    >
                      Find Table
                    </Motion.button>
                  </Motion.form>
                </Motion.div>
              </Motion.div>
            ) : (
              <Motion.div
                key="result"
                className="w-full max-w-md sm:max-w-lg mx-auto space-y-8 text-center"
                {...pageTransition}
              >
                {matches.length === 0 ? (
                  <Motion.div className="space-y-5" variants={stagger} initial="initial" animate="animate">
                    <Motion.p variants={fadeUp} className="font-serif text-2xl sm:text-3xl text-[#1c2321]">
                      {name.trim()}
                    </Motion.p>
                    <Motion.p variants={fadeUp} className="text-gray-600 text-sm sm:text-base leading-relaxed">
                      We could not find a matching seat for that name. Try different spelling, tap a name hint if you
                      see one, or ask the hosts for help.
                    </Motion.p>
                    <Motion.div variants={fadeUp} className="flex justify-center pt-1">
                      <SearchAgainButton onClick={handleNewSearch} />
                    </Motion.div>
                  </Motion.div>
                ) : matches.length === 1 ? (
                  <SeatResult guest={matches[0].guest} table={matches[0].table} onAgain={handleNewSearch} />
                ) : (
                  <div className="space-y-6">
                    <Motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="text-gray-600 text-sm"
                    >
                      Several matches were found. Please pick yours:
                    </Motion.p>
                    <ul className="space-y-3 text-left max-w-md mx-auto">
                      {matches.map((row, idx) => (
                        <Motion.li
                          key={`${row.table}-${row.guest}-${idx}`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.035, duration: 0.22 }}
                          className="rounded-2xl border border-[#5c6f54]/15 bg-white/80 backdrop-blur-sm px-4 py-3 shadow-sm"
                        >
                          <p className="font-medium text-[#1c2321]">{row.guest}</p>
                          <p className="text-gray-600 text-sm mt-1">
                            You are seated at <strong>Table {row.table}</strong>
                          </p>
                        </Motion.li>
                      ))}
                    </ul>
                    <FloorPlanImage />
                    <div className="flex justify-center">
                      <SearchAgainButton onClick={handleNewSearch} />
                    </div>
                  </div>
                )}
              </Motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 text-center">
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22, delay: 0.08 }}>
            <Link
              to={galleryLink}
              className="inline-flex items-center justify-center text-sm font-medium text-[#1c2321] bg-transparent border-0 shadow-none px-2 py-1 hover:text-[#5c6f54] underline underline-offset-4 decoration-[#5c6f54]/25 hover:decoration-[#5c6f54]/50 transition-colors"
            >
              View Photo of Bao & Hau
            </Link>
          </Motion.div>
        </footer>
      </main>
    </div>
  );
}

function SeatResult({ guest, table, onAgain }) {
  return (
    <Motion.div className="space-y-8" variants={stagger} initial="initial" animate="animate">
      <Motion.div variants={fadeUp}>
        <p className="font-serif text-[clamp(1.75rem,5vw,2.5rem)] text-[#1c2321] leading-tight">{guest}</p>
        <p className="mt-4 text-base sm:text-lg text-gray-700">
          You are seated at <strong>Table {table}</strong>
        </p>
      </Motion.div>
      <Motion.div variants={fadeUp}>
        <FloorPlanImage />
      </Motion.div>
      <Motion.div variants={fadeUp} className="flex justify-center">
        <SearchAgainButton onClick={onAgain} />
      </Motion.div>
    </Motion.div>
  );
}

function FloorPlanImage() {
  return (
    <Motion.figure
      className="w-full"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <img
        src={FLOOR_PLAN_SRC}
        alt="Reception floor plan with numbered tables"
        className="w-full max-h-[min(72vh,520px)] sm:max-h-[min(70vh,560px)] object-contain rounded-2xl mx-auto shadow-[0_12px_40px_-12px_rgba(28,35,33,0.18)]"
      />
      <figcaption className="mt-3 text-xs text-gray-500">Reception layout</figcaption>
    </Motion.figure>
  );
}

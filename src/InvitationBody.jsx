import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, ExternalLink, Mail } from "lucide-react";
import TopNav from "./TopNav";
import HeroShowcase from "./HeroShowcase";
import FeatureIntro from "./FeatureIntro";
import ChanceEncounter from "./ChanceEncounter";
import Schedule from "./Schedule";
import FormalInvitation from "./FormalInvitation";
import Location from "./Location";
import RSVP from "./RSVP";
import RSVPPage from "./RSVPPage";
import Gallery, { GALLERY_IMAGES, getOptimizedImagePaths } from "./Gallery";

// Helper function để lấy fullSize image cho lightbox
const getFullSizeImageSrc = (image) => {
  // Nếu có fullSize được định nghĩa sẵn, dùng nó
  if (image?.fullSize) return image.fullSize;
  
  // Nếu có src, tự động generate paths từ script
  if (image?.src) {
    const paths = getOptimizedImagePaths(image.src);
    return paths.fullSize || image.src; // Fallback về src nếu không tìm thấy
  }
  
  return image?.src || '';
};
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function InvitationBody({
  tab,
  onTabChange,
  lightbox,
  onLightbox,
  saveTheDate,
  couple,
  gallery,
  isInvitationOpen,
}) {
  // Scroll to top when tab changes
  React.useEffect(() => {
    // Scroll to top immediately when switching tabs
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [tab]);

  // Handle keyboard navigation for lightbox
  React.useEffect(() => {
    if (lightbox !== null && lightbox !== undefined) {
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          onLightbox(null);
        } else if (e.key === "ArrowLeft" && lightbox > 0) {
          onLightbox(lightbox - 1);
        } else if (e.key === "ArrowRight" && lightbox < GALLERY_IMAGES.length - 1) {
          onLightbox(lightbox + 1);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [lightbox, onLightbox]);

  // Instagram-style swipe: render 3 images simultaneously for smooth transitions
  const [dragOffset, setDragOffset] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const containerRef = React.useRef(null);
  
  // Preload adjacent images for smooth transitions
  React.useEffect(() => {
    if (lightbox !== null) {
      const preloadImages = [];
      
      // Preload previous image
      if (lightbox > 0) {
        const prevImg = new Image();
        prevImg.src = getFullSizeImageSrc(GALLERY_IMAGES[lightbox - 1]);
        preloadImages.push(prevImg);
      }
      
      // Preload next image
      if (lightbox < GALLERY_IMAGES.length - 1) {
        const nextImg = new Image();
        nextImg.src = getFullSizeImageSrc(GALLERY_IMAGES[lightbox + 1]);
        preloadImages.push(nextImg);
      }
      
      return () => {
        // Cleanup if needed
      };
    }
  }, [lightbox]);

  // Reset drag offset when lightbox changes (after transition)
  React.useEffect(() => {
    if (lightbox !== null && !isDragging) {
      // Reset immediately when not dragging
      setDragOffset(0);
    }
  }, [lightbox, isDragging]);

  // Handle swipe navigation
  const handleSwipeNavigation = React.useCallback((dir) => {
    if (dir === "left" && lightbox < GALLERY_IMAGES.length - 1) {
      onLightbox(lightbox + 1);
    } else if (dir === "right" && lightbox > 0) {
      onLightbox(lightbox - 1);
    }
  }, [lightbox, onLightbox]);

  // Update URL hash when tab changes
  React.useEffect(() => {
    if (tab && tab !== "home") {
      window.location.hash = `#${tab}`;
    } else {
      window.location.hash = "";
    }
  }, [tab]);

  // Read hash on mount
  React.useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && ["gallery", "rsvp"].includes(hash)) {
      onTabChange(hash);
      // Scroll to top when loading from hash
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  return (
    <>
      <TopNav onTabChange={onTabChange} tab={tab} />
      {tab === "home" && isInvitationOpen && (
        <>
          <HeroShowcase key="hero" />
          <FeatureIntro key="feature-intro" />
          <ChanceEncounter key="chance" />
          <Schedule key="schedule" />
          <Location key="location" />
          <RSVP key="rsvp" onRSVPClick={() => onTabChange("rsvp")} />
          <FormalInvitation key="formal-invitation" />
          
        </>
      )}
      <main className="mx-auto">
        <AnimatePresence mode="wait">
          {tab === "home" ? (
            <Home key="home" saveTheDate={saveTheDate} />
          ) : tab === "gallery" ? (
            <Gallery key="gallery" onOpen={(index) => onLightbox(index)} />
          ) : tab === "rsvp" ? (
            <RSVPPage key="rsvp" showHeader={false} />
          ) : null}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {lightbox !== null && lightbox !== undefined && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => onLightbox(null)}
          >
            <motion.div
              className="gallery-lightbox-container relative w-full max-w-[95vw] max-h-[90vh] flex items-center justify-center gap-2 md:gap-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              {/* Previous button - nằm ngoài ảnh khi có không gian */}
              {lightbox > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLightbox(lightbox - 1);
                  }}
                  className="gallery-lightbox-nav-btn gallery-lightbox-nav-btn--prev flex-shrink-0 p-2 text-white hover:text-gray-300 transition-colors z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={32} />
                </button>
              )}

              {/* Image container with Instagram-style swipe */}
              <div
                ref={containerRef}
                className="relative flex items-center justify-center max-h-[90vh] w-full overflow-hidden touch-none"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  className="flex items-center justify-center"
                  drag="x"
                  dragConstraints={{
                    left: lightbox > 0 ? -window.innerWidth : 0,
                    right: lightbox < GALLERY_IMAGES.length - 1 ? window.innerWidth : 0
                  }}
                  dragElastic={0.1}
                  dragMomentum={true}
                  onDrag={(e, info) => {
                    setDragOffset(info.offset.x);
                    setIsDragging(true);
                  }}
                  onDragEnd={(e, info) => {
                    setIsDragging(false);
                    const threshold = 100; // Lower threshold for better responsiveness
                    const velocity = info.velocity.x;
                    
                    // Check if swipe is significant enough
                    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 300) {
                      if (info.offset.x > 0 || velocity > 0) {
                        // Swipe right - go to previous
                        handleSwipeNavigation("right");
                      } else {
                        // Swipe left - go to next
                        handleSwipeNavigation("left");
                      }
                    } else {
                      // Snap back to center
                      setDragOffset(0);
                    }
                  }}
                  animate={{
                    x: dragOffset,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.5
                  }}
                  style={{
                    cursor: isDragging ? "grabbing" : "grab"
                  }}
                >
                  {/* Render 3 images: previous, current, next - positioned side by side */}
                  <div className="flex items-center justify-center" style={{ position: 'relative' }}>
                    {/* Previous image - positioned to the left */}
                    {lightbox > 0 && (
                      <motion.img
                        key={`prev-${lightbox - 1}`}
                        src={getFullSizeImageSrc(GALLERY_IMAGES[lightbox - 1])}
                        alt={GALLERY_IMAGES[lightbox - 1]?.alt || `Gallery image ${lightbox}`}
                        className="max-h-[85vh] max-w-[95vw] w-auto rounded-sm shadow-2xl object-contain select-none pointer-events-none"
                        draggable={false}
                        loading="eager"
                        style={{
                          position: 'absolute',
                          left: '-100%',
                          opacity: isDragging && dragOffset > 0 ? Math.min(1, dragOffset / 200) : 0,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isDragging && dragOffset > 0 ? Math.min(1, dragOffset / 200) : 0 }}
                        transition={{ duration: 0.15 }}
                      />
                    )}
                    
                    {/* Current image - centered */}
                    <motion.img
                      key={`current-${lightbox}`}
                      src={getFullSizeImageSrc(GALLERY_IMAGES[lightbox])}
                      alt={GALLERY_IMAGES[lightbox]?.alt || `Gallery image ${lightbox + 1}`}
                      className="max-h-[85vh] max-w-[95vw] w-auto rounded-sm shadow-2xl object-contain select-none pointer-events-none"
                      draggable={false}
                      loading="eager"
                      style={{
                        opacity: isDragging ? Math.max(0.3, 1 - Math.abs(dragOffset) / 300) : 1,
                      }}
                      initial={{ opacity: 1 }}
                      animate={{ opacity: isDragging ? Math.max(0.3, 1 - Math.abs(dragOffset) / 300) : 1 }}
                      transition={{ duration: 0.15 }}
                    />
                    
                    {/* Next image - positioned to the right */}
                    {lightbox < GALLERY_IMAGES.length - 1 && (
                      <motion.img
                        key={`next-${lightbox + 1}`}
                        src={getFullSizeImageSrc(GALLERY_IMAGES[lightbox + 1])}
                        alt={GALLERY_IMAGES[lightbox + 1]?.alt || `Gallery image ${lightbox + 2}`}
                        className="max-h-[85vh] max-w-[95vw] w-auto rounded-sm shadow-2xl object-contain select-none pointer-events-none"
                        draggable={false}
                        loading="eager"
                        style={{
                          position: 'absolute',
                          left: '100%',
                          opacity: isDragging && dragOffset < 0 ? Math.min(1, Math.abs(dragOffset) / 200) : 0,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isDragging && dragOffset < 0 ? Math.min(1, Math.abs(dragOffset) / 200) : 0 }}
                        transition={{ duration: 0.15 }}
                      />
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Next button - nằm ngoài ảnh khi có không gian */}
              {lightbox < GALLERY_IMAGES.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLightbox(lightbox + 1);
                  }}
                  className="gallery-lightbox-nav-btn gallery-lightbox-nav-btn--next flex-shrink-0 p-2 text-white hover:text-gray-300 transition-colors z-10"
                  aria-label="Next image"
                >
                  <ChevronRight size={32} />
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Home({ saveTheDate }) {
  return (

    // This is content of Save the date
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="grid gap-6 grid-cols-1 section-home"
    >
      {/* <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div
          className="h-64 md:h-80 w-full bg-center bg-cover [background-attachment:fixed]"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1400&q=80')",
          }}
        />
        <div className="absolute inset-0 grid place-items-center p-6">
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl bg-[#f6f7ef]/85 px-6 py-4 text-center shadow-lg backdrop-blur"
          >
            <div className="text-sm uppercase tracking-[0.3em] text-gray-600">Save the Date</div>
            <div className="mt-1 text-3xl font-serif">{saveTheDate.names}</div>
            <div className="text-sm text-gray-600">
              {saveTheDate.date} • {saveTheDate.venue.split(",")[0]}
            </div>
          </motion.div>
        </div>
      </div> */}

      {/* This is content of RSVP */}
      {/* <motion.div
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-xl font-semibold tracking-tight">{saveTheDate.heading}</h2>
        <p className="mt-2 text-3xl font-serif">{saveTheDate.names}</p>
        <div className="mt-4 grid gap-2 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <Calendar size={16} /> {saveTheDate.date} — {saveTheDate.time}
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} /> {saveTheDate.venue}
          </div>
          <div className="pl-6 text-gray-500">{saveTheDate.address}</div>
          <a
            href={saveTheDate.googleMaps}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm text-[#5c6f54] hover:underline"
          >
            <ExternalLink size={14} /> Open in Google Maps
          </a>
        </div>
        <p className="mt-4 text-sm text-gray-600">{saveTheDate.note}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={saveTheDate.rsvpLink}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-[#5c6f54] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95"
          >
            RSVP
          </a>
          <a
            href={`mailto:${saveTheDate.email}`}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <Mail size={16} /> Contact us
          </a>
        </div>
      </motion.div> */}

{/* This is content of Travel & Notes */}
      {/* <motion.div
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        <h3 className="text-lg font-semibold">Travel & Notes</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
          <li>Parking available at the Garden deck (first hour complimentary).</li>
          <li>Ceremony in the Conservatory • Reception in the Ballroom.</li>
          <li>Kids are welcome. Please arrive 15 minutes early to be seated.</li>
        </ul>
        <div className="mt-6 rounded-xl bg-[#e7ece4] p-4 text-sm text-[#253126]">
          Tip: Save our date to your calendar from the RSVP confirmation screen.
        </div>
      </motion.div> */}
    </motion.section>
  );
}




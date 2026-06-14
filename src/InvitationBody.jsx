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
import Gallery, { useGalleryCategoryImages } from "./Gallery";
import MediaViewer from "./components/MediaViewer";
import {
  buildGalleryHash,
  DEFAULT_GALLERY_CATEGORY,
  parseGalleryHash,
} from "./utils/galleryHash";
import { getCategoryImages, getStoredOrder } from "./hooks/useGalleryCategoryImages";

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

  const [galleryCategory, setGalleryCategory] = React.useState(() => {
    const parsed = parseGalleryHash(window.location.hash.slice(1));
    return parsed?.category ?? DEFAULT_GALLERY_CATEGORY;
  });
  const galleryImages = useGalleryCategoryImages(galleryCategory);
  const [scrollToIndex, setScrollToIndex] = React.useState(null);
  const lightboxIndex =
    lightbox == null
      ? null
      : typeof lightbox === "object"
        ? lightbox.index
        : lightbox;
  const lightboxOrigin =
    typeof lightbox === "object" && lightbox?.origin ? lightbox.origin : null;

  const handleGalleryCategoryChange = React.useCallback((categoryId) => {
    setGalleryCategory(categoryId);
    setScrollToIndex(null);
    if (lightboxIndex == null) {
      window.location.hash = `#${buildGalleryHash({ category: categoryId })}`;
    }
  }, [lightboxIndex]);

  // Update URL hash for gallery album + optional lightbox photo
  React.useEffect(() => {
    if (tab === "gallery") {
      if (lightboxIndex !== null && lightboxIndex !== undefined) {
        window.location.hash = `#${buildGalleryHash({
          category: galleryCategory,
          photoIndex: lightboxIndex,
        })}`;
      } else {
        window.location.hash = `#${buildGalleryHash({ category: galleryCategory })}`;
      }
      return;
    }
    if (tab && tab !== "home") {
      window.location.hash = `#${tab}`;
    } else {
      window.location.hash = "";
    }
  }, [tab, lightboxIndex, galleryCategory]);

  // Read hash on mount and on hashchange (deep link + back button)
  React.useEffect(() => {
    const applyHash = () => {
      const raw = window.location.hash.slice(1);
      const parsed = parseGalleryHash(raw);
      if (parsed) {
        onTabChange("gallery");
        setGalleryCategory(parsed.category);
        if (parsed.photoIndex != null) {
          const count = getCategoryImages(parsed.category, getStoredOrder()).length;
          if (parsed.photoIndex < count) {
            onLightbox(parsed.photoIndex);
          } else {
            onLightbox(null);
          }
        } else {
          onLightbox(null);
        }
        return;
      }
      if (raw === "rsvp") {
        onLightbox(null);
        onTabChange("gallery");
        setGalleryCategory(DEFAULT_GALLERY_CATEGORY);
        window.location.hash = `#${buildGalleryHash({ category: DEFAULT_GALLERY_CATEGORY })}`;
        return;
      }
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [onTabChange, onLightbox]);

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
          <RSVP key="album-cta" onGalleryClick={() => onTabChange("gallery")} />
          <FormalInvitation key="formal-invitation" />
          
        </>
      )}
      <main className="mx-auto">
        <AnimatePresence mode="wait">
          {tab === "home" ? (
            <Home key="home" saveTheDate={saveTheDate} />
          ) : tab === "gallery" ? (
            <Gallery
              key="gallery"
              category={galleryCategory}
              onCategoryChange={handleGalleryCategoryChange}
              images={galleryImages}
              scrollToIndex={scrollToIndex}
              onScrollToComplete={() => setScrollToIndex(null)}
              onOpen={(index, meta) => {
                if (meta?.rect != null && meta?.src != null) {
                  onLightbox({ index, origin: { rect: meta.rect, src: meta.src } });
                } else {
                  onLightbox(index);
                }
              }}
            />
          ) : null}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {lightboxIndex !== null && lightboxIndex !== undefined && (
          <MediaViewer
            key="media-viewer"
            initialIndex={lightboxIndex}
            originRect={lightboxOrigin?.rect ?? null}
            originSrc={lightboxOrigin?.src ?? null}
            images={galleryImages}
            categoryId={galleryCategory}
            onClose={() => {
              const idx = lightboxIndex;
              onLightbox(null);
              if (typeof idx === "number" && idx >= 0) setScrollToIndex(idx);
            }}
            onIndexChange={(i) => onLightbox(i)}
          />
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




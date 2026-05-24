import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Camera, ImagePlus, Upload, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import {
  fetchHighlights,
  uploadHighlight,
  getNoteMax,
  isSharedBackendConfigured,
  driveImageThumbUrl,
  driveImageViewerUrl,
} from "../utils/eventHighlightsApi";
import { prepareHighlightFile, storyHintText, STORY_MAX_DURATION_SEC } from "../utils/highlightMediaPrepare";
import HighlightVideoPlayer from "../components/HighlightVideoPlayer";

const ACCEPT = "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime";

const CAPTION_PLACEHOLDERS = [
  "The dance floor was wild 😂",
  "Best night ever 🤍",
  "So happy for you two!",
];

/** Smaller preview for the composer (display only; full file still uploads). */
async function createPreviewUrl(file) {
  if (!file.type.startsWith("image/")) {
    return URL.createObjectURL(file);
  }
  const maxW = 720;
  if (file.size < 400_000) {
    return URL.createObjectURL(file);
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxW / bitmap.width);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return URL.createObjectURL(file);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return URL.createObjectURL(file);
  }
}

export default function EventHighlightsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadOk, setUploadOk] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const galleryRef = useRef(null);
  const noteMax = getNoteMax();

  const captionPlaceholder = useMemo(
    () => CAPTION_PLACEHOLDERS[Math.floor(Math.random() * CAPTION_PLACEHOLDERS.length)],
    []
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const list = await fetchHighlights();
      setItems(list);
    } catch (e) {
      setLoadError(String(e.message || e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (viewerIndex === null) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setViewerIndex(null);
      else if (e.key === "ArrowLeft") setViewerIndex((i) => (i > 0 ? i - 1 : i));
      else if (e.key === "ArrowRight") setViewerIndex((i) => (i < items.length - 1 ? i + 1 : i));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [viewerIndex, items.length]);

  const clearFile = useCallback(() => {
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setUploadError("");
    setUploadOk(false);
    setUploadProgress(null);
  }, []);

  const onPickFile = async (f) => {
    if (!f) return;
    clearFile();
    setUploadError("");
    setUploadOk(false);
    setUploadProgress(null);

    if (f.type.startsWith("video/")) {
      try {
        const url = URL.createObjectURL(f);
        const v = document.createElement("video");
        v.preload = "metadata";
        v.src = url;
        await new Promise((resolve, reject) => {
          v.onloadedmetadata = () => resolve();
          v.onerror = () => reject(new Error("Could not read video"));
        });
        URL.revokeObjectURL(url);
        if (v.duration > STORY_MAX_DURATION_SEC + 0.25) {
          setUploadError(
            `Video is ${Math.ceil(v.duration)}s — max ${STORY_MAX_DURATION_SEC}s (story-style). Trim it first.`
          );
          return;
        }
      } catch {
        /* allow submit-time validation */
      }
    }

    setFile(f);
    const url = await createPreviewUrl(f);
    setPreviewUrl(url);
  };

  const handleFileInput = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (f) onPickFile(f);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError("Choose a photo or video first.");
      return;
    }
    setUploading(true);
    setUploadError("");
    setUploadOk(false);
    setUploadProgress({ percent: 0, label: "Starting…" });
    try {
      const prepared = await prepareHighlightFile(file, (p) =>
        setUploadProgress({ percent: p.percent, label: p.label })
      );
      await uploadHighlight(prepared.file, note, {
        thumbFile: prepared.thumbFile,
        durationSec: prepared.durationSec,
        onProgress: (p) => setUploadProgress({ percent: p.percent, label: p.label }),
      });
      clearFile();
      setNote("");
      setUploadOk(true);
      setUploadProgress({ percent: 100, label: "Complete" });
      await reload();
    } catch (err) {
      setUploadError(String(err.message || err));
      setUploadProgress(null);
    } finally {
      setUploading(false);
    }
  };

  const viewerItem = viewerIndex !== null ? items[viewerIndex] : null;

  return (
    <div className="min-h-[100dvh] bg-[#f6f7ef] text-[#1c2321] pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
        <header className="text-center mb-6 sm:mb-8">
          <Motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32 }}
            className="text-[clamp(1.65rem,5.5vw,2.35rem)] font-light tracking-[-0.02em] leading-[1.15] text-[#1c2321]"
            style={{ fontFamily: '"Lexend", system-ui, sans-serif' }}
          >
            Moments With Bao &amp; Hau
          </Motion.h1>
          <Motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.06 }}
            className="mt-2 text-sm sm:text-base text-[#5c6f54]/90 font-light"
            style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
          >
            Chia sẻ khoảnh khắc cùng Bảo &amp; Hậu
          </Motion.p>
          <Motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.1 }}
            className="mt-3 text-[11px] sm:text-xs text-gray-500/90 max-w-full mx-auto whitespace-nowrap overflow-hidden text-ellipsis px-1"
          >
            Every moment shared here becomes part of our memories. 🤍
          </Motion.p>
          {!isSharedBackendConfigured() && (
            <p className="mt-4 text-xs text-amber-800/90 bg-amber-50/90 border border-amber-200/60 rounded-2xl px-4 py-2.5 max-w-md mx-auto">
              Demo mode — uploads stay on this device only.
            </p>
          )}
        </header>

        <input ref={fileInputRef} type="file" accept={ACCEPT} className="sr-only" onChange={handleFileInput} />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={handleFileInput}
        />

        <section className="rounded-3xl bg-white/80 backdrop-blur-sm p-5 sm:p-6 shadow-[0_12px_40px_-16px_rgba(28,35,33,0.15)]">
          <h2 className="text-sm font-medium text-[#5c6f54] tracking-wide mb-1">Your moment</h2>
          <p className="text-[11px] text-gray-500 mb-4">{storyHintText()}</p>

          {!file ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#1c2321] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <ImagePlus size={18} />
                Choose photo or video
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-[#5c6f54]/30 bg-white text-[#1c2321] text-sm font-medium hover:bg-[#5c6f54]/5 transition-colors"
              >
                <Camera size={18} />
                Open camera
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-[#f6f7ef] shadow-inner">
                {file.type.startsWith("video/") ? (
                  <video
                    src={previewUrl}
                    controls
                    playsInline
                    className="w-full max-h-[min(52vh,360px)] object-contain mx-auto"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full max-h-[min(52vh,360px)] object-contain mx-auto"
                  />
                )}
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/45 text-white hover:bg-black/60 transition-colors"
                  aria-label="Remove file"
                >
                  <X size={16} />
                </button>
              </div>

              <div>
                <label htmlFor="eh-note" className="block text-sm text-[#1c2321] mb-2">
                  Leave a sweet message ✨{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="eh-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, noteMax))}
                  rows={2}
                  maxLength={noteMax}
                  placeholder={captionPlaceholder}
                  className="w-full rounded-2xl border-0 bg-[#f6f7ef]/80 px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5c6f54]/25 resize-none"
                />
                <p className="text-[11px] text-gray-400 mt-1 text-right">
                  {note.length}/{noteMax}
                </p>
              </div>

              {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
              {uploadOk && <p className="text-sm text-[#5c6f54]">Thanks! Your moment was added. 🤍</p>}

              {(uploading || uploadProgress) && (
                <p
                  className="flex justify-between text-[11px] text-gray-500 tabular-nums"
                  aria-live="polite"
                  aria-valuenow={uploadProgress?.percent ?? 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  role="progressbar"
                >
                  <span>{uploadProgress?.label || "Working…"}</span>
                  <span className="font-medium text-[#5c6f54]">{uploadProgress?.percent ?? 0}%</span>
                </p>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium bg-[#5c6f54] text-white shadow-[0_6px_20px_-6px_rgba(92,111,84,0.5)] hover:opacity-92 disabled:opacity-50 transition-opacity"
              >
                <Upload size={18} />
                {uploading ? "Please wait…" : "Share this moment"}
              </button>
            </form>
          )}
        </section>

        <section ref={galleryRef} className="mt-12 sm:mt-14">
          <h2 className="font-serif text-xl sm:text-2xl text-center text-[#1c2321] mb-6 sm:mb-8">
            Our gallery
          </h2>

          {loading && <p className="text-center text-gray-400 text-sm py-16">Loading moments…</p>}
          {loadError && !loading && <p className="text-center text-red-600 text-sm py-12">{loadError}</p>}
          {!loading && !loadError && items.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-16 leading-relaxed">
              No moments yet.
              <br />
              Be the first to share. 🤍
            </p>
          )}

          <div className="columns-2 gap-3 sm:gap-4">
            {items.map((item, idx) => (
              <GalleryCard
                key={item.fileId}
                item={item}
                index={idx}
                onOpen={() => setViewerIndex(idx)}
              />
            ))}
          </div>
        </section>

        <p className="text-center mt-14 flex flex-col items-center gap-2">
          <Link
            to="/"
            className="text-sm text-[#5c6f54] underline underline-offset-4 decoration-[#5c6f54]/30 hover:text-[#1c2321] hover:decoration-[#5c6f54]/60 transition-colors"
          >
            ← Home
          </Link>
          <Link
            to="/admin/event-highlights"
            className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            Admin
          </Link>
        </p>
      </div>

      <div className="fixed right-4 bottom-6 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="w-11 h-11 rounded-full bg-white/95 text-[#1c2321] shadow-[0_4px_20px_-4px_rgba(28,35,33,0.35)] border border-[#5c6f54]/15 flex items-center justify-center hover:bg-white active:scale-95 transition-transform"
          aria-label="Scroll to top"
        >
          <ChevronUp size={22} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() =>
            galleryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          className="w-11 h-11 rounded-full bg-white/95 text-[#1c2321] shadow-[0_4px_20px_-4px_rgba(28,35,33,0.35)] border border-[#5c6f54]/15 flex items-center justify-center hover:bg-white active:scale-95 transition-transform"
          aria-label="Scroll to gallery"
        >
          <ChevronDown size={22} strokeWidth={2} />
        </button>
      </div>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {viewerItem && (
              <HighlightViewer
                key={viewerItem.fileId}
                item={viewerItem}
                index={viewerIndex}
                total={items.length}
                onClose={() => setViewerIndex(null)}
                onPrev={() => setViewerIndex((i) => Math.max(0, i - 1))}
                onNext={() => setViewerIndex((i) => Math.min(items.length - 1, i + 1))}
              />
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}

function formatWhen(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function GalleryCard({ item, index, onOpen }) {
  const isVideo = (item.mimeType || "").startsWith("video/");
  const when = formatWhen(item.createdAt);
  const hasNote = Boolean(item.note && item.note.trim());

  return (
    <Motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-24px" }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.24) }}
      className="group relative mb-3 sm:mb-4 break-inside-avoid rounded-3xl overflow-hidden shadow-[0_8px_28px_-10px_rgba(28,35,33,0.14)] bg-white/40"
    >
      <button
        type="button"
        onClick={onOpen}
        className="relative block w-full text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5c6f54]/40 focus-visible:ring-offset-2"
        aria-label={hasNote ? `View: ${item.note}` : "View moment"}
      >
        <HighlightMedia item={item} isVideo={isVideo} variant="thumb" />

        <div
          className={`absolute inset-x-0 bottom-0 pt-14 pb-2.5 px-2.5 sm:px-3 bg-gradient-to-t from-black/75 via-black/35 to-transparent pointer-events-none transition-opacity duration-300 ${
            hasNote ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-active:opacity-100 [@media(hover:none)]:opacity-80"
          }`}
        >
          {hasNote && (
            <p className="text-white text-xs leading-snug font-medium drop-shadow-sm line-clamp-2">{item.note}</p>
          )}
          {when && (
            <time
              className={`block text-white/70 text-[10px] ${hasNote ? "mt-0.5" : ""}`}
              dateTime={item.createdAt}
            >
              {when}
            </time>
          )}
        </div>

        {isVideo && (
          <div className="pointer-events-none absolute top-2 right-2 w-7 h-7 rounded-full bg-black/45 flex items-center justify-center text-white text-[10px]">
            ▶
          </div>
        )}
      </button>
    </Motion.article>
  );
}

function HighlightViewer({ item, index, total, onClose, onPrev, onNext }) {
  const isVideo = (item.mimeType || "").startsWith("video/");
  const when = formatWhen(item.createdAt);
  const hasNote = Boolean(item.note && item.note.trim());

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex flex-col bg-black/92 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 shrink-0">
        <span className="text-white/60 text-xs tabular-nums">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full text-white/90 hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X size={22} />
        </button>
      </div>

      <div
        className="flex-1 min-h-0 flex items-center justify-center px-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {index > 0 && (
          <button
            type="button"
            onClick={onPrev}
            className="absolute left-2 sm:left-4 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft size={28} />
          </button>
        )}
        {index < total - 1 && (
          <button
            type="button"
            onClick={onNext}
            className="absolute right-2 sm:right-4 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            aria-label="Next"
          >
            <ChevronRight size={28} />
          </button>
        )}

        <div className="w-full max-w-3xl max-h-[min(72vh,680px)] flex items-center justify-center min-h-[120px]">
          <HighlightMedia item={item} isVideo={isVideo} variant="full" />
        </div>
      </div>

      {(hasNote || when) && (
        <div
          className="shrink-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {hasNote && <p className="text-white text-sm sm:text-base font-medium leading-snug">{item.note}</p>}
          {when && (
            <time className={`block text-white/55 text-xs ${hasNote ? "mt-1.5" : ""}`} dateTime={item.createdAt}>
              {when}
            </time>
          )}
        </div>
      )}
    </Motion.div>
  );
}

function DriveHighlightImage({ fileId, variant = "thumb" }) {
  const thumbSrc = driveImageThumbUrl(fileId);
  const fullSrc = driveImageViewerUrl(fileId);
  const isFull = variant === "full";

  const [src, setSrc] = useState(thumbSrc);
  const [hdReady, setHdReady] = useState(!isFull);

  useEffect(() => {
    setSrc(thumbSrc);
    setHdReady(!isFull);
    if (!isFull) return undefined;

    const img = new Image();
    img.onload = () => {
      setSrc(fullSrc);
      setHdReady(true);
    };
    img.onerror = () => setHdReady(true);
    img.src = fullSrc;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [fileId, isFull, thumbSrc, fullSrc]);

  const imgClass =
    variant === "full"
      ? "w-full max-h-[min(72vh,680px)] object-contain transition-opacity duration-300"
      : "w-full h-auto block bg-[#ebece4]";

  return (
    <img
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      className={`${imgClass} ${isFull && !hdReady ? "opacity-85" : "opacity-100"}`}
      loading={isFull ? "eager" : "lazy"}
      decoding="async"
      onError={(e) => {
        if (e.currentTarget.src !== thumbSrc) {
          e.currentTarget.src = thumbSrc;
        }
      }}
    />
  );
}

function HighlightMedia({ item, isVideo, variant = "thumb" }) {
  const isLocal = item.fileId && String(item.fileId).startsWith("local-");
  const isFull = variant === "full";

  if (isLocal && item._dataUrl) {
    if (isVideo) {
      return (
        <video
          src={item._dataUrl}
          controls={isFull}
          playsInline
          className={isFull ? "w-full max-h-[min(72vh,680px)] object-contain" : "w-full h-auto block"}
        />
      );
    }
    return (
      <img
        src={item._dataUrl}
        alt=""
        className={isFull ? "w-full max-h-[min(72vh,680px)] object-contain" : "w-full h-auto block"}
        loading="lazy"
      />
    );
  }

  if (!item.fileId) return null;

  if (isVideo) {
    return <HighlightVideoPlayer item={item} variant={variant} />;
  }

  return <DriveHighlightImage fileId={item.fileId} variant={variant} />;
}

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Camera, ImagePlus, Upload, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  fetchHighlights,
  uploadHighlight,
  getNoteMax,
  isSharedBackendConfigured,
  peekHighlightsCache,
  driveImageThumbUrl,
  highlightVideoPosterUrl,
} from "../utils/eventHighlightsApi";
import { getDriveThumbnailFallbacks, getGridThumbWidth, getViewerThumbMax } from "../utils/galleryImageUtils";
import { useMasonryRowSpan } from "../utils/masonryLayout";
import { prepareHighlightFile, STORY_MAX_DURATION_SEC } from "../utils/highlightMediaPrepare";
import HighlightVideoPlayer from "./HighlightVideoPlayer";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../translations";

const ACCEPT = "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime";

const CAPTION_PLACEHOLDERS = [
  "The dance floor was wild 😂",
  "Best night ever 🤍",
  "So happy for you two!",
];

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

export default function GuestMomentsPanel({ onItemsCountChange }) {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const [items, setItems] = useState(() => peekHighlightsCache() || []);
  const [loading, setLoading] = useState(() => !(peekHighlightsCache()?.length));
  const [refreshing, setRefreshing] = useState(false);
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
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const noteMax = getNoteMax();

  const captionPlaceholder = useMemo(
    () => CAPTION_PLACEHOLDERS[Math.floor(Math.random() * CAPTION_PLACEHOLDERS.length)],
    []
  );

  const reload = useCallback(async () => {
    const hasCached = itemsRef.current.length > 0;
    if (!hasCached) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setLoadError("");
    try {
      const list = await fetchHighlights();
      setItems((prev) => (highlightsUnchanged(prev, list) ? prev : list));
      onItemsCountChange?.(list.length);
    } catch (e) {
      if (!hasCached) {
        setLoadError(String(e.message || e));
        setItems([]);
        onItemsCountChange?.(0);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onItemsCountChange]);

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
            `Video is ${Math.ceil(v.duration)}s — max ${STORY_MAX_DURATION_SEC}s. Trim it first.`
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
    <div className="gallery__guest-moments">
      <p className="gallery__guest-moments-intro">
        Chia sẻ khoảnh khắc cùng Bảo &amp; Hậu — every moment shared here becomes part of our memories. 🤍
      </p>
      {!isSharedBackendConfigured() && (
        <p className="gallery__guest-moments-demo">
          Demo mode — uploads stay on this device only.
        </p>
      )}

      <input ref={fileInputRef} type="file" accept={ACCEPT} className="sr-only" onChange={handleFileInput} />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleFileInput}
      />

      <section className="gallery__guest-moments-upload">
        <h2 className="gallery__guest-moments-upload-title">{t.guestMomentsUploadTitle}</h2>
        <p className="gallery__guest-moments-upload-hint">{t.guestMomentsUploadHint}</p>

        {!file ? (
          <div className="gallery__guest-moments-actions">
            <button type="button" className="gallery__guest-moments-btn gallery__guest-moments-btn--primary" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus size={18} />
              Choose photo or video
            </button>
            <button type="button" className="gallery__guest-moments-btn gallery__guest-moments-btn--secondary" onClick={() => cameraInputRef.current?.click()}>
              <Camera size={18} />
              Open camera
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="gallery__guest-moments-form">
            <div className="gallery__guest-moments-preview">
              {file.type.startsWith("video/") ? (
                <video src={previewUrl} controls playsInline className="gallery__guest-moments-preview-media" />
              ) : (
                <img src={previewUrl} alt="Preview" className="gallery__guest-moments-preview-media" />
              )}
              <button type="button" onClick={clearFile} className="gallery__guest-moments-preview-remove" aria-label="Remove file">
                <X size={16} />
              </button>
            </div>

            <div>
              <label htmlFor="guest-moments-note" className="gallery__guest-moments-label">
                Leave a sweet message ✨ <span className="gallery__guest-moments-label-optional">(optional)</span>
              </label>
              <textarea
                id="guest-moments-note"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, noteMax))}
                rows={2}
                maxLength={noteMax}
                placeholder={captionPlaceholder}
                className="gallery__guest-moments-textarea"
              />
              <p className="gallery__guest-moments-charcount">
                {note.length}/{noteMax}
              </p>
            </div>

            {uploadError && <p className="gallery__guest-moments-error">{uploadError}</p>}
            {uploadOk && <p className="gallery__guest-moments-success">Thanks! Your moment was added. 🤍</p>}

            {(uploading || uploadProgress) && (
              <p className="gallery__guest-moments-progress" aria-live="polite" role="progressbar">
                <span>{uploadProgress?.label || "Working…"}</span>
                <span>{uploadProgress?.percent ?? 0}%</span>
              </p>
            )}

            <button type="submit" disabled={uploading} className="gallery__guest-moments-submit">
              <Upload size={18} />
              {uploading ? "Please wait…" : "Share this moment"}
            </button>
          </form>
        )}
      </section>

      {loading && items.length === 0 && (
        <p className="gallery__guest-moments-status">Loading moments…</p>
      )}
      {refreshing && items.length > 0 && (
        <p className="gallery__guest-moments-status gallery__guest-moments-status--refresh" aria-live="polite">
          Updating…
        </p>
      )}
      {loadError && !loading && (
        <p className="gallery__guest-moments-status gallery__guest-moments-status--error">{loadError}</p>
      )}
      {!loading && !loadError && items.length === 0 && (
        <p className="gallery__guest-moments-status">
          No moments yet.
          <br />
          Be the first to share. 🤍
        </p>
      )}

      {!loading && !loadError && items.length > 0 && (
        <div className="gallery__container">
          <div className="gallery__masonry">
            {items.map((item, idx) => (
              <GuestMomentMasonryItem
                key={item.fileId}
                item={item}
                index={idx}
                priority={idx < 6}
                onOpen={() => setViewerIndex(idx)}
              />
            ))}
          </div>
        </div>
      )}

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

function highlightsUnchanged(prev, next) {
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    const a = prev[i];
    const b = next[i];
    if (getGuestMomentThumbKey(a) !== getGuestMomentThumbKey(b)) return false;
    if (a.note !== b.note || a.createdAt !== b.createdAt) return false;
  }
  return true;
}

function getGuestMomentThumbKey(item) {
  return [
    item.fileId,
    item.thumbFileId || "",
    item._thumbDataUrl ? "t" : "",
    item._dataUrl ? "d" : "",
    item.mimeType || "",
  ].join("|");
}

function getGuestMomentThumbSrc(item) {
  if (item._thumbDataUrl) return item._thumbDataUrl;
  if (item._dataUrl && !(item.mimeType || "").startsWith("video/")) return item._dataUrl;
  const poster = highlightVideoPosterUrl(item, getGridThumbWidth());
  if (poster) return poster;
  if (item.fileId && !String(item.fileId).startsWith("local-")) {
    return driveImageThumbUrl(item.fileId, getGridThumbWidth());
  }
  return "";
}

function GuestMomentMasonryItem({ item, index, priority = false, onOpen }) {
  const isVideo = (item.mimeType || "").startsWith("video/");
  const thumbKey = getGuestMomentThumbKey(item);
  const when = formatWhen(item.createdAt);
  const hasNote = Boolean(item.note && item.note.trim());
  const contentRef = useRef(null);
  const imgRef = useRef(null);
  const thumbKeyRef = useRef(thumbKey);
  const { rowSpan, onImageMetrics, recalcSpan } = useMasonryRowSpan(contentRef, isVideo ? 9 / 16 : undefined);
  const [isLoaded, setIsLoaded] = useState(false);
  const [thumbSrc, setThumbSrc] = useState(() => getGuestMomentThumbSrc(item));
  const thumbFallbacksRef = useRef(
    item.fileId && !String(item.fileId).startsWith("local-")
      ? getDriveThumbnailFallbacks(item.thumbFileId || item.fileId, getGridThumbWidth())
      : []
  );

  useEffect(() => {
    const keyChanged = thumbKeyRef.current !== thumbKey;
    thumbKeyRef.current = thumbKey;
    const nextSrc = getGuestMomentThumbSrc(item);

    if (keyChanged) {
      setThumbSrc(nextSrc);
      setIsLoaded(false);
      thumbFallbacksRef.current =
        item.fileId && !String(item.fileId).startsWith("local-")
          ? getDriveThumbnailFallbacks(item.thumbFileId || item.fileId, getGridThumbWidth())
          : [];
      if (contentRef.current) {
        contentRef.current.style.aspectRatio = isVideo ? "9 / 16" : "";
      }
    }

    if (isVideo) {
      requestAnimationFrame(() => recalcSpan());
    }
  }, [thumbKey, item, isVideo, recalcSpan]);

  const markLoaded = useCallback(
    (w, h) => {
      onImageMetrics(w, h, () => setIsLoaded(true));
    },
    [onImageMetrics]
  );

  const setImgRef = useCallback(
    (el) => {
      imgRef.current = el;
      if (
        el &&
        el.complete &&
        el.naturalHeight !== 0 &&
        el.naturalWidth > 0 &&
        !isLoaded
      ) {
        markLoaded(el.naturalWidth, el.naturalHeight);
      }
    },
    [isLoaded, markLoaded]
  );

  const handleLoad = (e) => {
    const img = e.target;
    markLoaded(img.naturalWidth, img.naturalHeight);
  };

  const handleError = (e) => {
    const img = e.target;
    const next = thumbFallbacksRef.current.shift();
    if (next && img.src !== next) {
      img.src = next;
      return;
    }
    setIsLoaded(true);
  };

  return (
    <Motion.div
      className="gallery__item"
      style={{ gridRowEnd: `span ${rowSpan}` }}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.02, margin: "80px 0px" }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div
        ref={contentRef}
        className={`gallery__image-wrapper gallery__image-wrapper--guest-moment${
          isVideo ? " gallery__image-wrapper--guest-moment-video" : ""
        } group`}
        onClick={() => onOpen()}
      >
        {!isLoaded && !isVideo && thumbSrc && (
          <div className="gallery__image-loading" aria-hidden="true">
            <span className="gallery__image-spinner" />
          </div>
        )}
        {isVideo ? (
          <HighlightVideoPlayer
            item={item}
            variant="thumb"
            priority={priority}
            onMediaLoad={markLoaded}
          />
        ) : thumbSrc ? (
          <img
            ref={setImgRef}
            src={thumbSrc}
            alt={item.note?.trim() || `Guest moment ${index + 1}`}
            className={`gallery__image ${isLoaded ? "gallery__image--loaded" : "gallery__image--loading"}`}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={handleLoad}
            onError={handleError}
          />
        ) : (
          <div className="gallery__image-loading" aria-hidden="true">
            <span className="gallery__image-spinner" />
          </div>
        )}

        {(hasNote || when) && (
          <div
            className={`gallery__guest-moment-caption ${
              hasNote ? "gallery__guest-moment-caption--has-note" : ""
            }`}
          >
            {hasNote && <p className="gallery__guest-moment-note">{item.note}</p>}
            {when && (
              <time className="gallery__guest-moment-time" dateTime={item.createdAt}>
                {when}
              </time>
            )}
          </div>
        )}
      </div>
    </Motion.div>
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
        <button type="button" onClick={onClose} className="p-2 rounded-full text-white/90 hover:bg-white/10 transition-colors" aria-label="Close">
          <X size={22} />
        </button>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center px-4 relative" onClick={(e) => e.stopPropagation()}>
        {index > 0 && (
          <button type="button" onClick={onPrev} className="absolute left-2 sm:left-4 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors" aria-label="Previous">
            <ChevronLeft size={28} />
          </button>
        )}
        {index < total - 1 && (
          <button type="button" onClick={onNext} className="absolute right-2 sm:right-4 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors" aria-label="Next">
            <ChevronRight size={28} />
          </button>
        )}
        <div className="guest-moment-viewer__media" onClick={(e) => e.stopPropagation()}>
          <HighlightMedia item={item} isVideo={isVideo} variant="full" />
        </div>
      </div>

      {(hasNote || when) && (
        <div className="shrink-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 text-center" onClick={(e) => e.stopPropagation()}>
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
  const viewerWidth = getViewerThumbMax();
  const thumbSrc = driveImageThumbUrl(fileId, getGridThumbWidth());
  const fullSrc = driveImageThumbUrl(fileId, viewerWidth);
  const isFull = variant === "full";
  const [src, setSrc] = useState(isFull ? thumbSrc : thumbSrc);
  const [hdReady, setHdReady] = useState(!isFull);

  useEffect(() => {
    setSrc(thumbSrc);
    setHdReady(!isFull);
    if (!isFull) return undefined;
    const img = new Image();
    img.referrerPolicy = "no-referrer";
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

  return (
    <img
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      className={
        isFull
          ? `guest-moment-viewer__image${hdReady ? " guest-moment-viewer__image--hd" : ""}`
          : "w-full h-auto block bg-[#ebece4]"
      }
      loading={isFull ? "eager" : "lazy"}
      decoding="async"
      onError={(e) => {
        const fallbacks = getDriveThumbnailFallbacks(fileId, viewerWidth);
        const next = fallbacks.find((url) => url && e.currentTarget.src !== url);
        if (next) {
          e.currentTarget.src = next;
          return;
        }
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
        <HighlightVideoPlayer item={item} variant={variant} />
      );
    }
    return (
      <img
        src={item._dataUrl}
        alt=""
        className={isFull ? "guest-moment-viewer__image guest-moment-viewer__image--hd" : "w-full h-auto block"}
        loading="lazy"
      />
    );
  }

  if (!item.fileId) return null;
  if (isVideo) return <HighlightVideoPlayer item={item} variant={variant} />;
  return <DriveHighlightImage fileId={item.fileId} variant={variant} />;
}

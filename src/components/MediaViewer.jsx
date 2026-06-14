import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Download, Heart } from "lucide-react";
import { getFullSizeSrc, getImageKey, getDriveImageEmbedProps, getViewerSrcCandidates, getGalleryImageAlt } from "../utils/galleryImageUtils";
import { isImageLiked, toggleGalleryLike } from "../utils/galleryLikes";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DISMISS_THRESHOLD = 120;
const SWIPE_CAROUSEL_THRESHOLD = 60;
const PLACEHOLDER_SRC =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
/** Thời gian (ms) của animation intro: thumbnail → fullscreen (ghost). */
const INTRO_DURATION_MS = 0;

function computeFullscreenRect(naturalW, naturalH) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxW = vw * 0.92;
  const maxH = vh * 0.9;
  const scale = Math.min(maxW / naturalW, maxH / naturalH, 1);
  const w = naturalW * scale;
  const h = naturalH * scale;
  return {
    left: (vw - w) / 2,
    top: (vh - h) / 2,
    width: w,
    height: h,
  };
}

/** Rect fullscreen mặc định theo viewport (không cần load ảnh) → intro chạy ngay. */
function getDefaultFullscreenRect() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxW = vw * 0.92;
  const maxH = vh * 0.9;
  const w = maxW;
  const h = maxH;
  return {
    left: (vw - w) / 2,
    top: (vh - h) / 2,
    width: w,
    height: h,
  };
}

function ViewerSlideImage({ image, slideIndex, shouldLoad, isLoaded, onLoaded, viewportWidth }) {
  const candidates = React.useMemo(
    () => getViewerSrcCandidates(image, viewportWidth),
    [image, viewportWidth]
  );
  const [candidateIndex, setCandidateIndex] = React.useState(0);
  const embedProps = getDriveImageEmbedProps(image);

  React.useEffect(() => {
    setCandidateIndex(0);
  }, [image, slideIndex]);

  const src = shouldLoad ? candidates[candidateIndex] || "" : PLACEHOLDER_SRC;

  const handleLoad = (e) => {
    if (e.currentTarget.naturalWidth > 0) onLoaded(slideIndex);
  };

  const handleError = () => {
    setCandidateIndex((idx) => (idx + 1 < candidates.length ? idx + 1 : idx));
  };

  return (
    <>
      {!isLoaded && (
        <div className="media-viewer-placeholder">
          <div className="media-viewer-placeholder__shimmer" />
        </div>
      )}
      <img
        key={`${slideIndex}-${candidateIndex}`}
        src={src || PLACEHOLDER_SRC}
        alt={getGalleryImageAlt(image, slideIndex)}
        className="media-viewer-full"
        draggable={false}
        loading="lazy"
        referrerPolicy={embedProps.referrerPolicy}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          opacity: isLoaded ? 1 : 0,
          position: isLoaded ? "relative" : "absolute",
          inset: 0,
        }}
      />
    </>
  );
}

export default function MediaViewer({
  initialIndex = 0,
  images = [],
  originRect = null,
  originSrc = null,
  onClose,
  onIndexChange,
  categoryId = "pre-wedding",
}) {
  const hasOrigin = originRect && typeof originRect.left === "number" && originSrc;
  const [introPhase, setIntroPhase] = useState(hasOrigin ? "running" : "done");
  // Dùng rect mặc định ngay (theo viewport) để ghost animate ngay, không chờ ảnh full load
  const [fullscreenRect, setFullscreenRect] = useState(() =>
    originRect && typeof originRect.left === "number" && originSrc
      ? getDefaultFullscreenRect()
      : null
  );

  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [fullResLoaded, setFullResLoaded] = useState({});
  const [dismissOffset, setDismissOffset] = useState(0);
  const [carouselOffset, setCarouselOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [likesVersion, setLikesVersion] = useState(0);

  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null);
  const lastPinchDistRef = useRef(null);
  const lastPinchScaleRef = useRef(1);
  const lastPinchPanRef = useRef({ x: 0, y: 0 });
  const gestureModeRef = useRef(null); // 'pinch' | 'pan' | 'carousel' | 'dismiss'
  const touchStartRef = useRef({ x: 0, y: 0, scale: 1, pan: { x: 0, y: 0 } });
  const latestDismissRef = useRef(0);
  const latestCarouselRef = useRef(0);
  const onTouchMoveRef = useRef(() => {});
  const lastTapRef = useRef({ time: 0, x: 0, y: 0 });
  const DOUBLE_TAP_MS = 350;
  const DOUBLE_TAP_PX = 40;
  const TAP_MOVE_PX = 18;
  const DOUBLE_TAP_ZOOM = 2;

  useEffect(() => {
    const onLikes = () => setLikesVersion((v) => v + 1);
    window.addEventListener("gallery_likes_updated", onLikes);
    return () => window.removeEventListener("gallery_likes_updated", onLikes);
  }, []);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Intro: fallback – go to done if stuck
  useEffect(() => {
    if (introPhase !== "running") return;
    const t = setTimeout(() => setIntroPhase("done"), INTRO_DURATION_MS + 800);
    return () => clearTimeout(t);
  }, [introPhase]);

  // Measure container width so one slide = exactly one screen (no slivers of adjacent images)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const syncWidth = () => setContainerWidth(el.clientWidth);
    syncWidth();
    const ro = new ResizeObserver(syncWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleTouchMove = (e) => {
      onTouchMoveRef.current(e);
      if (e.cancelable) e.preventDefault();
    };
    const handleTouchStart = (e) => {
      if (e.touches.length === 1 && e.cancelable) e.preventDefault();
    };
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    return () => {
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchstart", handleTouchStart);
    };
  }, []);

  const total = images.length;
  const currentImage = images[index];
  const canZoom = fullResLoaded[index] === true;
  const currentImageKey = currentImage ? getImageKey(currentImage, categoryId) : null;
  void likesVersion;
  const liked = currentImageKey ? isImageLiked(currentImageKey) : false;

  const handleToggleLike = useCallback(() => {
    if (!currentImageKey) return;
    toggleGalleryLike(currentImageKey);
    setLikesVersion((v) => v + 1);
  }, [currentImageKey]);

  const markSlideLoaded = useCallback((slideIndex) => {
    setFullResLoaded((prev) => (prev[slideIndex] ? prev : { ...prev, [slideIndex]: true }));
  }, []);

  // Notify parent when index changes (for URL sync)
  useEffect(() => {
    if (onIndexChange) onIndexChange(index);
  }, [index, onIndexChange]);

  // Fix 2: Sync index when initialIndex changes from outside (deep link / back button)
  useEffect(() => {
    setIndex(initialIndex);
    setScale(1);
    setPan({ x: 0, y: 0 });
    setCarouselOffset(0);
    setDismissOffset(0);
  }, [initialIndex]);

  const goPrev = useCallback(() => {
    if (index <= 0) return;
    setIndex((i) => i - 1);
    setScale(1);
    setPan({ x: 0, y: 0 });
    setCarouselOffset(0);
  }, [index]);

  const goNext = useCallback(() => {
    if (index >= total - 1) return;
    setIndex((i) => i + 1);
    setScale(1);
    setPan({ x: 0, y: 0 });
    setCarouselOffset(0);
  }, [index, total]);

  const close = useCallback(() => {
    onClose?.();
  }, [onClose]);

  /** Luôn dùng ảnh trong /images/full/ — không dùng getOriginalSrc (/DSC….JPG ở root): hosting SPA hay trả index.html → tải nhầm file .html (đặc biệt iOS). */
  const downloadUrl = currentImage ? getFullSizeSrc(currentImage) : null;
  const downloadFilename =
    downloadUrl?.split("/").filter(Boolean).pop()?.split("?")[0] ||
    `image-${index + 1}.jpg`;

  const downloadImage = useCallback(async () => {
    if (!downloadUrl) return;
    const filename =
      /\.(jpe?g|png|webp)$/i.test(downloadFilename) ?
        downloadFilename
      : `${downloadFilename.replace(/\.[^/.]+$/, "") || `image-${index + 1}`}.jpg`;

    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const ct = res.headers.get("content-type") || blob.type || "";
      if (ct.includes("text/html")) {
        throw new Error("Server returned HTML instead of image");
      }
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    }
  }, [downloadUrl, downloadFilename, index]);

  // Keyboard
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, goPrev, goNext]);

  const getTouchDistance = (touches) => {
    if (touches.length < 2) return 0;
    return Math.hypot(
      touches[1].clientX - touches[0].clientX,
      touches[1].clientY - touches[0].clientY
    );
  };

  const onTouchStart = useCallback(
    (e) => {
      if (!containerRef.current) return;
      const touches = Array.from(e.touches);
      const ts = touchStartRef.current;
      ts.scale = scale;
      ts.pan = { ...pan };
      ts.x = touches[0]?.clientX ?? 0;
      ts.y = touches[0]?.clientY ?? 0;

      if (touches.length >= 2) {
        gestureModeRef.current = "pinch";
        lastPinchDistRef.current = getTouchDistance(touches);
        lastPinchScaleRef.current = scale;
        lastPinchPanRef.current = { ...pan };
      } else {
        gestureModeRef.current = null;
        lastPinchDistRef.current = null;
      }
      setIsDragging(true);
    },
    [scale, pan]
  );

  const onTouchMove = useCallback(
    (e) => {
      const touches = Array.from(e.touches);

      if (gestureModeRef.current === "pinch" && touches.length >= 2) {
        const dist = getTouchDistance(touches);
        const prevDist = lastPinchDistRef.current;
        if (prevDist > 0) {
          const delta = dist / prevDist;
          const prevScale = lastPinchScaleRef.current;
          const maxScale = canZoom ? MAX_SCALE : 1;
          const next = Math.min(
            maxScale,
            Math.max(MIN_SCALE, prevScale * delta)
          );
          // Pinch center (viewport) and slide center so zoom stays under fingers
          const cx = (touches[0].clientX + touches[1].clientX) / 2;
          const cy = (touches[0].clientY + touches[1].clientY) / 2;
          const rect = containerRef.current?.getBoundingClientRect();
          const slideCenterX = rect ? rect.left + rect.width / 2 : cx;
          const slideCenterY = rect ? rect.top + rect.height / 2 : cy;
          const ratio = next / prevScale;
          const prevPan = lastPinchPanRef.current;
          const newPanX = (cx - slideCenterX) * (1 - ratio) + prevPan.x * ratio;
          const newPanY = (cy - slideCenterY) * (1 - ratio) + prevPan.y * ratio;
          setScale(next);
          setPan({ x: newPanX, y: newPanY });
          lastPinchScaleRef.current = next;
          lastPinchPanRef.current = { x: newPanX, y: newPanY };
        }
        lastPinchDistRef.current = dist;
        return;
      }

      if (touches.length === 1) {
        const dx = touches[0].clientX - touchStartRef.current.x;
        const dy = touches[0].clientY - touchStartRef.current.y;

        if (scale > 1) {
          if (gestureModeRef.current !== "dismiss" && gestureModeRef.current !== "carousel") {
            gestureModeRef.current = "pan";
          }
          if (gestureModeRef.current === "pan") {
            const sw = containerRef.current?.clientWidth || viewportWidth;
            const maxP = ((scale - 1) * sw) / 2;
            const clamp = (v) => Math.max(-maxP, Math.min(maxP, v));
            setPan({
              x: clamp(touchStartRef.current.pan.x + dx),
              y: clamp(touchStartRef.current.pan.y + dy),
            });
          }
        } else {
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          const totalMove = Math.hypot(dx, dy);
          // Chỉ coi là swipe khi di chuyển vượt ngưỡng → double-tap không bị nhầm thành carousel/dismiss
          if (gestureModeRef.current === null && totalMove > TAP_MOVE_PX) {
            if (absDy > absDx) gestureModeRef.current = "dismiss";
            else if (absDx > absDy) gestureModeRef.current = "carousel";
          }
          if (gestureModeRef.current === "dismiss") {
            latestDismissRef.current = dy;
            setDismissOffset(dy);
          } else if (gestureModeRef.current === "carousel") {
            latestCarouselRef.current = dx;
            setCarouselOffset(dx);
          }
        }
      }
    },
    [scale, viewportWidth, canZoom]
  );
  onTouchMoveRef.current = onTouchMove;

  const onTouchEnd = useCallback(
    (e) => {
      const touches = Array.from(e.touches);
      if (touches.length >= 2) return;

      if (gestureModeRef.current === "dismiss") {
        if (Math.abs(latestDismissRef.current) >= DISMISS_THRESHOLD) {
          close();
        }
        latestDismissRef.current = 0;
        setDismissOffset(0);
      } else if (gestureModeRef.current === "carousel") {
        const co = latestCarouselRef.current;
        if (co > SWIPE_CAROUSEL_THRESHOLD && index > 0) goPrev();
        else if (co < -SWIPE_CAROUSEL_THRESHOLD && index < total - 1) goNext();
        latestCarouselRef.current = 0;
        setCarouselOffset(0);
      } else if (gestureModeRef.current === null && e.changedTouches?.length === 1) {
        const end = e.changedTouches[0];
        const dx = end.clientX - touchStartRef.current.x;
        const dy = end.clientY - touchStartRef.current.y;
        if (Math.abs(dx) < TAP_MOVE_PX && Math.abs(dy) < TAP_MOVE_PX) {
          const now = Date.now();
          const prev = lastTapRef.current;
          const dist = Math.hypot(end.clientX - prev.x, end.clientY - prev.y);
          if (now - prev.time < DOUBLE_TAP_MS && dist < DOUBLE_TAP_PX) {
            setScale((s) => (s > 1 ? 1 : canZoom ? DOUBLE_TAP_ZOOM : 1));
            setPan({ x: 0, y: 0 });
            lastTapRef.current = { time: 0, x: 0, y: 0 };
            gestureModeRef.current = null;
            lastPinchDistRef.current = null;
            lastPinchScaleRef.current = scale;
            touchStartRef.current = { ...touchStartRef.current, pan: { x: 0, y: 0 } };
            setIsDragging(false);
            return;
          }
          lastTapRef.current = { time: now, x: end.clientX, y: end.clientY };
        }
      }

      gestureModeRef.current = null;
      lastPinchDistRef.current = null;
      lastPinchScaleRef.current = scale;
      touchStartRef.current = { ...touchStartRef.current, pan: { ...pan } };
      setIsDragging(false);
    },
    [index, total, scale, pan, close, goPrev, goNext, canZoom]
  );

  const onDoubleTapZoom = useCallback(() => {
    setScale((s) => (s > 1 ? 1 : canZoom ? DOUBLE_TAP_ZOOM : 1));
    setPan({ x: 0, y: 0 });
    setCarouselOffset(0);
  }, [canZoom]);

  // Mouse wheel zoom (desktop: Ctrl + wheel) – pan compensation so zoom stays at container center
  const onWheel = useCallback(
    (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      setScale((s) => {
        let next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta));
        if (!canZoom && next > 1) next = 1;
        if (next === s) return s;
        const ratio = next / s;
        setPan((p) => ({ x: p.x * ratio, y: p.y * ratio }));
        return next;
      });
    },
    [canZoom]
  );

  const canSwipeLeft = index < total - 1;
  const canSwipeRight = index > 0;
  const absDismiss = Math.abs(dismissOffset);
  const bgOpacity = Math.max(0.3, 1 - absDismiss / 280);
  const imageY = dismissOffset * 0.6;
  const slideWidth = containerWidth > 0 ? containerWidth : viewportWidth;
  const maxPan = scale > 1 ? ((scale - 1) * slideWidth) / 2 : 0;
  const clampedPan = {
    x: Math.max(-maxPan, Math.min(maxPan, pan.x)),
    y: Math.max(-maxPan, Math.min(maxPan, pan.y)),
  };
  // Layer 1 – carousel only: no scale on sheet
  const sheetX =
    -index * slideWidth +
    (dismissOffset !== 0 ? 0 : scale > 1 ? 0 : carouselOffset);
  const sheetY = imageY;

  return (
    <motion.div
      className="media-viewer-backdrop"
      initial={{ opacity: 0 }}
      animate={{
        opacity: bgOpacity,
        transition: { duration: 0.2 },
      }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      onClick={(e) => {
        if (introPhase === "running") return;
        if (e.target === e.currentTarget && scale === 1) close();
      }}
      onWheel={onWheel}
      style={{ touchAction: "none" }}
    >
      {/* Intro: ghost from thumbnail → fullscreen */}
      {introPhase === "running" && hasOrigin && originRect && fullscreenRect && (
        <motion.img
          src={originSrc}
          alt=""
          referrerPolicy="no-referrer"
          className="media-viewer-intro"
          draggable={false}
          style={{ position: "fixed", objectFit: "cover" }}
          initial={{
            left: originRect.left,
            top: originRect.top,
            width: originRect.width,
            height: originRect.height,
            borderRadius: 12,
          }}
          animate={{
            left: fullscreenRect.left,
            top: fullscreenRect.top,
            width: fullscreenRect.width,
            height: fullscreenRect.height,
            borderRadius: 16,
          }}
          transition={{
            duration: INTRO_DURATION_MS / 1000,
            ease: [0.2, 0.8, 0.2, 1],
          }}
          onAnimationComplete={() => setIntroPhase("done")}
          onClick={(e) => e.stopPropagation()}
        />
      )}

        <button
          type="button"
          className="media-viewer-close"
          onClick={close}
          aria-label="Close"
        >
          <X size={28} />
        </button>

        {downloadUrl && (
          <button
            type="button"
            className="media-viewer-download"
            onClick={downloadImage}
            aria-label="Download"
          >
            <Download size={24} />
          </button>
        )}

        {currentImage && (
          <button
            type="button"
            className={`media-viewer-like ${liked ? "media-viewer-like--active" : ""}`}
            onClick={handleToggleLike}
            aria-label={liked ? "Unlike" : "Like"}
            aria-pressed={liked}
          >
            <Heart size={24} fill={liked ? "currentColor" : "none"} strokeWidth={1.75} />
          </button>
        )}

        {canSwipeRight && (
          <button
            type="button"
            className="media-viewer-nav media-viewer-nav--prev"
            onClick={goPrev}
            aria-label="Previous"
          >
            <ChevronLeft size={36} />
          </button>
        )}

        {canSwipeLeft && (
          <button
            type="button"
            className="media-viewer-nav media-viewer-nav--next"
            onClick={goNext}
            aria-label="Next"
          >
            <ChevronRight size={36} />
          </button>
        )}

        <div
          ref={containerRef}
          className="media-viewer-container"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          onDoubleClick={onDoubleTapZoom}
          onClick={(e) => e.stopPropagation()}
          style={{
            touchAction: "none",
            opacity: introPhase === "running" ? 0 : 1,
          }}
        >
          {containerWidth > 0 && (
          <motion.div
            className="media-viewer-sheet"
            initial={false}
            style={{
              width: total * slideWidth,
            }}
            animate={{
              x: sheetX,
              y: sheetY,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 35,
              mass: 0.6,
            }}
          >
            {images.map((img, i) => {
              const displayLoaded = fullResLoaded[i];
              const inRange = Math.abs(i - index) <= 1;
              const shouldLoad = displayLoaded || inRange;
              const isActive = i === index;
              return (
                <div
                  key={i}
                  className="media-viewer-slide"
                  style={{
                    width: slideWidth,
                    minWidth: slideWidth,
                    maxWidth: slideWidth,
                  }}
                >
                  <motion.div
                    className="media-viewer-slide-zoom"
                    initial={false}
                    animate={
                      isActive
                        ? {
                            x: clampedPan.x,
                            y: clampedPan.y,
                            scale,
                            opacity: 1,
                          }
                        : { x: 0, y: 0, scale: 1, opacity: 1 }
                    }
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 35,
                      mass: 0.6,
                    }}
                    style={{
                      transformOrigin: "center center",
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 1,
                    }}
                  >
                    <ViewerSlideImage
                      image={img}
                      slideIndex={i}
                      shouldLoad={shouldLoad}
                      isLoaded={displayLoaded}
                      onLoaded={markSlideLoaded}
                      viewportWidth={viewportWidth}
                    />
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
          )}
        </div>

        <div className="media-viewer-counter" aria-live="polite">
          {index + 1} / {total}
        </div>
        {!canZoom && currentImage && (
          <div className="media-viewer-hd-loading" aria-live="polite">
            Đang tải HD…
          </div>
        )}
    </motion.div>
  );
}
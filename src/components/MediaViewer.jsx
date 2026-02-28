import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { getOptimizedImagePaths } from "../Gallery";

const getThumbnailSrc = (image) => {
  if (image?.thumbnail) return image.thumbnail;
  if (image?.src) {
    const paths = getOptimizedImagePaths(image.src);
    return paths.thumbnail || image.src;
  }
  return image?.src || "";
};

const getFullSizeSrc = (image) => {
  if (image?.fullSize) return image.fullSize;
  if (image?.src) {
    const paths = getOptimizedImagePaths(image.src);
    return paths.fullSize || image.src;
  }
  return image?.src || "";
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DISMISS_THRESHOLD = 120;
const SWIPE_CAROUSEL_THRESHOLD = 60;
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

export default function MediaViewer({
  initialIndex = 0,
  images = [],
  originRect = null,
  originSrc = null,
  onClose,
  onIndexChange,
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

  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null);
  const lastPinchDistRef = useRef(null);
  const lastPinchScaleRef = useRef(1);
  const gestureModeRef = useRef(null); // 'pinch' | 'pan' | 'carousel' | 'dismiss'
  const touchStartRef = useRef({ x: 0, y: 0, scale: 1, pan: { x: 0, y: 0 } });
  const latestDismissRef = useRef(0);
  const latestCarouselRef = useRef(0);
  const onTouchMoveRef = useRef(() => {});

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
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", handleTouchMove);
  }, []);

  const total = images.length;
  const currentImage = images[index];
  const fullSrc = currentImage ? getFullSizeSrc(currentImage) : "";

  // Preload all full-size images when viewer opens so every slide shows (no blank for far slides)
  useEffect(() => {
    if (!images.length) return;
    images.forEach((img, i) => {
      const src = getFullSizeSrc(img);
      if (!src) return;
      const imgEl = new Image();
      imgEl.onload = () =>
        setFullResLoaded((prev) => ({ ...prev, [i]: true }));
      imgEl.onerror = () => {
        // Don't set loaded on error so we keep showing thumbnail placeholder
      };
      imgEl.src = src;
    });
  }, [images]);

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
          const next = Math.min(
            MAX_SCALE,
            Math.max(MIN_SCALE, lastPinchScaleRef.current * delta)
          );
          setScale(next);
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
            setPan({
              x: touchStartRef.current.pan.x + dx,
              y: touchStartRef.current.pan.y + dy,
            });
          }
        } else {
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          if (gestureModeRef.current === null) {
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
    [scale]
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
      }

      gestureModeRef.current = null;
      lastPinchDistRef.current = null;
      lastPinchScaleRef.current = scale;
      touchStartRef.current = { ...touchStartRef.current, pan: { ...pan } };
      setIsDragging(false);
    },
    [index, total, scale, pan, close, goPrev, goNext]
  );

  // Mouse wheel zoom (desktop: Ctrl + wheel)
  const onWheel = useCallback(
    (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta)));
    },
    []
  );

  const canSwipeLeft = index < total - 1;
  const canSwipeRight = index > 0;
  const absDismiss = Math.abs(dismissOffset);
  const bgOpacity = Math.max(0.3, 1 - absDismiss / 280);
  const imageScale = 1;
  const imageY = dismissOffset * 0.6;
  const slideWidth = containerWidth > 0 ? containerWidth : viewportWidth;
  const sheetX =
    -index * slideWidth +
    (dismissOffset !== 0 ? 0 : carouselOffset) +
    (scale > 1 ? pan.x : 0);
  const sheetY = imageY + (scale > 1 ? pan.y : 0);

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
              scale: imageScale * scale,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 35,
              mass: 0.6,
            }}
          >
            {images.map((img, i) => {
              const thumb = getThumbnailSrc(img);
              const full = getFullSizeSrc(img);
              const loaded = fullResLoaded[i];
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
                  {!loaded && (
                    <div className="media-viewer-placeholder">
                      <div className="media-viewer-placeholder__shimmer" />
                      <img
                        src={thumb}
                        alt=""
                        className="media-viewer-thumb"
                        draggable={false}
                      />
                    </div>
                  )}
                  <img
                    src={full}
                    alt={img?.alt || `Image ${i + 1}`}
                    className="media-viewer-full"
                    draggable={false}
                    loading="eager"
                    onLoad={() =>
                      setFullResLoaded((prev) => ({ ...prev, [i]: true }))
                    }
                    onError={() => {
                      // Keep showing thumbnail; don't mark full as loaded
                    }}
                    style={{
                      opacity: loaded ? 1 : 0,
                      position: loaded ? "relative" : "absolute",
                      inset: 0,
                    }}
                  />
                </div>
              );
            })}
          </motion.div>
          )}
        </div>

        <div className="media-viewer-counter" aria-live="polite">
          {index + 1} / {total}
        </div>
    </motion.div>
  );
}

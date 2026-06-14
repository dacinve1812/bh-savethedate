import { useState, useEffect, useCallback, useRef } from "react";

export const MASONRY_ROW_HEIGHT_PX = 8;
export const MASONRY_COLUMN_COUNT = 3;
export const MASONRY_CONTAINER_MAX_PX = 1200;
export const DEFAULT_MASONRY_GAP_PX = 16;
export const DEFAULT_ASPECT_RATIO = 4 / 3;

/** Gap px by breakpoint — matches App.css --gallery-masonry-gap. */
export function getViewportMasonryGapPx() {
  if (typeof window === "undefined") return DEFAULT_MASONRY_GAP_PX;
  if (window.innerWidth <= 768) return 10;
  if (window.innerWidth <= 1024) return 14;
  return 16;
}

/** Read vertical gap between masonry items (px). Matches --gallery-masonry-gap. */
export function getMasonryGapPx(_gridEl) {
  return getViewportMasonryGapPx();
}

export function estimateRowSpan(
  aspectRatio = DEFAULT_ASPECT_RATIO,
  gapPx = getViewportMasonryGapPx()
) {
  if (typeof window === "undefined") return 20;
  const viewportPadding = Math.min(window.innerWidth * 0.1, 64) * 2;
  const containerW = Math.min(
    MASONRY_CONTAINER_MAX_PX,
    Math.max(320, window.innerWidth - viewportPadding)
  );
  const columns =
    window.innerWidth <= 768 ? 2 : MASONRY_COLUMN_COUNT;
  const gridGap = gapPx;
  const colW = (containerW - gridGap * (columns - 1)) / columns;
  const h = colW / aspectRatio + gridGap;
  return Math.max(1, Math.ceil(h / MASONRY_ROW_HEIGHT_PX));
}

export function useMasonryRowSpan(contentRef, initialAspectRatio = DEFAULT_ASPECT_RATIO) {
  const [rowSpan, setRowSpan] = useState(() => estimateRowSpan(initialAspectRatio));
  const rafRef = useRef(null);

  const recalcSpan = useCallback(() => {
    const wrapper = contentRef.current;
    if (!wrapper) return;
    const itemEl = wrapper.closest(".gallery__item");
    const gapPx = getMasonryGapPx();
    const wrapperH = wrapper.getBoundingClientRect().height;
    if (wrapperH <= 0) return;
    let marginBottom = gapPx;
    if (itemEl) {
      const mb = parseFloat(getComputedStyle(itemEl).marginBottom);
      if (Number.isFinite(mb) && mb > 0) marginBottom = mb;
    }
    const h = wrapperH + marginBottom;
    setRowSpan(Math.max(1, Math.ceil(h / MASONRY_ROW_HEIGHT_PX)));
  }, [contentRef]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const scheduleRecalc = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        recalcSpan();
      });
    };
    const ro = new ResizeObserver(scheduleRecalc);
    ro.observe(el);
    scheduleRecalc();
    const onResize = () => {
      const grid = el.closest(".gallery__masonry");
      const gapPx = getMasonryGapPx(grid);
      if (!el.style.aspectRatio) setRowSpan(estimateRowSpan(initialAspectRatio, gapPx));
      scheduleRecalc();
    };
    window.addEventListener("resize", onResize);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [contentRef, recalcSpan, initialAspectRatio]);

  const onImageMetrics = useCallback(
    (naturalWidth, naturalHeight, onLoaded) => {
      const wrapper = contentRef.current;
      if (wrapper && naturalWidth > 0 && naturalHeight > 0) {
        wrapper.style.aspectRatio = `${naturalWidth} / ${naturalHeight}`;
        requestAnimationFrame(() => recalcSpan());
      }
      onLoaded?.();
    },
    [contentRef, recalcSpan]
  );

  return { rowSpan, recalcSpan, onImageMetrics };
}

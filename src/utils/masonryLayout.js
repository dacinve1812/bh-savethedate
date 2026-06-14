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

/** Product of CSS `zoom` on ancestors (invitation wrapper uses zoom on short viewports). */
export function getAncestorZoomFactor(el) {
  if (!el || typeof window === "undefined") return 1;
  let factor = 1;
  for (let node = el.parentElement; node; node = node.parentElement) {
    const { zoom } = getComputedStyle(node);
    if (zoom && zoom !== "normal") {
      const value = parseFloat(zoom);
      if (Number.isFinite(value) && value > 0) factor *= value;
    }
  }
  return factor;
}

/** Layout height for masonry span — offsetHeight matches grid tracks; rect shrinks under zoom. */
export function measureMasonryContentHeight(el) {
  if (!el) return 0;
  const offsetH = el.offsetHeight;
  const rectH = el.getBoundingClientRect().height;
  if (offsetH <= 0) return rectH;
  if (rectH <= 0) return offsetH;
  const zoom = getAncestorZoomFactor(el);
  if (zoom < 1 && rectH < offsetH * 0.98) return offsetH;
  return Math.max(offsetH, rectH / (zoom || 1));
}

/** Read gap between masonry items (px). Matches --gallery-masonry-gap on the grid. */
export function getMasonryGapPx(gridEl) {
  if (gridEl) {
    const styles = getComputedStyle(gridEl);
    const customGap = styles.getPropertyValue("--gallery-masonry-gap").trim();
    if (customGap) {
      const parsed = parseFloat(customGap);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    const columnGap = parseFloat(styles.columnGap);
    if (Number.isFinite(columnGap) && columnGap > 0) return columnGap;
  }
  return getViewportMasonryGapPx();
}

export function computeMasonryRowSpan(contentHeightPx, gapPx = DEFAULT_MASONRY_GAP_PX) {
  if (contentHeightPx <= 0) return 1;
  return Math.max(1, Math.ceil((contentHeightPx + gapPx) / MASONRY_ROW_HEIGHT_PX));
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
  const contentH = colW / aspectRatio;
  return computeMasonryRowSpan(contentH, gapPx);
}

export function useMasonryRowSpan(contentRef, initialAspectRatio = DEFAULT_ASPECT_RATIO) {
  const [rowSpan, setRowSpan] = useState(() => estimateRowSpan(initialAspectRatio));
  const rafRef = useRef(null);

  const recalcSpan = useCallback(() => {
    const wrapper = contentRef.current;
    if (!wrapper) return;
    const grid = wrapper.closest(".gallery__masonry");
    const gapPx = getMasonryGapPx(grid);
    const wrapperH = measureMasonryContentHeight(wrapper);
    if (wrapperH <= 0) return;
    setRowSpan(computeMasonryRowSpan(wrapperH, gapPx));
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

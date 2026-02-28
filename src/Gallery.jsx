import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "./contexts/LanguageContext";
import { translations } from "./translations";

// ============================================
// GALLERY IMAGES – tự động + cấu hình chọn/sắp xếp
// ============================================
// - galleryImages.generated.js: tất cả ảnh trong public/images/original/
// - galleryConfig.js: GALLERY_ORDER – thứ tự mặc định (file).
// - localStorage "gallery_order": thứ tự từ trang Admin (ưu tiên nếu có).
import { GALLERY_IMAGES as ALL_IMAGES } from "./galleryImages.generated";
import { GALLERY_ORDER } from "./galleryConfig";

const STORAGE_KEY = "gallery_order";

function getAltFromSrc(src) {
  const name = src.replace(/^.*\//, "").replace(/\.[^.]*$/, "");
  return name || "Image";
}

function getStoredOrder() {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return null;
    const a = JSON.parse(s);
    return Array.isArray(a) && a.length > 0 ? a : null;
  } catch {
    return null;
  }
}

function buildListFromOrder(order) {
  if (!order || order.length === 0) return ALL_IMAGES;
  return order.map(
    (src) =>
      ALL_IMAGES.find((img) => img.src === src) || {
        src,
        alt: getAltFromSrc(src),
      }
  );
}

const GALLERY_IMAGES = buildListFromOrder(
  (typeof window !== "undefined" ? getStoredOrder() : null) || GALLERY_ORDER
);

export { GALLERY_IMAGES, STORAGE_KEY };

/** Hook: danh sách gallery có tính cả thứ tự lưu trong Admin (localStorage). Cập nhật khi storage thay đổi. */
export function useEffectiveGalleryImages() {
  const [order, setOrder] = useState(() => getStoredOrder());
  useEffect(() => {
    const sync = () => setOrder(getStoredOrder());
    window.addEventListener("storage", sync);
    window.addEventListener("gallery_order_updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("gallery_order_updated", sync);
    };
  }, []);
  const effectiveOrder = order ?? GALLERY_ORDER;
  return useMemo(
    () => buildListFromOrder(effectiveOrder),
    [effectiveOrder?.join(",")]
  );
}

// Thumbnail widths phải khớp với script optimizeImages.cjs (240, 400, 600, 800)
const THUMB_WIDTHS = [240, 400, 600, 800];
const THUMB_EXT = '.webp';

// Helper function để convert tên file gốc sang format của optimized images
// Script tạo: thumbnails/safeBaseName-240.webp, -400.webp, -600.webp, -800.webp
// Logic phải giống hệt script optimizeImages.cjs
// Export để dùng chung trong InvitationBody / MediaViewer
export function getOptimizedImagePaths(originalSrc) {
  if (!originalSrc) return { thumbnail: null, thumbnailMaxRes: null, fullSize: null, thumbnailSrcSet: null, thumbnailSizes: null };
  
  let relativePath = originalSrc.startsWith('/') ? originalSrc.substring(1) : originalSrc;
  relativePath = relativePath.replace(/^public\//, '');
  const fileName = relativePath.split('/').pop() || relativePath;
  const ext = fileName.match(/\.[^/.]+$/)?.[0]?.toLowerCase() || '';
  const isPng = ext === '.png';
  const safeBaseName = fileName.replace(/[^a-zA-Z0-9]/g, '_').replace(/\.[^/.]+$/, '');
  
  const baseThumb = `/images/thumbnails/${safeBaseName}`;
  const thumbnail = `${baseThumb}-400${THUMB_EXT}`;
  const thumbnailMaxRes = `${baseThumb}-${Math.max(...THUMB_WIDTHS)}${THUMB_EXT}`;
  const fullPath = `/images/full/${safeBaseName}${isPng ? '.png' : '.jpg'}`;
  const thumbnailSrcSet = THUMB_WIDTHS.map((w) => `${baseThumb}-${w}${THUMB_EXT} ${w}w`).join(', ');
  const thumbnailSizes = '(max-width: 432px) 55vw, 200px';
  return { thumbnail, thumbnailMaxRes, fullSize: fullPath, thumbnailSrcSet, thumbnailSizes };
}

const MASONRY_ROW_HEIGHT_PX = 8;

function GalleryItem({
  image,
  index,
  thumbnailSrc,
  fullSizeSrc,
  thumbnailSrcSet,
  thumbnailSizes,
  shouldPreload,
  imageLoadingStates,
  setImageLoadingStates,
  imageRefs,
  processedImagesRef,
  onOpen,
  itemRef,
}) {
  const contentRef = useRef(null);
  const [rowSpan, setRowSpan] = useState(400);
  const rafRef = useRef(null);

  const recalcSpan = useCallback(() => {
    const wrapper = contentRef.current;
    if (!wrapper) return;
    const grid = wrapper.closest(".gallery__masonry");
    const rowGapPx = grid
      ? parseFloat(getComputedStyle(grid).rowGap) || 0
      : 0;
    const h = wrapper.getBoundingClientRect().height;
    if (h <= 0) return;
    const rowHeight = MASONRY_ROW_HEIGHT_PX;
    const unit = rowHeight + rowGapPx;
    const span = Math.max(
      1,
      Math.ceil((h + rowGapPx) / unit)
    );
    setRowSpan(span);
  }, []);

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
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [recalcSpan]);

  const handleImageLoad = useCallback(
    (e) => {
      const img = e.target;
      const wrapper = contentRef.current;
      if (wrapper && img.naturalWidth > 0 && img.naturalHeight > 0) {
        wrapper.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
        requestAnimationFrame(() => recalcSpan());
      }
      setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
    },
    [index, setImageLoadingStates, recalcSpan]
  );

  const setImgRef = useCallback(
    (el) => {
      if (el) {
        imageRefs.current[index] = el;
        if (
          el.complete &&
          el.naturalHeight !== 0 &&
          el.naturalWidth > 0 &&
          !processedImagesRef.current.has(index)
        ) {
          processedImagesRef.current.add(index);
          setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
          queueMicrotask(() => {
            const w = contentRef.current;
            if (w) {
              w.style.aspectRatio = `${el.naturalWidth} / ${el.naturalHeight}`;
              requestAnimationFrame(() => recalcSpan());
            }
          });
        }
      }
    },
    [index, imageRefs, processedImagesRef, setImageLoadingStates, recalcSpan]
  );

  return (
    <motion.div
      ref={itemRef}
      className="gallery__item"
      style={{ gridRowEnd: `span ${rowSpan}` }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{
        duration: 0.28,
        delay: index * 0.012,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <div
        ref={contentRef}
        className="gallery__image-wrapper"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          onOpen(index, {
            rect: { left: r.left, top: r.top, width: r.width, height: r.height },
            src: thumbnailSrc,
          });
        }}
      >
        {!imageLoadingStates[index] && (
          <div className="gallery__image-loading" aria-hidden="true">
            <span className="gallery__image-spinner" />
          </div>
        )}
        <img
          src={thumbnailSrc}
          srcSet={thumbnailSrcSet || undefined}
          sizes={thumbnailSizes || undefined}
          data-full={shouldPreload ? fullSizeSrc : undefined}
          data-index={index}
          alt={image.alt || `Gallery image ${index + 1}`}
          className={`gallery__image ${imageLoadingStates[index] ? "gallery__image--loaded" : "gallery__image--loading"}`}
          loading="lazy"
          decoding="async"
          onLoad={handleImageLoad}
          onError={() => setImageLoadingStates((prev) => ({ ...prev, [index]: true }))}
          ref={setImgRef}
        />
      </div>
    </motion.div>
  );
}

export default function Gallery({ onOpen, images: imagesProp, scrollToIndex, onScrollToComplete }) {
  const list = imagesProp ?? GALLERY_IMAGES;
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [imageLoadingStates, setImageLoadingStates] = useState({}); // Track loading state per image
  const galleryRef = useRef(null);
  const imageRefs = useRef({});
  const itemRefs = useRef({});
  const processedImagesRef = useRef(new Set()); // Track which images we've already processed

  useEffect(() => {
    if (scrollToIndex == null || scrollToIndex < 0 || scrollToIndex >= list.length) return;
    const el = itemRefs.current[scrollToIndex];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    onScrollToComplete?.();
  }, [scrollToIndex, list.length, onScrollToComplete]);

  // Helper functions: tự động map src sang thumbnails và fullSize
  const getImageSrc = (image) => {
    // Nếu có thumbnail được định nghĩa sẵn (manual override), dùng nó
    if (image.thumbnail) return image.thumbnail;
    
    // Tự động generate thumbnail path từ src
    if (image.src) {
      const paths = getOptimizedImagePaths(image.src);
      return paths.thumbnail || image.src; // Fallback về original nếu không tìm thấy thumbnail
    }
    
    return image.src;
  };

  const getFullSizeSrc = (image) => {
    // Nếu có fullSize được định nghĩa sẵn (manual override), dùng nó
    if (image.fullSize) return image.fullSize;
    
    // Tự động generate fullSize path từ src (compressed full-size từ script)
    if (image.src) {
      const paths = getOptimizedImagePaths(image.src);
      return paths.fullSize || image.src; // Fallback về original nếu không tìm thấy
    }
    
    return image.src;
  };

  // Intersection Observer cho preloading full-size images (chỉ preload, không update src)
  // Gallery view giữ nguyên thumbnails, full-size chỉ dùng trong lightbox
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const fullSrc = img.dataset.full;
            
            // Chỉ preload full-size để sẵn sàng cho lightbox, không thay đổi src trong gallery
            if (fullSrc && !loadedImages.has(fullSrc)) {
              const fullImage = new Image();
              fullImage.onload = () => {
                // Chỉ track rằng full-size đã được preload, không update src
                setLoadedImages(prev => new Set(prev).add(fullSrc));
              };
              fullImage.onerror = () => {
                // Track cả khi error để tránh retry
                setLoadedImages(prev => new Set(prev).add(fullSrc));
              };
              fullImage.src = fullSrc;
            }
            
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: "100px", // Start loading 100px before entering viewport
        threshold: 0.01
      }
    );

    // Observe all images
    const imageElements = document.querySelectorAll('.gallery__image[data-full]');
    imageElements.forEach(img => observer.observe(img));

    return () => {
      imageElements.forEach(img => observer.unobserve(img));
    };
  }, [loadedImages]);

  return (
    <section className="gallery">
      <motion.header
        className="gallery__header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <p className="gallery__eyebrow">{t.galleryEyebrow}</p>
        <h1 className="gallery__title">{t.galleryTitle}</h1>
      </motion.header>

      <div className="gallery__container" ref={galleryRef}>
        <div className="gallery__masonry">
          {list.map((image, index) => {
            const thumbnailSrc = getImageSrc(image);
            const fullSizeSrc = getFullSizeSrc(image);
            const paths = image.src ? getOptimizedImagePaths(image.src) : null;
            const thumbnailSrcSet = paths?.thumbnailSrcSet ?? null;
            const thumbnailSizes = paths?.thumbnailSizes ?? null;
            const shouldPreload = thumbnailSrc !== fullSizeSrc && thumbnailSrc && fullSizeSrc;

            return (
              <GalleryItem
                key={image.fullSize || image.thumbnail || image.src}
                image={image}
                index={index}
                thumbnailSrc={thumbnailSrc}
                fullSizeSrc={fullSizeSrc}
                thumbnailSrcSet={thumbnailSrcSet}
                thumbnailSizes={thumbnailSizes}
                shouldPreload={shouldPreload}
                imageLoadingStates={imageLoadingStates}
                setImageLoadingStates={setImageLoadingStates}
                imageRefs={imageRefs}
                processedImagesRef={processedImagesRef}
                onOpen={onOpen}
                itemRef={(el) => { itemRefs.current[index] = el; }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}


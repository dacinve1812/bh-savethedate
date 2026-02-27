import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "./contexts/LanguageContext";
import { translations } from "./translations";
import ImagePlaceholder from "./components/ImagePlaceholder";

// ============================================
// GALLERY IMAGES CONFIGURATION
// ============================================
// Chỉ cần list filenames - code sẽ tự động map sang thumbnails và fullSize
// Format đơn giản: { src: "/filename.jpg", alt: "Description" }
// Code tự động:
// - Thumbnail: /images/thumbnails/[optimized_name].jpg
// - Full-size: /images/full/[optimized_name].jpg
export const GALLERY_IMAGES = [
  { src: "/DSC02431.JPG", alt: "Wedding moment 1" },
  { src: "/feature-hero-desktop.jpg", alt: "Wedding moment 2" },
  { src: "/DSC00763.JPG", alt: "Wedding moment 3" },
  { src: "/NP__7180.JPG", alt: "Wedding moment 4" },
  { src: "/NP__7930.JPG", alt: "Wedding moment 7" },
  { src: "/photo1.jpg", alt: "Wedding moment 8" },
  { src: "/photo2-2.jpg", alt: "Wedding moment 11" },
  { src: "/DSC02125.JPG", alt: "Wedding moment 1" },
  { src: "/DSC00717.JPG", alt: "Wedding moment 12" },
  
];

// Helper function để convert tên file gốc sang format của optimized images
// Script tạo file với format: tên_file_gốc với ký tự đặc biệt được replace bằng _
// Logic phải giống hệt script optimizeImages.cjs
// Export để dùng chung trong InvitationBody
export function getOptimizedImagePaths(originalSrc) {
  if (!originalSrc) return { thumbnail: null, fullSize: null };
  
  // Extract relative path từ originalSrc (ví dụ: "/DSC02431.JPG" -> "DSC02431.JPG")
  let relativePath = originalSrc.startsWith('/') ? originalSrc.substring(1) : originalSrc;
  relativePath = relativePath.replace(/^public\//, ''); // Remove public/ prefix nếu có
  
  // Nếu có thư mục, chỉ lấy filename (script chỉ dùng filename từ relativePath)
  const fileName = relativePath.split('/').pop() || relativePath;
  
  // Detect extension từ original để quyết định format full-size
  const ext = fileName.match(/\.[^/.]+$/)?.[0]?.toLowerCase() || '';
  const isPng = ext === '.png';
  
  // Logic giống script: 
  // 1. Replace tất cả ký tự đặc biệt (bao gồm cả . và () và _) bằng _
  // 2. Remove extension bằng replace pattern (sau khi replace thì không còn . nữa)
  // Ví dụ: "DSC02431.JPG" -> "DSC02431_JPG" (sau replace) -> "DSC02431_JPG" (sau remove ext, không match)
  // Ví dụ: "NP__7729_(2).JPG" -> "NP__7729__2__JPG" -> "NP__7729__2__JPG"
  const safeBaseName = fileName.replace(/[^a-zA-Z0-9]/g, '_').replace(/\.[^/.]+$/, '');
  
  // Tạo paths
  const thumbnailPath = `/images/thumbnails/${safeBaseName}.jpg`;
  const fullPath = `/images/full/${safeBaseName}${isPng ? '.png' : '.jpg'}`;
  
  return { thumbnail: thumbnailPath, fullSize: fullPath };
}

export default function Gallery({ onOpen }) {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [imageLoadingStates, setImageLoadingStates] = useState({}); // Track loading state per image
  const galleryRef = useRef(null);
  const imageRefs = useRef({});
  const processedImagesRef = useRef(new Set()); // Track which images we've already processed

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
          {GALLERY_IMAGES.map((image, index) => {
            const thumbnailSrc = getImageSrc(image);
            const fullSizeSrc = getFullSizeSrc(image);
            const isPreloaded = loadedImages.has(fullSizeSrc);
            // Preload full-size khi có thumbnail và fullSize khác nhau
            const shouldPreload = thumbnailSrc !== fullSizeSrc && thumbnailSrc && fullSizeSrc;

            return (
              <motion.div
                key={image.fullSize || image.thumbnail || image.src}
                className="gallery__item"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.03,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                <div
                  className="gallery__image-wrapper"
                  onClick={(e) => {
                    const el = e.currentTarget;
                    const r = el.getBoundingClientRect();
                    const rect = {
                      left: r.left,
                      top: r.top,
                      width: r.width,
                      height: r.height,
                    };
                    onOpen(index, { rect, src: thumbnailSrc });
                  }}
                >
                  {/* Placeholder - shown while image is loading */}
                  {!imageLoadingStates[index] && (
                    <ImagePlaceholder
                      type="landscape"
                      className="gallery__image-placeholder"
                    />
                  )}
                  
                  {/* Actual image */}
                  <img
                    src={thumbnailSrc}
                    data-full={shouldPreload ? fullSizeSrc : undefined}
                    data-index={index}
                    alt={image.alt || `Gallery image ${index + 1}`}
                    className={`gallery__image ${imageLoadingStates[index] ? 'gallery__image--loaded' : 'gallery__image--loading'}`}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => {
                      setImageLoadingStates(prev => ({ ...prev, [index]: true }));
                    }}
                    onError={() => {
                      setImageLoadingStates(prev => ({ ...prev, [index]: true }));
                    }}
                    ref={(el) => {
                      if (el) {
                        imageRefs.current[index] = el;
                        // Check if already loaded (cached) - only process once per image
                        if (el.complete && el.naturalHeight !== 0 && !processedImagesRef.current.has(index)) {
                          processedImagesRef.current.add(index);
                          setImageLoadingStates(prev => ({ ...prev, [index]: true }));
                        }
                      }
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


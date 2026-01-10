import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

// ============================================
// GALLERY IMAGES CONFIGURATION
// ============================================
// Thêm/sửa/xóa ảnh tại đây
// Mỗi ảnh có thể có:
// - src: đường dẫn đến ảnh (required)
// - alt: mô tả ảnh (optional)
// - aspectRatio: "landscape" hoặc "portrait" (optional, sẽ tự detect nếu không có)
export const GALLERY_IMAGES = [
  
  { src: "/DSC02431.JPG", alt: "Wedding moment 2" },
  { src: "/NP__7045.JPG", alt: "Wedding moment 3" },
  { src: "/NP__7180.JPG", alt: "Wedding moment 4" },
  { src: "/NP__7729_(2).JPG", alt: "Wedding moment 5" },
  { src: "/NP__7757_(2).JPG", alt: "Wedding moment 6" },
  { src: "/NP__7930.JPG", alt: "Wedding moment 7" },
  { src: "/photo1.jpg", alt: "Wedding moment 8" },
  { src: "/photo1-1.jpg", alt: "Wedding moment 9" },
  { src: "/photo2.jpg", alt: "Wedding moment 10" },
  { src: "/photo2-2.jpg", alt: "Wedding moment 11" },
  { src: "/DSC02125.JPG", alt: "Wedding moment 1" },
  { src: "/DSC00717.JPG", alt: "Wedding moment 12" },
  { src: "/DSC00763.JPG", alt: "Wedding moment 13" },
];

export default function Gallery({ onOpen }) {
  const [imageDimensions, setImageDimensions] = useState({});
  const galleryRef = useRef(null);

  // Load image dimensions for better layout detection (optional, for future enhancements)
  useEffect(() => {
    const loadDimensions = async () => {
      const dimensions = {};
      await Promise.all(
        GALLERY_IMAGES.map((img) => {
          return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => {
              dimensions[img.src] = {
                width: image.width,
                height: image.height,
                aspectRatio: image.width / image.height,
              };
              resolve();
            };
            image.onerror = () => {
              // Default to square if image fails to load
              dimensions[img.src] = { width: 1, height: 1, aspectRatio: 1 };
              resolve();
            };
            image.src = img.src;
          });
        })
      );
      setImageDimensions(dimensions);
    };
    loadDimensions();
  }, []);

  return (
    <section className="gallery">
      <motion.header
        className="gallery__header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <p className="gallery__eyebrow">Our Memories</p>
        <h1 className="gallery__title">Pre-Wedding Gallery</h1>
      </motion.header>

      <div className="gallery__container" ref={galleryRef}>
        <div className="gallery__masonry">
          {GALLERY_IMAGES.map((image, index) => {
            const dims = imageDimensions[image.src];
            const aspectRatio = dims?.aspectRatio || 1;
            const isPortrait = aspectRatio < 1;

            return (
              <motion.div
                key={image.src}
                className={`gallery__item ${isPortrait ? "gallery__item--portrait" : "gallery__item--landscape"}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.05,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                <div className="gallery__image-wrapper" onClick={() => onOpen(index)}>
                  <img
                    src={image.src}
                    alt={image.alt || `Gallery image ${index + 1}`}
                    className="gallery__image"
                    loading="lazy"
                    decoding="async"
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


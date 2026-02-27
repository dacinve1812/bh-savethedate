import React from "react";
import { motion } from "framer-motion";

/**
 * ImagePlaceholder Component
 * 
 * Hiển thị placeholder khi ảnh đang load để giữ cấu trúc page
 * 
 * @param {string} type - "portrait" hoặc "landscape" (default: "landscape")
 * @param {string} className - Additional CSS classes
 */
export default function ImagePlaceholder({ type = "landscape", className = "" }) {
  const isPortrait = type === "portrait";
  
  return (
    <div
      className={`image-placeholder ${isPortrait ? "image-placeholder--portrait" : "image-placeholder--landscape"} ${className}`}
      aria-label="Loading image..."
    >
      {/* Skeleton shimmer effect */}
      <div className="image-placeholder__shimmer" />
      
      {/* Optional: Icon or pattern */}
      <div className="image-placeholder__content">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="image-placeholder__icon"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { GALLERY_CATEGORIES, driveItemsToImages } from "../galleryCategories";
import { GALLERY_IMAGES as ALL_IMAGES } from "../galleryImages.generated";
import { GALLERY_ORDER } from "../galleryConfig";

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

function mergeOrderWithAllImages(order) {
  if (!order || order.length === 0) return null;
  const seen = new Set(order);
  const extras = ALL_IMAGES.map((img) => img.src).filter((src) => !seen.has(src));
  return extras.length ? [...order, ...extras] : order;
}

function buildLocalList(order, { mergeNewFromGenerated = true } = {}) {
  if (!order || order.length === 0) return ALL_IMAGES;
  const merged = mergeNewFromGenerated ? mergeOrderWithAllImages(order) : null;
  const srcList = merged ?? order;
  return srcList.map(
    (src) =>
      ALL_IMAGES.find((img) => img.src === src) || {
        src,
        alt: getAltFromSrc(src),
        source: "local",
      }
  );
}

function getPreWeddingImages(storedOrder) {
  const effectiveOrder = storedOrder ?? GALLERY_ORDER;
  const mergeNew = storedOrder == null;
  return buildLocalList(effectiveOrder, { mergeNewFromGenerated: mergeNew });
}

function getCategoryImages(categoryId, storedOrder) {
  const cat = GALLERY_CATEGORIES[categoryId];
  if (!cat) return [];
  if (cat.type === "local") return getPreWeddingImages(storedOrder);
  return driveItemsToImages(cat.driveItems || []);
}

export function useGalleryCategoryImages(categoryId) {
  const [storedOrder, setStoredOrder] = useState(() => getStoredOrder());

  useEffect(() => {
    const sync = () => setStoredOrder(getStoredOrder());
    window.addEventListener("storage", sync);
    window.addEventListener("gallery_order_updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("gallery_order_updated", sync);
    };
  }, []);

  return useMemo(
    () => getCategoryImages(categoryId, storedOrder),
    [categoryId, storedOrder?.join(",")]
  );
}

/** @deprecated use useGalleryCategoryImages('pre-wedding') — kept for InvitationBody lightbox hash */
export function useEffectiveGalleryImages() {
  return useGalleryCategoryImages("pre-wedding");
}

export { STORAGE_KEY as GALLERY_ORDER_STORAGE_KEY, getCategoryImages, getStoredOrder };

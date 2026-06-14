import { GALLERY_CATEGORY_IDS } from "../galleryCategories";

export const DEFAULT_GALLERY_CATEGORY = "pre-wedding";

export function isGalleryCategoryId(id) {
  return GALLERY_CATEGORY_IDS.includes(id);
}

/**
 * Parse location hash (without #) into gallery navigation state.
 * Supports:
 *   gallery
 *   gallery/pre-wedding
 *   gallery/phong-su/photo/12
 *   gallery/photo/12  (legacy → pre-wedding)
 * @returns {{ tab: 'gallery', category: string, photoIndex: number | null } | null}
 */
export function parseGalleryHash(raw) {
  if (!raw) return null;

  if (raw === "gallery") {
    return { tab: "gallery", category: DEFAULT_GALLERY_CATEGORY, photoIndex: null };
  }

  const withCategoryPhoto = raw.match(/^gallery\/([^/]+)\/photo\/(\d+)$/);
  if (withCategoryPhoto) {
    const category = withCategoryPhoto[1];
    const photoIndex = parseInt(withCategoryPhoto[2], 10);
    if (isGalleryCategoryId(category) && photoIndex >= 0) {
      return { tab: "gallery", category, photoIndex };
    }
  }

  const legacyPhoto = raw.match(/^gallery\/photo\/(\d+)$/);
  if (legacyPhoto) {
    const photoIndex = parseInt(legacyPhoto[1], 10);
    if (photoIndex >= 0) {
      return { tab: "gallery", category: DEFAULT_GALLERY_CATEGORY, photoIndex };
    }
  }

  const categoryOnly = raw.match(/^gallery\/([^/]+)$/);
  if (categoryOnly && isGalleryCategoryId(categoryOnly[1])) {
    return { tab: "gallery", category: categoryOnly[1], photoIndex: null };
  }

  return null;
}

/** Build hash segment (no leading #) for gallery tab / album / optional photo. */
export function buildGalleryHash({ category = DEFAULT_GALLERY_CATEGORY, photoIndex = null } = {}) {
  const cat = isGalleryCategoryId(category) ? category : DEFAULT_GALLERY_CATEGORY;
  if (photoIndex != null && photoIndex >= 0) {
    return `gallery/${cat}/photo/${photoIndex}`;
  }
  return `gallery/${cat}`;
}

export function isGalleryHash(raw) {
  return raw === "gallery" || raw.startsWith("gallery/");
}

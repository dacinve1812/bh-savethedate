/**
 * Parse/build gallery hash segments including Photobooth sub-albums.
 */
import {
  GALLERY_CATEGORY_IDS,
  GUEST_MOMENTS_CATEGORY_ID,
  DEFAULT_PHOTOBOOTH_SUB_ALBUM,
  isPhotoboothSubAlbumId,
  isGuestMomentsCategoryId,
} from "../galleryCategories";

export { DEFAULT_PHOTOBOOTH_SUB_ALBUM };

export const DEFAULT_GALLERY_CATEGORY = "pre-wedding";

export function isGalleryCategoryId(id) {
  return GALLERY_CATEGORY_IDS.includes(id);
}

export function isGalleryNavCategoryId(id) {
  return isGalleryCategoryId(id) || isGuestMomentsCategoryId(id);
}

/**
 * @returns {{
 *   tab: 'gallery',
 *   category: string,
 *   subAlbum: string | null,
 *   photoIndex: number | null
 * } | null}
 */
export function parseGalleryHash(raw) {
  if (!raw) return null;

  if (raw === "gallery") {
    return {
      tab: "gallery",
      category: DEFAULT_GALLERY_CATEGORY,
      subAlbum: null,
      photoIndex: null,
    };
  }

  const photoboothSubPhoto = raw.match(/^gallery\/photobooth\/(photobooth|single)\/photo\/(\d+)$/);
  if (photoboothSubPhoto) {
    const photoIndex = parseInt(photoboothSubPhoto[2], 10);
    if (photoIndex >= 0) {
      return {
        tab: "gallery",
        category: "photobooth",
        subAlbum: photoboothSubPhoto[1],
        photoIndex,
      };
    }
  }

  const photoboothPhoto = raw.match(/^gallery\/photobooth\/photo\/(\d+)$/);
  if (photoboothPhoto) {
    const photoIndex = parseInt(photoboothPhoto[1], 10);
    if (photoIndex >= 0) {
      return {
        tab: "gallery",
        category: "photobooth",
        subAlbum: DEFAULT_PHOTOBOOTH_SUB_ALBUM,
        photoIndex,
      };
    }
  }

  const photoboothSub = raw.match(/^gallery\/photobooth\/(photobooth|single)$/);
  if (photoboothSub) {
    return {
      tab: "gallery",
      category: "photobooth",
      subAlbum: photoboothSub[1],
      photoIndex: null,
    };
  }

  if (raw === "gallery/photobooth") {
    return {
      tab: "gallery",
      category: "photobooth",
      subAlbum: DEFAULT_PHOTOBOOTH_SUB_ALBUM,
      photoIndex: null,
    };
  }

  const withCategoryPhoto = raw.match(/^gallery\/([^/]+)\/photo\/(\d+)$/);
  if (withCategoryPhoto) {
    const category = withCategoryPhoto[1];
    const photoIndex = parseInt(withCategoryPhoto[2], 10);
    if (isGalleryCategoryId(category) && category !== "photobooth" && photoIndex >= 0) {
      return { tab: "gallery", category, subAlbum: null, photoIndex };
    }
  }

  const legacyPhoto = raw.match(/^gallery\/photo\/(\d+)$/);
  if (legacyPhoto) {
    const photoIndex = parseInt(legacyPhoto[1], 10);
    if (photoIndex >= 0) {
      return {
        tab: "gallery",
        category: DEFAULT_GALLERY_CATEGORY,
        subAlbum: null,
        photoIndex,
      };
    }
  }

  const categoryOnly = raw.match(/^gallery\/([^/]+)$/);
  if (categoryOnly && isGalleryNavCategoryId(categoryOnly[1])) {
    return {
      tab: "gallery",
      category: categoryOnly[1],
      subAlbum: categoryOnly[1] === "photobooth" ? DEFAULT_PHOTOBOOTH_SUB_ALBUM : null,
      photoIndex: null,
    };
  }

  return null;
}

/** Build hash segment (no leading #). */
export function buildGalleryHash({
  category = DEFAULT_GALLERY_CATEGORY,
  subAlbum = null,
  photoIndex = null,
} = {}) {
  if (isGuestMomentsCategoryId(category)) {
    return `gallery/${GUEST_MOMENTS_CATEGORY_ID}`;
  }

  const cat = isGalleryCategoryId(category) ? category : DEFAULT_GALLERY_CATEGORY;

  if (cat === "photobooth") {
    const sub = isPhotoboothSubAlbumId(subAlbum) ? subAlbum : DEFAULT_PHOTOBOOTH_SUB_ALBUM;
    if (photoIndex != null && photoIndex >= 0) {
      if (sub === DEFAULT_PHOTOBOOTH_SUB_ALBUM) {
        return `gallery/photobooth/photo/${photoIndex}`;
      }
      return `gallery/photobooth/${sub}/photo/${photoIndex}`;
    }
    if (sub === DEFAULT_PHOTOBOOTH_SUB_ALBUM) {
      return "gallery/photobooth";
    }
    return `gallery/photobooth/${sub}`;
  }

  if (photoIndex != null && photoIndex >= 0) {
    return `gallery/${cat}/photo/${photoIndex}`;
  }
  return `gallery/${cat}`;
}

export function isGalleryHash(raw) {
  return raw === "gallery" || raw.startsWith("gallery/");
}

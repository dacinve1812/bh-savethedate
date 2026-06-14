/**
 * Gallery albums. Pre-wedding uses local optimized images.
 * Drive albums: set `driveFolderId` (public folder link). Run `npm run sync-drive-gallery`
 * after adding photos, then rebuild/deploy.
 */
import { parseDriveFileId } from "./utils/galleryImageUtils";
import { GALLERY_DRIVE_ITEMS } from "./galleryDriveItems.generated";

export const GALLERY_CATEGORY_IDS = ["pre-wedding", "phong-su", "truyen-thong", "photobooth"];

/** Album titles always show both Vietnamese and English (not tied to site language). */
export const GALLERY_CATEGORY_TITLES = {
  "pre-wedding": { vi: "Pre-wedding", en: "Pre-wedding" },
  "phong-su": { vi: "Hình Phóng Sự", en: "Photojournalism" },
  "truyen-thong": { vi: "Hình truyền thống", en: "Traditional Wedding Photography" },
  "photobooth": { vi: "Photobooth", en: "Photobooth" },
};

/** @typedef {{ fileId?: string; driveUrl?: string; alt?: string }} DriveItemInput */

/** @param {DriveItemInput} item */
export function driveItemToImage(item, index) {
  const fileId = item.fileId || parseDriveFileId(item.driveUrl);
  if (!fileId) return null;
  return {
    source: "drive",
    driveFileId: fileId,
    src: `drive://${fileId}`,
    alt: item.alt || `Photo ${index + 1}`,
  };
}

/** @param {DriveItemInput[]} items */
export function driveItemsToImages(items = []) {
  return items.map(driveItemToImage).filter(Boolean);
}

export const GALLERY_CATEGORIES = {
  "pre-wedding": {
    id: "pre-wedding",
    type: "local",
    storageKey: "gallery_order",
  },
  "phong-su": {
    id: "phong-su",
    type: "drive",
    driveFolderId: "1kIn80ySGz2Rbq4JX2chgUwlyPTZfqUuV",
    driveFolderUrl:
      "https://drive.google.com/drive/folders/1kIn80ySGz2Rbq4JX2chgUwlyPTZfqUuV?usp=drive_link",
    driveItems: GALLERY_DRIVE_ITEMS["phong-su"] || [],
  },
  "truyen-thong": {
    id: "truyen-thong",
    type: "drive",
    driveFolderId: "1AH_To1HH-WY6lVo1eVxm5K3kVqNV5rga",
    driveFolderUrl:
      "https://drive.google.com/drive/folders/1AH_To1HH-WY6lVo1eVxm5K3kVqNV5rga?usp=sharing",
    driveItems: GALLERY_DRIVE_ITEMS["truyen-thong"] || [],
  },
  photobooth: {
    id: "photobooth",
    type: "drive",
    driveItems: [],
  },
};

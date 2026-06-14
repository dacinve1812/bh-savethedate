/**

 * Gallery albums. Pre-wedding uses local optimized images.

 * Drive albums: set `driveFolderId` (public folder link). Run `npm run sync-drive-gallery`

 * after adding photos, then rebuild/deploy.

 */

import { parseDriveFileId } from "./utils/galleryImageUtils";

import { GALLERY_DRIVE_ITEMS } from "./galleryDriveItems.generated";



export const GALLERY_CATEGORY_IDS = ["pre-wedding", "phong-su", "truyen-thong", "photobooth"];

/** Guest-uploaded moments (Event Highlights) — shown in gallery sub-nav, not a Drive album. */
export const GUEST_MOMENTS_CATEGORY_ID = "guest-moments";

export const GALLERY_SUBNAV_TAB_IDS = [...GALLERY_CATEGORY_IDS, GUEST_MOMENTS_CATEGORY_ID];

export function isGuestMomentsCategoryId(id) {
  return id === GUEST_MOMENTS_CATEGORY_ID;
}

export const PHOTOBOOTH_SUB_ALBUM_IDS = ["photobooth", "single"];

export const DEFAULT_PHOTOBOOTH_SUB_ALBUM = "photobooth";



export function isPhotoboothSubAlbumId(id) {

  return PHOTOBOOTH_SUB_ALBUM_IDS.includes(id);

}



/** Album titles always show both Vietnamese and English (not tied to site language). */

export const GALLERY_CATEGORY_TITLES = {

  "pre-wedding": { vi: "Pre-wedding", en: "Pre-wedding" },

  "phong-su": { vi: "Hình Phóng Sự", en: "Photojournalism" },

  "truyen-thong": { vi: "Hình truyền thống", en: "Traditional Wedding Photography" },

  photobooth: { vi: "Photobooth", en: "Photobooth" },

  "guest-moments": { vi: "Khoảnh khắc từ khách mời", en: "Guest Moments" },

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

    type: "drive-subalbums",

    defaultSubAlbum: DEFAULT_PHOTOBOOTH_SUB_ALBUM,

    subAlbums: {

      photobooth: {

        driveFolderId: "1nd_b-gpdLvmeL-Hf1nxtXBqyfoyl6913",

        driveFolderUrl:

          "https://drive.google.com/drive/folders/1nd_b-gpdLvmeL-Hf1nxtXBqyfoyl6913",

        driveItems: GALLERY_DRIVE_ITEMS["photobooth"] || [],

      },

      single: {

        driveFolderId: "1QxV6nIVpZJqCnh-wORPvGmQ6D5edOZ9l",

        driveFolderUrl:

          "https://drive.google.com/drive/folders/1QxV6nIVpZJqCnh-wORPvGmQ6D5edOZ9l",

        driveItems: GALLERY_DRIVE_ITEMS["photobooth-single"] || [],

      },

    },

  },

};



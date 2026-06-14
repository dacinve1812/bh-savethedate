/** Thumbnail widths for local images — must match scripts/optimizeImages.cjs */
export const THUMB_WIDTHS = [400, 600, 800, 1000, 1200];
/** Drive grid srcset widths (Google thumbnail API). */
export const DRIVE_GRID_WIDTHS = [600, 800, 1000, 1200];

/** Mobile vs desktop: desktop (>495px) loads sharper assets (WiFi). */
export const GRID_BREAKPOINT_PX = 495;
export const GRID_THUMB_WIDTH_MOBILE = 600;
export const GRID_THUMB_WIDTH_DESKTOP = 1200;
export const VIEWER_THUMB_MAX_MOBILE = 1400;
export const VIEWER_THUMB_MAX_DESKTOP = 2400;
/** Max width requested for zoom / full-HD tier (Drive thumbnail + lh3). */
export const VIEWER_MAX_WIDTH = 4096;

const THUMB_EXT = ".webp";

export function isDesktopViewport(viewportWidth) {
  return viewportWidth > GRID_BREAKPOINT_PX;
}

export function getGridThumbWidth(viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1024) {
  return isDesktopViewport(viewportWidth) ? GRID_THUMB_WIDTH_DESKTOP : GRID_THUMB_WIDTH_MOBILE;
}

export function getViewerThumbMax(viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1024) {
  return isDesktopViewport(viewportWidth) ? VIEWER_THUMB_MAX_DESKTOP : VIEWER_THUMB_MAX_MOBILE;
}

export function getGalleryThumbSizes() {
  return `(max-width: ${GRID_BREAKPOINT_PX}px) 50vw, 33vw`;
}

function uniqueUrls(urls) {
  return [...new Set(urls.filter(Boolean))];
}

export function parseDriveFileId(urlOrId) {
  if (!urlOrId) return null;
  let s = String(urlOrId).trim();
  if (s.startsWith("drive://")) s = s.slice("drive://".length);
  if (/^[a-zA-Z0-9_-]{20,}$/.test(s) && !s.includes("/") && !s.includes(".")) return s;
  const fileMatch = s.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) return fileMatch[1];
  const idMatch = s.match(/[?&]id=([^&]+)/);
  if (idMatch) return idMatch[1];
  return null;
}

export function isDriveImage(image) {
  return image?.source === "drive" || Boolean(image?.driveFileId) || String(image?.src || "").startsWith("drive://");
}

export function getImageKey(image, categoryId = "", subAlbumId = "") {
  const id = image?.driveFileId || parseDriveFileId(image?.src) || image?.src || "";
  if (subAlbumId) return `${categoryId}/${subAlbumId}:${id}`;
  return `${categoryId}:${id}`;
}

function driveThumbnailUrl(fileId, width) {
  const id = parseDriveFileId(fileId);
  if (!id) return null;
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${width}`;
}

function driveLh3Url(fileId, width) {
  const id = parseDriveFileId(fileId);
  if (!id) return null;
  return `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}=w${width}`;
}

/** Local optimized paths (public/images/thumbnails + full). */
export function getOptimizedImagePaths(originalSrc) {
  if (!originalSrc || isDriveImage({ src: originalSrc })) {
    return { thumbnail: null, thumbnailMaxRes: null, fullSize: null, thumbnailSrcSet: null, thumbnailSizes: null };
  }

  let relativePath = originalSrc.startsWith("/") ? originalSrc.substring(1) : originalSrc;
  relativePath = relativePath.replace(/^public\//, "");
  const fileName = relativePath.split("/").pop() || relativePath;
  const ext = fileName.match(/\.[^/.]+$/)?.[0]?.toLowerCase() || "";
  const isPng = ext === ".png";
  const safeBaseName = fileName.replace(/[^a-zA-Z0-9]/g, "_").replace(/\.[^/.]+$/, "");

  const baseThumb = `/images/thumbnails/${safeBaseName}`;
  const thumbnail = `${baseThumb}-${GRID_THUMB_WIDTH_MOBILE}${THUMB_EXT}`;
  const thumbnailMaxRes = `${baseThumb}-${Math.max(...THUMB_WIDTHS)}${THUMB_EXT}`;
  const fullPath = `/images/full/${safeBaseName}${isPng ? ".png" : ".jpg"}`;
  const thumbnailSrcSet = THUMB_WIDTHS.map((w) => `${baseThumb}-${w}${THUMB_EXT} ${w}w`).join(", ");
  const thumbnailSizes = getGalleryThumbSizes();
  return { thumbnail, thumbnailMaxRes, fullSize: fullPath, thumbnailSrcSet, thumbnailSizes };
}

/** Drive: responsive grid srcset + viewer/download URLs. */
export function getDriveImagePaths(fileId) {
  const id = parseDriveFileId(fileId);
  if (!id) {
    return { thumbnail: null, thumbnailMaxRes: null, fullSize: null, thumbnailSrcSet: null, thumbnailSizes: null };
  }
  const thumbnailSrcSet = DRIVE_GRID_WIDTHS.map(
    (w) => `${driveThumbnailUrl(id, w)} ${w}w`
  ).join(", ");
  return {
    thumbnail: driveThumbnailUrl(id, GRID_THUMB_WIDTH_MOBILE),
    thumbnailMaxRes: driveThumbnailUrl(id, VIEWER_THUMB_MAX_MOBILE),
    fullSize: `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`,
    thumbnailSrcSet,
    thumbnailSizes: getGalleryThumbSizes(),
  };
}

/** Fallback URLs when primary Drive thumbnail is blocked. */
export function getDriveThumbnailFallbacks(fileId, width = GRID_THUMB_WIDTH_MOBILE) {
  const id = parseDriveFileId(fileId);
  if (!id) return [];
  return uniqueUrls([
    driveLh3Url(id, width),
    driveThumbnailUrl(id, width),
    `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`,
  ]);
}

/** Props required for embedding public Drive images on external sites. */
export function getDriveImageEmbedProps(image) {
  if (!isDriveImage(image)) return {};
  return { referrerPolicy: "no-referrer" };
}

export function getGalleryImageAlt(image, index) {
  const alt = String(image?.alt || "").trim();
  if (!alt || /^jpe?g image$/i.test(alt)) return `Gallery image ${index + 1}`;
  return alt;
}

export function resolveImagePaths(image) {
  if (isDriveImage(image)) {
    const id = image.driveFileId || parseDriveFileId(image.src);
    return getDriveImagePaths(id);
  }
  if (image.thumbnail || image.fullSize) {
    return {
      thumbnail: image.thumbnail || image.src,
      thumbnailMaxRes: image.thumbnailMaxRes || image.fullSize || image.src,
      fullSize: image.fullSize || image.src,
      thumbnailSrcSet: image.thumbnailSrcSet || null,
      thumbnailSizes: image.thumbnailSizes || getGalleryThumbSizes(),
    };
  }
  return getOptimizedImagePaths(image.src);
}

export function getThumbnailSrc(image, viewportWidth) {
  if (image?.thumbnail) return image.thumbnail;
  const paths = resolveImagePaths(image);
  if (isDriveImage(image) && viewportWidth != null) {
    return driveThumbnailUrl(image.driveFileId || image.src, getGridThumbWidth(viewportWidth)) || paths.thumbnail || "";
  }
  return paths.thumbnail || image?.src || "";
}

export function getFullSizeSrc(image) {
  if (image?.fullSize) return image.fullSize;
  const paths = resolveImagePaths(image);
  return paths.fullSize || image?.src || "";
}

/** Fast preview — sharp at fit-to-screen, loads quickly. */
export function getViewerPreviewSrc(image, viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1024) {
  const paths = resolveImagePaths(image);
  if (isDriveImage(image)) {
    const id = image.driveFileId || parseDriveFileId(image.src);
    return driveThumbnailUrl(id, getViewerThumbMax(viewportWidth)) || paths.thumbnail || "";
  }
  return paths.thumbnailMaxRes || paths.thumbnail || image?.src || "";
}

/** Maximum quality for zoom / background HD upgrade. */
export function getViewerMaxSrc(image) {
  const paths = resolveImagePaths(image);
  if (isDriveImage(image)) {
    const id = image.driveFileId || parseDriveFileId(image.src);
    if (!id) return paths.fullSize || "";
    return (
      driveLh3Url(id, VIEWER_MAX_WIDTH) ||
      driveThumbnailUrl(id, VIEWER_MAX_WIDTH) ||
      `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}` ||
      paths.fullSize ||
      ""
    );
  }
  return paths.fullSize || paths.thumbnailMaxRes || image?.src || "";
}

/** Preview fallbacks (display size, fast). */
export function getViewerPreviewCandidates(image, viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1024) {
  if (isDriveImage(image)) {
    const id = image.driveFileId || parseDriveFileId(image.src);
    if (!id) return [];
    const displayW = getViewerThumbMax(viewportWidth);
    const midW = VIEWER_THUMB_MAX_MOBILE;
    return uniqueUrls([
      driveThumbnailUrl(id, displayW),
      driveLh3Url(id, displayW),
      driveThumbnailUrl(id, midW),
      driveLh3Url(id, midW),
      `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`,
      driveThumbnailUrl(id, GRID_THUMB_WIDTH_DESKTOP),
    ]);
  }
  const paths = resolveImagePaths(image);
  return uniqueUrls([
    getViewerPreviewSrc(image, viewportWidth),
    paths.thumbnailMaxRes,
    paths.thumbnail,
    image?.src,
  ]);
}

/** Max-quality fallbacks (zoom / HD tier). */
export function getViewerMaxCandidates(image) {
  if (isDriveImage(image)) {
    const id = image.driveFileId || parseDriveFileId(image.src);
    if (!id) return [];
    return uniqueUrls([
      driveLh3Url(id, VIEWER_MAX_WIDTH),
      driveThumbnailUrl(id, VIEWER_MAX_WIDTH),
      driveLh3Url(id, VIEWER_THUMB_MAX_DESKTOP),
      driveThumbnailUrl(id, VIEWER_THUMB_MAX_DESKTOP),
      `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`,
      driveLh3Url(id, VIEWER_THUMB_MAX_MOBILE),
      driveThumbnailUrl(id, VIEWER_THUMB_MAX_MOBILE),
    ]);
  }
  const paths = resolveImagePaths(image);
  return uniqueUrls([paths.fullSize, paths.thumbnailMaxRes, image?.src]);
}

export function getViewerDisplaySrc(image, viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1024) {
  return getViewerPreviewSrc(image, viewportWidth);
}

/** @deprecated Prefer getViewerPreviewCandidates / getViewerMaxCandidates */
export function getViewerSrcCandidates(image, viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1024) {
  return uniqueUrls([
    ...getViewerPreviewCandidates(image, viewportWidth),
    ...getViewerMaxCandidates(image),
  ]);
}

const LS_KEY = "gallery_likes_v1";

function readSet() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeSet(set) {
  localStorage.setItem(LS_KEY, JSON.stringify([...set]));
}

export function getGalleryLikes() {
  return readSet();
}

export function isImageLiked(imageKey) {
  return readSet().has(imageKey);
}

export function toggleGalleryLike(imageKey) {
  const set = readSet();
  if (set.has(imageKey)) set.delete(imageKey);
  else set.add(imageKey);
  writeSet(set);
  window.dispatchEvent(new Event("gallery_likes_updated"));
  return set.has(imageKey);
}

export function countGalleryLikes(keysInCategory = []) {
  const set = readSet();
  if (!keysInCategory.length) return 0;
  return keysInCategory.filter((k) => set.has(k)).length;
}

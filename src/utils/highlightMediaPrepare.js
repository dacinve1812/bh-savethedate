/** Story-style limits — short clips for fast upload & playback. */
export const STORY_MAX_DURATION_SEC = 30;
/** Max dimensions before re-encode (1080×1920 vertical). */
export const STORY_MAX_WIDTH = 1080;
export const STORY_MAX_HEIGHT = 1920;
/** Upload original when within duration + size (clearest quality). */
export const STORY_MAX_ORIGINAL_MB = 40;
export const STORY_TARGET_VIDEO_BITS = 2_800_000;
export const STORY_MAX_INPUT_MB = 80;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getSupportedVideoMime() {
  const types = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
  for (const t of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
  }
  return "video/webm";
}

function extForMime(mime) {
  if (mime.includes("mp4")) return "mp4";
  return "webm";
}

/**
 * @param {{ percent?: number; label?: string }} p
 * @param {(p: { percent: number; label: string }) => void} [onProgress]
 */
function reportPrepare(onProgress, percent, label) {
  onProgress?.({ phase: "prepare", percent: Math.min(50, Math.max(0, percent)), label });
}

async function loadVideoFromFile(file) {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = url;
  await new Promise((resolve, reject) => {
    const onErr = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this video."));
    };
    video.onloadedmetadata = () => resolve();
    video.onerror = onErr;
  });
  return { video, url };
}

async function seekVideo(video, time) {
  const t = Math.max(0, Math.min(time, video.duration || time));
  if (Math.abs(video.currentTime - t) < 0.04) return;
  await new Promise((resolve) => {
    video.onseeked = () => resolve();
    video.currentTime = t;
  });
}

/**
 * @param {HTMLVideoElement} video
 * @param {number} [atSec]
 */
export async function captureVideoThumbnail(video, atSec = 0.5) {
  const t = Math.min(Math.max(0, atSec), Math.max(0, (video.duration || 1) - 0.05));
  await seekVideo(video, t);
  const maxW = 720;
  const scale = Math.min(1, maxW / (video.videoWidth || maxW));
  const w = Math.max(1, Math.round((video.videoWidth || maxW) * scale));
  const h = Math.max(1, Math.round((video.videoHeight || maxW) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create thumbnail.");
  ctx.drawImage(video, 0, 0, w, h);
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Thumbnail failed"))), "image/jpeg", 0.82);
  });
  return new File([blob], "thumb.jpg", { type: "image/jpeg" });
}

/**
 * Re-encode / trim to story limits using canvas + MediaRecorder.
 * @param {File} file
 * @param {(p: { percent: number; label: string }) => void} [onProgress]
 */
async function transcodeStoryVideo(file, onProgress) {
  reportPrepare(onProgress, 5, "Reading video…");
  const { video, url } = await loadVideoFromFile(file);

  try {
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("Invalid video length.");
    }
    if (duration > STORY_MAX_DURATION_SEC + 0.25) {
      throw new Error(
        `Video is too long (${Math.ceil(duration)}s). Max ${STORY_MAX_DURATION_SEC}s — like a story clip.`
      );
    }

    const clipDuration = duration;
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 360;
    const scale = Math.min(1, STORY_MAX_WIDTH / vw, STORY_MAX_HEIGHT / vh);
    const w = Math.max(2, Math.round(vw * scale) & ~1);
    const h = Math.max(2, Math.round(vh * scale) & ~1);

    reportPrepare(onProgress, 12, "Creating thumbnail…");
    const thumbFile = await captureVideoThumbnail(video, Math.min(0.6, clipDuration * 0.15));

    const withinOriginalLimits =
      file.size <= STORY_MAX_ORIGINAL_MB * 1024 * 1024 &&
      vw <= STORY_MAX_WIDTH &&
      vh <= STORY_MAX_HEIGHT;

    if (withinOriginalLimits || typeof MediaRecorder === "undefined") {
      if (file.size > STORY_MAX_INPUT_MB * 1024 * 1024) {
        throw new Error(`Video is too large (max ~${STORY_MAX_INPUT_MB} MB on this device).`);
      }
      reportPrepare(onProgress, 48, "Ready to upload");
      return { file, thumbFile, durationSec: clipDuration, mimeType: file.type || "video/mp4" };
    }

    // Keep phone MP4/MOV as-is — avoids WebM which iOS Safari cannot play natively.
    const isPhoneVideo = /^video\/(mp4|quicktime|3gpp)/i.test(file.type || "");
    if (isPhoneVideo && file.size <= STORY_MAX_INPUT_MB * 1024 * 1024) {
      reportPrepare(onProgress, 48, "Ready to upload");
      return { file, thumbFile, durationSec: clipDuration, mimeType: file.type || "video/mp4" };
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Could not process video.");

    const mimeType = getSupportedVideoMime();
    const fps = 24;
    const stream = canvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: STORY_TARGET_VIDEO_BITS,
    });
    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data?.size) chunks.push(e.data);
    };

    const blob = await new Promise((resolve, reject) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      recorder.onerror = () => reject(new Error("Video optimization failed. Try a shorter MP4."));
      recorder.start(250);

      video.currentTime = 0;
      video.muted = true;
      const playPromise = video.play();
      if (playPromise?.catch) playPromise.catch(() => {});

      const started = performance.now();
      const tick = () => {
        const elapsed = (performance.now() - started) / 1000;
        if (elapsed >= clipDuration) {
          video.pause();
          recorder.stop();
          return;
        }
        ctx.drawImage(video, 0, 0, w, h);
        const pct = 12 + Math.round((elapsed / clipDuration) * 36);
        reportPrepare(onProgress, pct, "Optimizing video…");
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    reportPrepare(onProgress, 50, "Ready to upload");
    const ext = extForMime(mimeType);
    const outFile = new File([blob], `story-${Date.now()}.${ext}`, { type: mimeType });
    return { file: outFile, thumbFile, durationSec: clipDuration, mimeType };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * @param {File} file
 * @param {(p: { percent: number; label: string }) => void} [onProgress]
 */
async function compressImageFile(file, onProgress) {
  reportPrepare(onProgress, 8, "Optimizing photo…");
  if (!file.type.startsWith("image/") || file.size < 380_000) {
    reportPrepare(onProgress, 50, "Ready to upload");
    return { file, thumbFile: null, durationSec: 0, mimeType: file.type || "image/jpeg" };
  }

  const bitmap = await createImageBitmap(file);
  const maxW = 1920;
  const scale = Math.min(1, maxW / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    reportPrepare(onProgress, 50, "Ready to upload");
    return { file, thumbFile: null, durationSec: 0, mimeType: file.type };
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  reportPrepare(onProgress, 35, "Optimizing photo…");

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not optimize photo."))),
      "image/jpeg",
      0.86
    );
  });
  reportPrepare(onProgress, 50, "Ready to upload");
  const out = new File([blob], file.name.replace(/\.\w+$/i, "") + ".jpg", { type: "image/jpeg" });
  return { file: out, thumbFile: null, durationSec: 0, mimeType: "image/jpeg" };
}

/**
 * @param {File} file
 * @param {(p: { phase?: string; percent: number; label: string }) => void} [onProgress]
 */
export async function prepareHighlightFile(file, onProgress) {
  if (file.size > STORY_MAX_INPUT_MB * 1024 * 1024) {
    throw new Error(`File is too large (max ~${STORY_MAX_INPUT_MB} MB).`);
  }

  if (file.type.startsWith("image/")) {
    return compressImageFile(file, onProgress);
  }

  if (file.type.startsWith("video/")) {
    return transcodeStoryVideo(file, onProgress);
  }

  throw new Error("Only photos and short videos are supported.");
}

export function storyHintText() {
  return `Photos any size · Videos up to ${STORY_MAX_DURATION_SEC}s`;
}

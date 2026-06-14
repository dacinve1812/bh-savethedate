import React, { useEffect, useState } from "react";
import {
  driveVideoPreviewUrl,
  driveImageThumbUrl,
  highlightVideoPosterUrl,
} from "../utils/eventHighlightsApi";
import { getDriveThumbnailFallbacks, getGridThumbWidth } from "../utils/galleryImageUtils";

function getVideoPosterSrc(item, width) {
  return (
    highlightVideoPosterUrl(item, width) ||
    (item.fileId && !String(item.fileId).startsWith("local-")
      ? driveImageThumbUrl(item.thumbFileId || item.fileId, width)
      : "")
  );
}

function formatDuration(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  if (s <= 0) return "";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `0:${String(r).padStart(2, "0")}`;
}

function GuestMomentVideoIframe({ fileId }) {
  return (
    <div className="guest-moment-video guest-moment-video--full guest-moment-video--iframe">
      <iframe
        title="Guest video"
        src={driveVideoPreviewUrl(fileId)}
        className="guest-moment-video__iframe"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

/**
 * Gallery thumb or lightbox player — story-style 9:16; full view uses Google Drive embed.
 */
export default function HighlightVideoPlayer({ item, variant = "thumb", onMediaLoad, priority = false }) {
  const isFull = variant === "full";
  const isLocal = item.fileId && String(item.fileId).startsWith("local-");
  const thumbWidth = getGridThumbWidth();
  const posterSrc = getVideoPosterSrc(item, isFull ? 900 : thumbWidth);
  const durationSec = item.durationSec || 0;
  const durationLabel = formatDuration(durationSec);
  const posterFallbacksRef = React.useRef(
    !isLocal && item.fileId
      ? getDriveThumbnailFallbacks(item.thumbFileId || item.fileId, thumbWidth)
      : []
  );
  const [posterUrl, setPosterUrl] = useState(posterSrc);

  useEffect(() => {
    setPosterUrl(posterSrc);
    posterFallbacksRef.current =
      !isLocal && item.fileId
        ? getDriveThumbnailFallbacks(item.thumbFileId || item.fileId, thumbWidth)
        : [];
  }, [item.fileId, isFull, isLocal, thumbWidth, posterSrc]);

  useEffect(() => {
    if (isFull || posterSrc) return;
    onMediaLoad?.(9, 16);
  }, [isFull, posterSrc, onMediaLoad, item.fileId]);

  const handlePosterLoad = (e) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      onMediaLoad?.(img.naturalWidth, img.naturalHeight);
    }
  };

  const handlePosterError = (e) => {
    const img = e.currentTarget;
    const next = posterFallbacksRef.current.shift();
    if (next && img.src !== next) {
      img.src = next;
      return;
    }
    onMediaLoad?.(9, 16);
  };

  if (isLocal && item._dataUrl) {
    if (!isFull) {
      return (
        <video
          src={item._dataUrl}
          poster={item._thumbDataUrl || undefined}
          playsInline
          className="guest-moment-video guest-moment-video--thumb"
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            if (v.videoWidth > 0) onMediaLoad?.(v.videoWidth, v.videoHeight);
          }}
        />
      );
    }
    return (
      <div className="guest-moment-video guest-moment-video--full">
        <video
          src={item._dataUrl}
          poster={item._thumbDataUrl || undefined}
          controls
          playsInline
          className="guest-moment-video__player guest-moment-video__player--ready"
        />
      </div>
    );
  }

  if (!item.fileId) return null;

  if (isFull) {
    return <GuestMomentVideoIframe fileId={item.fileId} />;
  }

  return (
    <div className="guest-moment-video guest-moment-video--thumb">
      {posterUrl ? (
        <img
          src={posterUrl}
          alt=""
          className="guest-moment-video__poster"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={handlePosterLoad}
          onError={(e) => {
            const next = posterFallbacksRef.current.shift();
            if (next && e.currentTarget.src !== next) {
              e.currentTarget.src = next;
              return;
            }
            handlePosterError(e);
          }}
        />
      ) : (
        <div className="guest-moment-video__poster guest-moment-video__poster--empty" aria-hidden />
      )}
      <div className="guest-moment-video__play" aria-hidden>
        <span className="guest-moment-video__play-icon">▶</span>
      </div>
      {durationLabel && (
        <span className="guest-moment-video__duration">{durationLabel}</span>
      )}
    </div>
  );
}

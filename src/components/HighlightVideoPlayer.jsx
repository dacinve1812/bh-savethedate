import React, { useEffect, useMemo, useState } from "react";
import {
  driveVideoPreviewUrl,
  driveImageThumbUrl,
  highlightVideoPosterUrl,
  resolveHighlightVideoSources,
  canPlayHighlightVideoNative,
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

function formatPlaybackTime(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function useMobileViewport() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

function GuestMomentFullVideo({ sources, poster, mimeType, onAllSourcesFailed, isMobile = false }) {
  const videoRef = React.useRef(null);
  const errorTimerRef = React.useRef(null);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const src = sources[sourceIndex] || "";
  const videoType = mimeType ? String(mimeType).split(";")[0] : undefined;

  useEffect(() => {
    setSourceIndex(0);
    setReady(false);
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    setSeeking(false);
  }, [sources]);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  const clearErrorTimer = () => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
  };

  const handleVideoError = () => {
    clearErrorTimer();
    errorTimerRef.current = setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;
      if (video.networkState === HTMLMediaElement.NETWORK_LOADING) return;
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return;
      if (sourceIndex + 1 < sources.length) {
        setSourceIndex((i) => i + 1);
        return;
      }
      onAllSourcesFailed?.();
    }, 1200);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const seekTo = (value) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(value)) return;
    video.currentTime = value;
    setCurrent(value);
  };

  return (
    <div className="guest-moment-video guest-moment-video--full guest-moment-video--custom-controls">
      <video
        key={src}
        ref={videoRef}
        playsInline
        preload={isMobile ? "auto" : "metadata"}
        className={`guest-moment-video__player ${ready ? "guest-moment-video__player--ready" : ""}`}
        onClick={togglePlay}
        onLoadedData={() => {
          clearErrorTimer();
          setReady(true);
        }}
        onLoadedMetadata={(e) => {
          clearErrorTimer();
          setDuration(e.currentTarget.duration || 0);
          setReady(true);
        }}
        onCanPlay={() => clearErrorTimer()}
        onTimeUpdate={(e) => {
          if (!seeking) setCurrent(e.currentTarget.currentTime);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={handleVideoError}
      >
        <source src={src} type={videoType} />
      </video>

      {!ready && poster && (
        <img
          src={poster}
          alt=""
          className="guest-moment-video__poster guest-moment-video__poster--full-loading"
          referrerPolicy="no-referrer"
        />
      )}

      {!playing && ready && (
        <button
          type="button"
          className="guest-moment-video__center-play"
          onClick={togglePlay}
          aria-label="Play video"
        >
          <span className="guest-moment-video__center-play-icon" aria-hidden>
            ▶
          </span>
        </button>
      )}

      <div className="guest-moment-video__bar" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="guest-moment-video__bar-btn"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
        >
          <span className="guest-moment-video__bar-btn-icon" aria-hidden>
            {playing ? "⏸" : "▶"}
          </span>
        </button>
        <input
          type="range"
          className="guest-moment-video__seek"
          min={0}
          max={duration || 0}
          step={0.05}
          value={Math.min(current, duration || 0)}
          onChange={(e) => {
            setSeeking(true);
            seekTo(Number(e.target.value));
          }}
          onPointerUp={() => setSeeking(false)}
          onPointerCancel={() => setSeeking(false)}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={duration || 0}
          aria-valuenow={current}
        />
        <span className="guest-moment-video__time">
          {formatPlaybackTime(current)}
          {duration > 0 ? ` / ${formatPlaybackTime(duration)}` : ""}
        </span>
      </div>
    </div>
  );
}

function GuestMomentVideoFallback({ fileId, poster, openLabel = "Xem video" }) {
  return (
    <div className="guest-moment-video guest-moment-video--full guest-moment-video--fallback">
      {poster ? (
        <img src={poster} alt="" className="guest-moment-video__poster" referrerPolicy="no-referrer" />
      ) : (
        <div className="guest-moment-video__poster guest-moment-video__poster--empty" aria-hidden />
      )}
      <a
        href={driveVideoPreviewUrl(fileId)}
        target="_blank"
        rel="noopener noreferrer"
        className="guest-moment-video__fallback-play"
      >
        <span className="guest-moment-video__center-play-icon" aria-hidden>
          ▶
        </span>
        <span className="guest-moment-video__fallback-label">{openLabel}</span>
      </a>
    </div>
  );
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
 * Gallery thumb or lightbox player — story-style 9:16, native video in full view.
 */
export default function HighlightVideoPlayer({ item, variant = "thumb", onMediaLoad, priority = false }) {
  const isFull = variant === "full";
  const isLocal = item.fileId && String(item.fileId).startsWith("local-");
  const thumbWidth = getGridThumbWidth();
  const posterSrc = getVideoPosterSrc(item, isFull ? 900 : thumbWidth);
  const durationSec = item.durationSec || 0;
  const durationLabel = formatDuration(durationSec);
  const isMobile = useMobileViewport();
  const posterFallbacksRef = React.useRef(
    !isLocal && item.fileId
      ? getDriveThumbnailFallbacks(item.thumbFileId || item.fileId, thumbWidth)
      : []
  );

  const nativeSupported = useMemo(
    () => isLocal || canPlayHighlightVideoNative(item.mimeType),
    [isLocal, item.mimeType]
  );
  const [resolvedSources, setResolvedSources] = useState([]);
  const [sourcesReady, setSourcesReady] = useState(!isFull || isLocal);
  const [playbackMode, setPlaybackMode] = useState("native");
  const [posterUrl, setPosterUrl] = useState(posterSrc);
  const activeSources = resolvedSources;

  useEffect(() => {
    if (!isFull || isLocal || !item.fileId) return undefined;
    let cancelled = false;
    setSourcesReady(false);
    setResolvedSources([]);
    resolveHighlightVideoSources(item.fileId, { preferViewFirst: isMobile }).then((urls) => {
      if (cancelled) return;
      setResolvedSources(urls);
      setSourcesReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [isFull, isLocal, item.fileId, isMobile]);

  useEffect(() => {
    setPlaybackMode(nativeSupported ? "native" : "iframe");
    setPosterUrl(posterSrc);
    posterFallbacksRef.current =
      !isLocal && item.fileId
        ? getDriveThumbnailFallbacks(item.thumbFileId || item.fileId, thumbWidth)
        : [];
  }, [item.fileId, item.mimeType, isFull, isLocal, thumbWidth, posterSrc, nativeSupported]);

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
      <GuestMomentFullVideo
        sources={[item._dataUrl]}
        poster={item._thumbDataUrl}
        mimeType={item.mimeType || "video/mp4"}
        onAllSourcesFailed={() => {}}
        isMobile={isMobile}
      />
    );
  }

  if (!item.fileId) return null;

  if (!isFull) {
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

  if (playbackMode === "fallback") {
    return <GuestMomentVideoFallback fileId={item.fileId} poster={posterSrc} />;
  }

  if (playbackMode === "iframe") {
    return <GuestMomentVideoIframe fileId={item.fileId} />;
  }

  if (!sourcesReady) {
    return (
      <div className="guest-moment-video guest-moment-video--full guest-moment-video--fallback">
        {posterSrc ? (
          <img src={posterSrc} alt="" className="guest-moment-video__poster" referrerPolicy="no-referrer" />
        ) : (
          <div className="guest-moment-video__poster guest-moment-video__poster--empty" aria-hidden />
        )}
      </div>
    );
  }

  if (!activeSources.length) {
    return <GuestMomentVideoFallback fileId={item.fileId} poster={posterSrc} />;
  }

  return (
    <GuestMomentFullVideo
      sources={activeSources}
      poster={posterSrc}
      mimeType={item.mimeType}
      isMobile={isMobile}
      onAllSourcesFailed={() => {
        if (!nativeSupported) {
          setPlaybackMode("iframe");
          return;
        }
        if (isMobile) setPlaybackMode("fallback");
        else setPlaybackMode("iframe");
      }}
    />
  );
}

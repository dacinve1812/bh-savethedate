import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { ImageIcon, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "./contexts/LanguageContext";
import { translations } from "./translations";
import {
  GALLERY_CATEGORY_TITLES,
  GALLERY_SUBNAV_TAB_IDS,
  GUEST_MOMENTS_CATEGORY_ID,
  PHOTOBOOTH_SUB_ALBUM_IDS,
  DEFAULT_PHOTOBOOTH_SUB_ALBUM,
} from "./galleryCategories";
import GuestMomentsPanel from "./components/GuestMomentsPanel";
import { useGalleryCategoryImages } from "./hooks/useGalleryCategoryImages";
import {
  resolveImagePaths,
  getThumbnailSrc,
  getFullSizeSrc,
  getImageKey,
  getDriveImageEmbedProps,
  getDriveThumbnailFallbacks,
  getGalleryImageAlt,
  getGridThumbWidth,
  isDriveImage,
} from "./utils/galleryImageUtils";
import {
  getGalleryLikes,
  isImageLiked,
  toggleGalleryLike,
  countGalleryLikes,
} from "./utils/galleryLikes";
import { useMasonryRowSpan } from "./utils/masonryLayout";

export { getOptimizedImagePaths, resolveImagePaths, getThumbnailSrc, getFullSizeSrc } from "./utils/galleryImageUtils";
export { useEffectiveGalleryImages, useGalleryCategoryImages } from "./hooks/useGalleryCategoryImages";
export { GALLERY_ORDER_STORAGE_KEY as STORAGE_KEY } from "./hooks/useGalleryCategoryImages";

function GalleryCategoryTitle({ categoryId }) {
  const titles = GALLERY_CATEGORY_TITLES[categoryId];
  if (!titles) return null;
  const same =
    titles.vi.trim().toLowerCase() === titles.en.trim().toLowerCase();

  return (
    <div className="gallery__title-block">
      {!same && <p className="gallery__title-eyebrow">{titles.vi}</p>}
      <h1 className="gallery__title">{same ? titles.vi : titles.en}</h1>
    </div>
  );
}

function GallerySubNav({
  category,
  onCategoryChange,
  totalCount,
  likeCount,
  showLikedOnly,
  onToggleLikedFilter,
  onShowAllPhotos,
  tabs,
  showLikeFilter = true,
}) {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const tabsScrollRef = useRef(null);
  const tabRefs = useRef({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollHints = useCallback(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(maxScroll > 2 && el.scrollLeft < maxScroll - 2);
  }, []);

  const scrollActiveTabIntoView = useCallback(() => {
    const container = tabsScrollRef.current;
    const tabEl = tabRefs.current[category];
    if (!container || !tabEl) return;
    container.scrollTo({
      left: Math.max(0, tabEl.offsetLeft - 4),
      behavior: "smooth",
    });
  }, [category]);

  const scrollTabsBy = useCallback((direction) => {
    const el = tabsScrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * Math.max(120, el.clientWidth * 0.55),
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    scrollActiveTabIntoView();
    const tId = window.setTimeout(updateScrollHints, 320);
    return () => window.clearTimeout(tId);
  }, [category, tabs, scrollActiveTabIntoView, updateScrollHints]);

  useEffect(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    updateScrollHints();
    const ro = new ResizeObserver(updateScrollHints);
    ro.observe(el);
    window.addEventListener("resize", updateScrollHints);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateScrollHints);
    };
  }, [updateScrollHints, tabs]);

  return (
    <div className="gallery__subnav">
      <div className="gallery__subnav-stats">
        {showLikedOnly ? (
          <button
            type="button"
            className="gallery__stat-pill gallery__stat-pill--all gallery__stat-pill--all-active"
            onClick={onShowAllPhotos}
            aria-pressed={false}
            title={t.galleryShowAll}
          >
            <ImageIcon size={16} strokeWidth={1.75} aria-hidden />
            <span>{totalCount}</span>
          </button>
        ) : (
          <span className="gallery__stat-pill">
            <ImageIcon size={16} strokeWidth={1.75} aria-hidden />
            <span>{totalCount}</span>
          </span>
        )}
        {showLikeFilter && (
        <button
          type="button"
          className={`gallery__stat-pill gallery__stat-pill--like ${showLikedOnly ? "gallery__stat-pill--filter-active" : ""}`}
          onClick={onToggleLikedFilter}
          aria-pressed={showLikedOnly}
          title={showLikedOnly ? "Show all photos" : "Show liked photos only"}
        >
          <Heart size={16} strokeWidth={1.75} fill={showLikedOnly ? "currentColor" : "none"} aria-hidden />
          <span>{likeCount}</span>
        </button>
        )}
      </div>
      <div className="gallery__subnav-tabs-wrap">
        {canScrollLeft && (
          <>
            <div className="gallery__subnav-tabs-fade gallery__subnav-tabs-fade--left" aria-hidden />
            <button
              type="button"
              className="gallery__subnav-tabs-arrow gallery__subnav-tabs-arrow--left"
              onClick={() => scrollTabsBy(-1)}
              aria-label="Scroll albums left"
            >
              <ChevronLeft size={18} strokeWidth={2} aria-hidden />
            </button>
          </>
        )}
        <div
          ref={tabsScrollRef}
          className="gallery__subnav-tabs"
          role="tablist"
          aria-label={t.galleryEyebrow}
          onScroll={updateScrollHints}
        >
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={category === id}
              ref={(el) => {
                tabRefs.current[id] = el;
              }}
              className={`gallery__subnav-tab ${category === id ? "gallery__subnav-tab--active" : ""}`}
              onClick={() => onCategoryChange(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {canScrollRight && (
          <>
            <div className="gallery__subnav-tabs-fade gallery__subnav-tabs-fade--right" aria-hidden />
            <button
              type="button"
              className="gallery__subnav-tabs-arrow gallery__subnav-tabs-arrow--right"
              onClick={() => scrollTabsBy(1)}
              aria-label="Scroll albums right"
            >
              <ChevronRight size={18} strokeWidth={2} aria-hidden />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function GallerySubAlbumNav({ subAlbum, onSubAlbumChange, labels }) {
  return (
    <div className="gallery__subalbum-nav" role="tablist" aria-label="Photobooth albums">
      {PHOTOBOOTH_SUB_ALBUM_IDS.map((id) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={subAlbum === id}
          className={`gallery__subalbum-tab ${subAlbum === id ? "gallery__subalbum-tab--active" : ""}`}
          onClick={() => onSubAlbumChange(id)}
        >
          {labels?.[id] || id}
        </button>
      ))}
    </div>
  );
}

function GalleryItem({
  image,
  index,
  imageKey,
  liked,
  onToggleLike,
  thumbnailSrc,
  fullSizeSrc,
  thumbnailSrcSet,
  thumbnailSizes,
  shouldPreload,
  isLoaded,
  onImageLoaded,
  onOpen,
  itemRef,
}) {
  const contentRef = useRef(null);
  const { rowSpan, onImageMetrics } = useMasonryRowSpan(contentRef);
  const thumbFallbacksRef = useRef([]);
  const driveEmbedProps = getDriveImageEmbedProps(image);

  useEffect(() => {
    if (isDriveImage(image)) {
      thumbFallbacksRef.current = getDriveThumbnailFallbacks(
        image.driveFileId || image.src,
        getGridThumbWidth(window.innerWidth)
      );
    }
  }, [image]);

  const handleImageLoad = useCallback(
    (e) => {
      const img = e.target;
      onImageMetrics(img.naturalWidth, img.naturalHeight, () => onImageLoaded(imageKey));
    },
    [imageKey, onImageLoaded, onImageMetrics]
  );

  const setImgRef = useCallback(
    (el) => {
      if (
        el &&
        el.complete &&
        el.naturalHeight !== 0 &&
        el.naturalWidth > 0 &&
        !isLoaded
      ) {
        onImageMetrics(el.naturalWidth, el.naturalHeight, () => onImageLoaded(imageKey));
      }
    },
    [imageKey, isLoaded, onImageLoaded, onImageMetrics]
  );

  const handleImageError = useCallback(
    (e) => {
      const img = e.target;
      const next = thumbFallbacksRef.current.shift();
      if (next && img.src !== next) {
        img.src = next;
        return;
      }
      onImageLoaded(imageKey);
    },
    [imageKey, onImageLoaded]
  );

  return (
    <motion.div
      ref={itemRef}
      className="gallery__item"
      style={{ gridRowEnd: `span ${rowSpan}` }}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.02, margin: "80px 0px" }}
      transition={{
        duration: 0.22,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <div
        ref={contentRef}
        className="gallery__image-wrapper"
        onClick={(e) => {
          if (e.target.closest(".gallery__like-btn")) return;
          const r = e.currentTarget.getBoundingClientRect();
          onOpen(index, {
            rect: { left: r.left, top: r.top, width: r.width, height: r.height },
            src: thumbnailSrc,
          });
        }}
      >
        {!isLoaded && (
          <div className="gallery__image-loading" aria-hidden="true">
            <span className="gallery__image-spinner" />
          </div>
        )}
        <img
          src={thumbnailSrc}
          srcSet={thumbnailSrcSet || undefined}
          sizes={thumbnailSizes || undefined}
          data-full={shouldPreload ? fullSizeSrc : undefined}
          data-image-key={imageKey}
          alt={getGalleryImageAlt(image, index)}
          className={`gallery__image ${isLoaded ? "gallery__image--loaded" : "gallery__image--loading"}`}
          loading="lazy"
          decoding="async"
          {...driveEmbedProps}
          onLoad={handleImageLoad}
          onError={handleImageError}
          ref={setImgRef}
        />
        <button
          type="button"
          className={`gallery__like-btn ${liked ? "gallery__like-btn--active" : ""}`}
          aria-label={liked ? "Unlike" : "Like"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike(imageKey);
          }}
        >
          <Heart size={14} fill={liked ? "currentColor" : "none"} strokeWidth={1.75} />
        </button>
      </div>
    </motion.div>
  );
}

export default function Gallery({
  onOpen,
  images: imagesProp,
  scrollToIndex,
  onScrollToComplete,
  category: controlledCategory,
  onCategoryChange,
  subAlbum: controlledSubAlbum,
  onSubAlbumChange,
  initialCategory = "pre-wedding",
}) {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const [internalCategory, setInternalCategory] = useState(initialCategory);
  const [internalSubAlbum, setInternalSubAlbum] = useState(DEFAULT_PHOTOBOOTH_SUB_ALBUM);
  const category = controlledCategory ?? internalCategory;
  const setCategory = onCategoryChange ?? setInternalCategory;
  const setSubAlbum = onSubAlbumChange ?? setInternalSubAlbum;
  const photoboothSubAlbum =
    category === "photobooth"
      ? controlledSubAlbum ?? internalSubAlbum ?? DEFAULT_PHOTOBOOTH_SUB_ALBUM
      : null;
  const categoryImages = useGalleryCategoryImages(
    category,
    category === "photobooth" ? photoboothSubAlbum : null
  );
  const list = imagesProp ?? categoryImages;

  const [likesVersion, setLikesVersion] = useState(0);
  const [showLikedOnly, setShowLikedOnly] = useState(false);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [loadedThumbs, setLoadedThumbs] = useState({});
  const galleryRef = useRef(null);
  const itemRefs = useRef({});
  const [guestMomentsCount, setGuestMomentsCount] = useState(0);
  const isGuestMoments = category === GUEST_MOMENTS_CATEGORY_ID;

  const tabs = useMemo(
    () =>
      GALLERY_SUBNAV_TAB_IDS.map((id) => ({
        id,
        label: t.galleryCategoryLabels?.[id] || id,
      })),
    [t.galleryCategoryLabels]
  );

  const imageKeys = useMemo(
    () =>
      list.map((img) =>
        getImageKey(img, category, category === "photobooth" ? photoboothSubAlbum : "")
      ),
    [list, category, photoboothSubAlbum]
  );

  const displayItems = useMemo(() => {
    void likesVersion;
    const items = list.map((image, originalIndex) => ({
      image,
      originalIndex,
      imageKey: imageKeys[originalIndex],
    }));
    if (!showLikedOnly) return items;
    return items.filter(({ imageKey }) => isImageLiked(imageKey));
  }, [list, imageKeys, showLikedOnly, likesVersion]);

  const likeCount = useMemo(() => {
    void likesVersion;
    return countGalleryLikes(imageKeys);
  }, [imageKeys, likesVersion]);

  const markThumbLoaded = useCallback((imageKey) => {
    setLoadedThumbs((prev) => (prev[imageKey] ? prev : { ...prev, [imageKey]: true }));
  }, []);

  useEffect(() => {
    const onLikes = () => setLikesVersion((v) => v + 1);
    window.addEventListener("gallery_likes_updated", onLikes);
    return () => window.removeEventListener("gallery_likes_updated", onLikes);
  }, []);

  useEffect(() => {
    if (scrollToIndex == null || scrollToIndex < 0) return;
    const el = itemRefs.current[scrollToIndex];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    onScrollToComplete?.();
  }, [scrollToIndex, onScrollToComplete]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const fullSrc = img.dataset.full;
            if (fullSrc && !loadedImages.has(fullSrc)) {
              const fullImage = new Image();
              fullImage.onload = () => setLoadedImages((prev) => new Set(prev).add(fullSrc));
              fullImage.onerror = () => setLoadedImages((prev) => new Set(prev).add(fullSrc));
              fullImage.src = fullSrc;
            }
            observer.unobserve(img);
          }
        });
      },
      { rootMargin: "100px", threshold: 0.01 }
    );
    const imageElements = document.querySelectorAll(".gallery__image[data-full]");
    imageElements.forEach((img) => observer.observe(img));
    return () => imageElements.forEach((img) => observer.unobserve(img));
  }, [loadedImages, displayItems, category]);

  const handleCategoryChange = (id) => {
    setCategory(id);
    if (id === "photobooth") {
      setSubAlbum(DEFAULT_PHOTOBOOTH_SUB_ALBUM);
    }
    setShowLikedOnly(false);
    setLoadedThumbs({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubAlbumChange = (id) => {
    setSubAlbum(id);
    setShowLikedOnly(false);
    setLoadedThumbs({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleLikedFilter = () => {
    setShowLikedOnly((v) => !v);
  };

  const handleToggleLike = (imageKey) => {
    toggleGalleryLike(imageKey);
    setLikesVersion((v) => v + 1);
  };

  return (
    <section className="gallery">
      <p className="gallery__eyebrow gallery__eyebrow--top">{t.galleryEyebrow}</p>

      <GallerySubNav
        category={category}
        onCategoryChange={handleCategoryChange}
        totalCount={isGuestMoments ? guestMomentsCount : list.length}
        likeCount={likeCount}
        showLikedOnly={showLikedOnly}
        onToggleLikedFilter={handleToggleLikedFilter}
        onShowAllPhotos={() => setShowLikedOnly(false)}
        tabs={tabs}
        showLikeFilter={!isGuestMoments}
      />

      {category === "photobooth" && (
        <GallerySubAlbumNav
          subAlbum={photoboothSubAlbum}
          onSubAlbumChange={handleSubAlbumChange}
          labels={t.galleryPhotoboothSubLabels}
        />
      )}

      <motion.header
        className="gallery__header"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <GalleryCategoryTitle categoryId={category} />
      </motion.header>

      {isGuestMoments ? (
        <GuestMomentsPanel onItemsCountChange={setGuestMomentsCount} />
      ) : list.length === 0 ? (
        <p className="gallery__empty">{t.galleryEmpty}</p>
      ) : displayItems.length === 0 ? (
        <p className="gallery__empty">{t.galleryEmptyLiked}</p>
      ) : (
        <div className="gallery__container" ref={galleryRef}>
          <div className="gallery__masonry">
            {displayItems.map(({ image, originalIndex, imageKey }, displayIndex) => {
              const paths = resolveImagePaths(image);
              const thumbnailSrc = paths.thumbnail || getThumbnailSrc(image);
              const fullSizeSrc = paths.fullSize || getFullSizeSrc(image);
              const liked = isImageLiked(imageKey);
              void likesVersion;
              const shouldPreload = thumbnailSrc !== fullSizeSrc && thumbnailSrc && fullSizeSrc;

              return (
                <GalleryItem
                  key={imageKey}
                  image={image}
                  index={displayIndex}
                  imageKey={imageKey}
                  liked={liked}
                  onToggleLike={handleToggleLike}
                  thumbnailSrc={thumbnailSrc}
                  fullSizeSrc={fullSizeSrc}
                  thumbnailSrcSet={paths.thumbnailSrcSet}
                  thumbnailSizes={paths.thumbnailSizes}
                  shouldPreload={shouldPreload}
                  isLoaded={Boolean(loadedThumbs[imageKey])}
                  onImageLoaded={markThumbLoaded}
                  onOpen={(displayIdx, meta) => onOpen(originalIndex, meta)}
                  itemRef={(el) => {
                    itemRefs.current[originalIndex] = el;
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

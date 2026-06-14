import { Navigate } from "react-router-dom";
import { GUEST_MOMENTS_CATEGORY_ID } from "../galleryCategories";
import { buildGalleryHash } from "../utils/galleryHash";

/** Legacy URL — redirect into gallery tab. */
export default function EventHighlightsPage() {
  return (
    <Navigate
      to={{ pathname: "/", hash: buildGalleryHash({ category: GUEST_MOMENTS_CATEGORY_ID }) }}
      replace
    />
  );
}

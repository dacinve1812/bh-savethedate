import React from "react";

const FEATURE_MEDIA = {
  desktop: "/feature-hero-desktop.jpg",
  mobile: "/feature-hero-mobile.jpg",
};

export default function FeatureIntro() {
  return (
    <section className="feature-intro">
      <div className="feature-intro__overlay" aria-hidden="true" />
      <div className="feature-intro__content">
        {/* <div className="feature-intro__monogram">B & H</div> */}
        <h1 className="feature-intro__heading">Bao & Hau</h1>
      </div>
    </section>
  );
}



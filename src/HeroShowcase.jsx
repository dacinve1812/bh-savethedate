import React, { useMemo, useState } from "react";

const heroMedia = {
  photoOne: "/photo1-1.jpg",
  photoTwo: "/photo2-2.jpg",
  card: "/ticket.png",
  envelope: "/envelope_1.png",
  envelopeOpen: "/envelope_open.png",
  flowers: "/flower.png",
  flowersAlt: "/flower2.png",
  flowersAlt2: "/flower3.png",
  flowersAlt3: "/flower4.png",
};

export default function HeroShowcase() {
  const sources = useMemo(
    () => [
      heroMedia.photoOne,
      heroMedia.photoTwo,
      heroMedia.card,
      heroMedia.envelope,
      heroMedia.envelopeOpen,
      heroMedia.flowers,
      heroMedia.flowersAlt,
      heroMedia.flowersAlt2,
      heroMedia.flowersAlt3,
    ],
    []
  );
  const [loaded, setLoaded] = useState(0);
  const total = sources.length;
  const isReady = loaded >= total;

  const handleLoad = () => setLoaded((c) => c + 1);

  return (
    <section className={`hero-showcase ${isReady ? "hero-ready" : ""}`}>
      <div className="hero-stage">
        <div className="hero-layer  hero-delay-4 hero-picture hero-picture--left hero-z-5">
          <img src={heroMedia.photoOne} alt="Couple portrait one" loading="eager" decoding="async" onLoad={handleLoad} />
        </div>

        <div className="hero-layer  hero-delay-5 hero-picture hero-picture--right hero-z-4">
          <img src={heroMedia.photoTwo} alt="Couple portrait two" loading="eager" decoding="async" onLoad={handleLoad} />
        </div>

        <div className="hero-layer hero-delay-3 hero-card hero-z-6">
          <img src={heroMedia.card} alt="Save the date card" loading="eager" decoding="async" onLoad={handleLoad} />
        </div>

        <div className="hero-layer hero-delay-2 hero-envelope hero-z-1">
          <img src={heroMedia.envelope} alt="Invitation envelope" loading="eager" decoding="async" onLoad={handleLoad} />
        </div>
        <div className="hero-layer hero-delay-2 hero-envelope hero-z-6">
          <img src={heroMedia.envelopeOpen} alt="Invitation envelope open" loading="eager" decoding="async" onLoad={handleLoad} />
        </div>

        <div className="hero-layer hero-delay-3 hero-flower hero-flower--left hero-z-5">
          <img src={heroMedia.flowers} alt="Bloom arrangement left" loading="eager" decoding="async" onLoad={handleLoad} />
        </div>
        <div className="hero-layer hero-delay-3 hero-flower hero-flower--left-2 hero-z-1">
          <img src={heroMedia.flowersAlt} alt="Bloom arrangement left alt" loading="eager" decoding="async" onLoad={handleLoad} />
        </div>

        <div className="hero-layer hero-delay-3 hero-flower hero-flower--right hero-z-3">
          <img src={heroMedia.flowersAlt2} alt="Bloom arrangement right" loading="eager" decoding="async" onLoad={handleLoad} />
        </div>

        <div className="hero-layer hero-delay-3 hero-flower hero-flower--right-2 hero-z-3">
          <img src={heroMedia.flowersAlt} alt="Bloom arrangement right" loading="eager" decoding="async" onLoad={handleLoad} />
        </div>

        <div className="hero-layer hero-delay-3 hero-flower hero-flower--center hero-z-3">
          <img src={heroMedia.flowers} alt="Bloom arrangement center" loading="eager" decoding="async" onLoad={handleLoad} />
        </div>

        <div className="hero-layer hero-delay-3 hero-flower hero-flower--center-2 hero-z-6">
          <img src={heroMedia.flowers} alt="Bloom arrangement center alt" loading="eager" decoding="async" onLoad={handleLoad} />
        </div>
        <div className="hero-layer hero-delay-3 hero-flower hero-flower--center-3 hero-z-6">
          <img src={heroMedia.flowersAlt2} alt="Bloom arrangement center alt" loading="eager" decoding="async" onLoad={handleLoad} />
        </div>
      </div>
    </section>
  );
}
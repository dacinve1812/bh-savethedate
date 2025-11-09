import React from "react";

const heroMedia = {
  photoOne: "/photo1.jpg",
  photoTwo: "/photo2.jpg",
  card: "/ticket.png",
  envelope: "/envelope_1.png",
  envelopeOpen: "/envelope_open.png",
  flowers: "/flower.png",
  flowersAlt: "/flower2.png",
  flowersAlt2: "/flower3.png",
  flowersAlt3: "/flower4.png",
};

export default function HeroShowcase() {
  return (
    <section className="hero-showcase">
      <div className="hero-stage">
        <div className="hero-layer  hero-delay-1 hero-picture hero-picture--left hero-z-5">
          <img src={heroMedia.photoOne} alt="Couple portrait one" />
        </div>

        <div className="hero-layer  hero-delay-2 hero-picture hero-picture--right hero-z-4">
          <img src={heroMedia.photoTwo} alt="Couple portrait two" />
        </div>

        <div className="hero-layer hero-delay-3 hero-card hero-z-6">
          <img src={heroMedia.card} alt="Save the date card" />
        </div>

        <div className="hero-layer hero-delay-2 hero-envelope hero-z-1">
          <img src={heroMedia.envelope} alt="Invitation envelope" />
        </div>
        <div className="hero-layer hero-delay-2 hero-envelope hero-z-6">
          <img src={heroMedia.envelopeOpen} alt="Invitation envelope open" />
        </div>

        <div className="hero-layer hero-delay-4 hero-flower hero-flower--left hero-z-5">
          <img src={heroMedia.flowers} alt="Bloom arrangement left" />
        </div>
        <div className="hero-layer hero-delay-4 hero-flower hero-flower--left-2 hero-z-1">
          <img src={heroMedia.flowersAlt} alt="Bloom arrangement left alt" />
        </div>

        <div className="hero-layer hero-delay-4 hero-flower hero-flower--right hero-z-3">
          <img src={heroMedia.flowers} alt="Bloom arrangement right" />
        </div>

        <div className="hero-layer hero-delay-4 hero-flower hero-flower--center hero-z-3">
          <img src={heroMedia.flowers} alt="Bloom arrangement center" />
        </div>

        <div className="hero-layer hero-delay-4 hero-flower hero-flower--center-2 hero-z-6">
          <img src={heroMedia.flowersAlt} alt="Bloom arrangement center alt" />
        </div>
        <div className="hero-layer hero-delay-4 hero-flower hero-flower--center-3 hero-z-6">
          <img src={heroMedia.flowersAlt2} alt="Bloom arrangement center alt" />
        </div>
      </div>
    </section>
  );
}
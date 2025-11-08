import React from "react";

const heroMedia = {
  photoOne: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80",
  photoTwo: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80",
  card: "https://images.unsplash.com/photo-1481306530171-f1aa5c256c06?auto=format&fit=crop&w=900&q=80",
  envelope: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80",
  flowers: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80",
};

export default function HeroShowcase() {
  return (
    <section className="hero-showcase">
      <div className="hero-stage">
        <div className="hero-layer hero-layer--float hero-delay-0 hero-picture hero-picture--left hero-z-mid">
          <img src={heroMedia.photoOne} alt="Couple portrait one" />
        </div>

        <div className="hero-layer hero-layer--float hero-delay-1 hero-picture hero-picture--right hero-z-top">
          <img src={heroMedia.photoTwo} alt="Couple portrait two" />
        </div>

        <div className="hero-layer hero-delay-3 hero-card hero-z-front">
          <img src={heroMedia.card} alt="Save the date card" />
        </div>

        <div className="hero-layer hero-delay-2 hero-envelope hero-z-base">
          <img src={heroMedia.envelope} alt="Invitation envelope" />
        </div>

        <div className="hero-layer hero-delay-4 hero-flower hero-flower--left hero-z-over">
          <img src={heroMedia.flowers} alt="Bloom arrangement left" />
        </div>

        <div className="hero-layer hero-delay-5 hero-flower hero-flower--right hero-z-over">
          <img src={heroMedia.flowers} alt="Bloom arrangement right" />
        </div>

        <div className="hero-layer hero-delay-6 hero-flower hero-flower--center hero-z-over">
          <img src={heroMedia.flowers} alt="Bloom arrangement center" />
        </div>
      </div>
    </section>
  );
}


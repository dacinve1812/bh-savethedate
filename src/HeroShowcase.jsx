import React from "react";
import ticketImg from "../public/ticket.png";
import photoOneImg from "../public/NP__7180.JPG";
import photoTwoImg from "../public/NP__7045.jpg";
import envelopeImg from "../public/envelope_1.png"; 
import envelopeOpenImg from "../public/envelope_open.png";  
import flowerImg from "../public/flower.png";
import flowerImg2 from "../public/flower2.png";
import flowerImg3 from "../public/flower3.png";
import flowerImg4 from "../public/flower4.png";

const heroMedia = {
  photoOne: photoOneImg,
  photoTwo: photoTwoImg,
  card: ticketImg,
  envelope: envelopeImg,
  envelope_open: envelopeOpenImg,
  flowers: flowerImg,
  flowers_2: flowerImg2,
  flowers_3: flowerImg3,
  flowers_4: flowerImg4,
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
          <img src={heroMedia.envelope_open} alt="Invitation envelope" />
        </div>

        <div className="hero-layer hero-delay-4 hero-flower hero-flower--left hero-z-5">
          <img src={heroMedia.flowers} alt="Bloom arrangement left" />
        </div>
        <div className="hero-layer hero-delay-4 hero-flower hero-flower--left-2 hero-z-1">
          <img src={heroMedia.flowers_2} alt="Bloom arrangement left" />
        </div>

        <div className="hero-layer hero-delay-4 hero-flower hero-flower--right hero-z-3">
          <img src={heroMedia.flowers} alt="Bloom arrangement right" />
        </div>

        <div className="hero-layer hero-delay-4 hero-flower hero-flower--center hero-z-3">
          <img src={heroMedia.flowers} alt="Bloom arrangement center" />
        </div>

        <div className="hero-layer hero-delay-4 hero-flower hero-flower--center-2 hero-z-6">
          <img src={heroMedia.flowers_2} alt="Bloom arrangement center" />
        </div>
        <div className="hero-layer hero-delay-4 hero-flower hero-flower--center-3 hero-z-6">
          <img src={heroMedia.flowers_3} alt="Bloom arrangement center" />
        </div>
      </div>
    </section>
  );
}


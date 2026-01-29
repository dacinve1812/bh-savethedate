import React, { useMemo, useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import guestList from "./guests.json";
import { useLanguage } from "./contexts/LanguageContext";
import { translations } from "./translations";
import "./RSVPPage.css";

const GUEST_LIST = guestList;

function normalizeVietnamese(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

// Thay đổi URL này bằng Web App URL từ Google Apps Script
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz5BKfGGqLcA4TOVJIttnTSq_5HSKPg44bGO_zOpGsxJzgoxR1uXVUCBxplC58osGfq/exec"; // Paste Web App URL vào đây

export default function RSVPPage({ showHeader = true }) {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const [formData, setFormData] = useState({
    fullName: "",
    attending: "",
    numberOfGuests: "",
    numberOfGuestsOther: "",
    dietaryPreference: "",
    guestNames: "",
    comments: "",
  });
  const [nameQuery, setNameQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: "", text: "" });
  const typeaheadRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const filteredSuggestions = useMemo(() => {
    if (!nameQuery) return [];
    const q = normalizeVietnamese(nameQuery);
    return GUEST_LIST.filter((n) => normalizeVietnamese(n).includes(q)).slice(0, 8);
  }, [nameQuery]);

  // Keep suggestions visible when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (typeaheadRef.current && !typeaheadRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePickName = (name) => {
    setFormData((p) => ({ ...p, fullName: name }));
    setNameQuery(name);
    // Hide suggestions after selection
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Kiểm tra nếu chưa có Google Script URL
    if (!GOOGLE_SCRIPT_URL) {
      setSubmitMessage({
        type: "error",
        text: "Google Sheets integration not configured. Please check GOOGLE_SHEETS_SETUP.md"
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage({ type: "", text: "" });

    try {
      // Chuẩn bị dữ liệu để gửi
      const submitData = {
        fullName: formData.fullName,
        attending: formData.attending,
        numberOfGuests: formData.numberOfGuests,
        numberOfGuestsOther: formData.numberOfGuestsOther,
        dietaryPreference: formData.dietaryPreference,
        guestNames: formData.guestNames,
        comments: formData.comments,
      };

      // Gửi dữ liệu đến Google Apps Script
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // Google Apps Script cần no-cors
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      // Với no-cors, chúng ta không thể đọc response
      // Nhưng nếu không có lỗi, coi như thành công
      setSubmitMessage({
        type: "success",
        text: t.submitSuccess,
      });

      // Reset form sau 2 giây
      setTimeout(() => {
        setFormData({
          fullName: "",
          attending: "",
          numberOfGuests: "",
          numberOfGuestsOther: "",
          dietaryPreference: "",
          guestNames: "",
          comments: "",
        });
        setNameQuery("");
        setSubmitMessage({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitMessage({
        type: "error",
        text: t.submitError,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rsvp-page">
      {showHeader && (
        /* Header */
        <header className="rsvp-page__header">
          <div className="rsvp-page__header-content">
            <div className="rsvp-page__logo rsvp-page__logo--link">
              B&H 05.30.2026
            </div>
          </div>
        </header>
      )}

      {/* Main Image Section with Overlay */}
      <section className="rsvp-page__hero">
        <motion.div
          className="rsvp-page__hero-image"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="rsvp-page__hero-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.h1
              className="rsvp-page__hero-title"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              {t.rsvpTitle}
            </motion.h1>
            <motion.p
              className="rsvp-page__hero-subtitle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              {t.rsvpSubtitle}
            </motion.p>
          </motion.div>
        </motion.div>
      </section>

      {/* Wedding Title */}
      <section className="rsvp-page__title-section">
        <h2 className="rsvp-page__wedding-title">{t.weddingTitle}</h2>
      </section>

      {/* RSVP Form */}
      <section className="rsvp-page__form-section">
        <form className="rsvp-page__form" onSubmit={handleSubmit}>
          <div className="rsvp-page__form-group rsvp-page__typeahead" ref={typeaheadRef}>
            <label htmlFor="fullName" className="rsvp-page__label">
              {t.findYourName} <span className="rsvp-page__required">{t.required}</span>
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className="rsvp-page__input"
              placeholder={t.namePlaceholder}
              value={nameQuery}
              onChange={(e) => {
                setNameQuery(e.target.value);
                setFormData((p) => ({ ...p, fullName: e.target.value }));
                // Show suggestions when typing
                if (e.target.value && filteredSuggestions.length > 0) {
                  setShowSuggestions(true);
                } else {
                  setShowSuggestions(false);
                }
              }}
              onFocus={() => {
                // Show suggestions when focusing on input (if there's query and suggestions)
                if (nameQuery && filteredSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                // Hide suggestions when blurring (losing focus)
                // Use setTimeout to allow click on suggestion to register first
                setTimeout(() => {
                  setShowSuggestions(false);
                }, 200);
              }}
              required
              autoComplete="off"
            />
            {showSuggestions && nameQuery && filteredSuggestions.length > 0 && (
              <ul className="rsvp-page__suggestions" role="listbox">
                {filteredSuggestions.map((name) => (
                  <li
                    key={name}
                    className="rsvp-page__suggestion"
                    role="option"
                    onClick={() => handlePickName(name)}
                  >
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rsvp-page__form-group">
            <label className="rsvp-page__label">
              {t.willAttend} <span className="rsvp-page__required">{t.required}</span>
            </label>
            <div className="rsvp-page__radio-group">
              <label className="rsvp-page__radio-label">
                <input
                  type="radio"
                  name="attending"
                  value="yes"
                  className="rsvp-page__radio"
                  checked={formData.attending === "yes"}
                  onChange={handleInputChange}
                  required
                />
                <span>{t.yes}</span>
              </label>
              <label className="rsvp-page__radio-label">
                <input
                  type="radio"
                  name="attending"
                  value="no"
                  className="rsvp-page__radio"
                  checked={formData.attending === "no"}
                  onChange={handleInputChange}
                  required
                />
                <span>{t.no}</span>
              </label>
            </div>
          </div>

          <div className="rsvp-page__form-group">
            <label htmlFor="numberOfGuests" className="rsvp-page__label">
              {t.numberOfGuests}
            </label>
            <select
              id="numberOfGuests"
              name="numberOfGuests"
              className="rsvp-page__select"
              value={formData.numberOfGuests}
              onChange={handleInputChange}
            >
              <option value="">{t.selectGuests}</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="other">{t.other}</option>
            </select>
            {formData.numberOfGuests === "other" && (
              <input
                type="number"
                name="numberOfGuestsOther"
                className="rsvp-page__input"
                placeholder={t.enterGuests}
                value={formData.numberOfGuestsOther}
                onChange={handleInputChange}
                min="6"
                style={{ marginTop: "0.75rem" }}
              />
            )}
          </div>

          <div className="rsvp-page__form-group">
            <label htmlFor="guestNames" className="rsvp-page__label">
              {t.guestNames}
            </label>
            <textarea
              id="guestNames"
              name="guestNames"
              className="rsvp-page__textarea"
              rows="3"
              value={formData.guestNames}
              onChange={handleInputChange}
            />
          </div>

          <div className="rsvp-page__form-group">
            <label className="rsvp-page__label">
              {t.dietaryPreference}
            </label>
            <div className="rsvp-page__radio-group">
              <label className="rsvp-page__radio-label">
                <input
                  type="radio"
                  name="dietaryPreference"
                  value="vegetarian"
                  className="rsvp-page__radio"
                  checked={formData.dietaryPreference === "vegetarian"}
                  onChange={handleInputChange}
                />
                <span>{t.vegetarian}</span>
              </label>
              <label className="rsvp-page__radio-label">
                <input
                  type="radio"
                  name="dietaryPreference"
                  value="non-vegetarian"
                  className="rsvp-page__radio"
                  checked={formData.dietaryPreference === "non-vegetarian"}
                  onChange={handleInputChange}
                />
                <span>{t.nonVegetarian}</span>
              </label>
            </div>
          </div>

          <div className="rsvp-page__form-group">
            <label htmlFor="comments" className="rsvp-page__label">
              {t.questionsComments}
            </label>
            <textarea
              id="comments"
              name="comments"
              className="rsvp-page__textarea"
              rows="3"
              value={formData.comments}
              onChange={handleInputChange}
            />
          </div>

          {submitMessage.text && (
            <div
              className={`rsvp-page__message rsvp-page__message--${submitMessage.type}`}
            >
              {submitMessage.text}
            </div>
          )}

          <button
            type="submit"
            className="rsvp-page__submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? t.submitting : t.submit}
          </button>
        </form>
      </section>
    </div>
  );
}


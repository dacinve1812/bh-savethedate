import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations';

export default function LanguageSelector({ onSelect, isOpen: controlledIsOpen = true, onClose }) {
  const { language, setLanguage } = useLanguage();
  
  // Use controlled state if provided
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : true;

  const handleSelect = (lang) => {
    setLanguage(lang);
    if (onClose) {
      onClose();
    }
    if (onSelect) {
      onSelect(lang);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      key="language-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-950/88"
      onClick={(e) => {
        // Close on backdrop click if no selection made
        if (e.target === e.currentTarget && !language) {
          handleSelect('en'); // Default to English if clicked outside
        }
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-[90%] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="flex flex-col gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect('vi')}
            className="px-6 py-4 rounded-xl bg-[#5c6f54] text-white font-medium text-lg transition-colors hover:bg-[#4a5a44]"
          >
            {translations.vi.vietnamese}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect('en')}
            className="px-6 py-4 rounded-xl bg-[#f6f7ef] text-[#253126] border-2 border-[#5c6f54] font-medium text-lg transition-colors hover:bg-[#e8ebe4]"
          >
            {translations.en.english}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}


import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "./contexts/LanguageContext";
import { translations } from "./translations";

export default function ChanceEncounter() {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  
  return (
    <section className="chance-encounter">
      <motion.div 
        className="chance-encounter__text"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{
          duration: 0.65,
          ease: [0.25, 0.1, 0.25, 1]
        }}
      >
        <motion.h2 
          className="chance-encounter__title mb-5"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{
            duration: 0.7,
            delay: 0.15,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          {t.chanceTitle}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{
            duration: 0.7,
            delay: 0.15,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          {language === 'en' ? (
            <>
              After <span className="fontchange"> years </span> of laughter, adventures, and countless
              shared memories, we&apos;re <span className="fontchange"> finally </span> taking the next step in our journey together.
            </>
          ) : (
            <>
              Sau <span className="fontchange"> nhiều năm </span> cùng nhau với những tiếng cười, những cuộc phiêu lưu và vô vàn kỷ niệm đẹp, chúng tôi <span className="fontchange"> cuối cùng </span> cũng sẵn sàng bước thêm một bước nữa trong hành trình của mình.
            </>
          )}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{
            duration: 0.7,
            delay: 0.2,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          {language === 'en' ? (
            <>
              This day marks not just a celebration of love,
              but the beginning of a <span className="fontchange">lifetime </span> filled with new dreams, new chapters, and endless moments together.
            </>
          ) : (
            <>
              Ngày này không chỉ là một lễ kỷ niệm tình yêu, mà còn là khởi đầu của một <span className="fontchange">cuộc sống mới </span> với những giấc mơ mới, những chương mới và những khoảnh khắc bất tận bên nhau.
            </>
          )}
        </motion.p>   
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{
            duration: 0.7,
            delay: 0.25,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          {language === 'en' ? (
            <>
              We&apos;re so grateful for the love and support of our family and friends who have been part of <span className="fontchange">our story </span> from the start.
            </>
          ) : (
            <>
              Chúng tôi rất biết ơn tình yêu thương và sự ủng hộ của gia đình và bạn bè, những người đã là một phần trong <span className="fontchange">câu chuyện của chúng tôi </span> ngay từ đầu.
            </>
          )}
        </motion.p>         
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{
            duration: 0.6,
            delay: 0.3,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          {language === 'en' ? (
            <>
              Your<span className="fontchange"> presence </span> means the world to us, and we can&apos;t wait to celebrate this special day surrounded by those  <span className="fontchange"> we love most.</span>
            </>
          ) : (
            <>
              <span className="fontchange">Sự hiện diện </span> của bạn có ý nghĩa rất lớn đối với chúng tôi, và chúng tôi không thể chờ đợi để được cùng nhau kỷ niệm ngày đặc biệt này với những người <span className="fontchange">chúng tôi yêu quý nhất.</span>
            </>
          )}
        </motion.p>
      </motion.div>

      <motion.div 
        className="chance-encounter__visual"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{
          duration: 0.8,
          delay: 0.2,
          ease: [0.25, 0.1, 0.25, 1]
        }}
      >
        <img src="/chance-map.jpg" alt="" aria-hidden className="chance-encounter__layer chance-encounter__layer--map" />
        <img src="/chance-photo-2.jpg" alt="Couple walking" className="chance-encounter__layer chance-encounter__layer--walk" />
        <img src="/chance-photo-1.jpg" alt="Couple brunch" className="chance-encounter__layer chance-encounter__layer--brunch" />
        <img src="/chance-doodle-hearts.png" alt="" aria-hidden className="chance-encounter__layer chance-encounter__layer--doodle" />
        <img src="/chance-flower.png" alt="" aria-hidden className="chance-encounter__layer chance-encounter__layer--flower" />
      </motion.div>
    </section>
  );
}


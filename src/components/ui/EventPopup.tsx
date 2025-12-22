'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface EventPopupProps {
  imageUrl?: string;
  title?: string;
  description?: string;
  themeColor?: string;
  onClose?: () => void;
}

export function EventPopup({
  imageUrl,
  title,
  description,
  themeColor = '#facc15',
  onClose,
}: EventPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 세션 중 한 번만 보여주기
    const hasSeenPopup = sessionStorage.getItem('event_popup_seen');
    if (!hasSeenPopup && (imageUrl || title)) {
      setIsOpen(true);
    }
  }, [imageUrl, title]);

  const handleClose = () => {
    sessionStorage.setItem('event_popup_seen', 'true');
    setIsOpen(false);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative max-w-md w-full rounded-2xl bg-gray-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            >
              <X className="h-5 w-5" />
            </button>

            {/* 이미지 */}
            {imageUrl && (
              <div className="aspect-video w-full">
                <img
                  src={imageUrl}
                  alt="Event"
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* 텍스트 */}
            {(title || description) && (
              <div className="p-6 text-center">
                {title && (
                  <h2
                    className="mb-2 text-2xl font-bold"
                    style={{ color: themeColor }}
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-gray-300 whitespace-pre-line">{description}</p>
                )}
              </div>
            )}

            {/* 확인 버튼 */}
            <div className="p-4 pt-0">
              <button
                onClick={handleClose}
                className="w-full rounded-xl py-3 font-bold text-black transition-colors hover:opacity-90"
                style={{ backgroundColor: themeColor }}
              >
                확인
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

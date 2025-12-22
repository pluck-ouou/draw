'use client';

import { motion } from 'framer-motion';

interface FloatingBadgeProps {
  text: string;
  bgColor?: string;
  textColor?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function FloatingBadge({
  text,
  bgColor = '#ef4444',
  textColor = '#ffffff',
  position = 'top-right',
}: FloatingBadgeProps) {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <motion.div
      initial={{ scale: 0, rotate: -12 }}
      animate={{ scale: 1, rotate: -12 }}
      className={`fixed z-40 ${positionClasses[position]}`}
    >
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="rounded-lg px-4 py-2 font-bold shadow-lg"
        style={{
          backgroundColor: bgColor,
          color: textColor,
        }}
      >
        <span className="text-sm">{text}</span>
      </motion.div>
    </motion.div>
  );
}

'use client';

import { motion } from 'framer-motion';

interface MarqueeBannerProps {
  text: string;
  bgColor?: string;
  textColor?: string;
  speed?: number; // 초 단위
}

export function MarqueeBanner({
  text,
  bgColor = '#facc15',
  textColor = '#000000',
  speed = 20,
}: MarqueeBannerProps) {
  // 텍스트를 여러 번 반복해서 끊김 없이 보이게
  const repeatedText = `${text}   ★   `.repeat(4);

  return (
    <div
      className="relative w-full overflow-hidden py-2"
      style={{ backgroundColor: bgColor }}
    >
      <motion.div
        className="whitespace-nowrap text-sm font-bold"
        style={{ color: textColor }}
        animate={{
          x: ['0%', '-50%'],
        }}
        transition={{
          x: {
            duration: speed,
            repeat: Infinity,
            ease: 'linear',
          },
        }}
      >
        {repeatedText}
        {repeatedText}
      </motion.div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Prize, Draw } from '@/lib/supabase/types';

interface SlotCardProps {
  prize: Prize;
  draw?: Draw | null;
  isMyDraw?: boolean;
  disabled?: boolean;
  isDrawing?: boolean;
  onClick?: () => void;
}

export function SlotCard({
  prize,
  draw,
  isMyDraw = false,
  disabled = false,
  isDrawing = false,
  onClick,
}: SlotCardProps) {
  const isDrawn = prize.is_drawn;

  return (
    <motion.button
      whileHover={!isDrawn && !disabled ? { scale: 1.05 } : undefined}
      whileTap={!isDrawn && !disabled ? { scale: 0.95 } : undefined}
      onClick={onClick}
      disabled={isDrawn || disabled || isDrawing}
      className={cn(
        'relative aspect-square w-full rounded-lg border-2 font-bold transition-all duration-200',
        'flex flex-col items-center justify-center text-center',
        isDrawn
          ? isMyDraw
            ? 'border-yellow-400 bg-gradient-to-br from-yellow-500/30 to-amber-500/30 text-yellow-300'
            : 'border-gray-600 bg-gray-700/50 text-gray-500'
          : disabled
          ? 'border-gray-600 bg-gray-800 text-gray-500 cursor-not-allowed'
          : 'border-yellow-500/50 bg-gradient-to-br from-gray-800 to-gray-900 text-white hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-500/20 cursor-pointer'
      )}
    >
      {isDrawing && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-yellow-400/20"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      <span
        className={cn(
          'text-sm sm:text-base md:text-lg',
          isDrawn && !isMyDraw && 'opacity-50'
        )}
      >
        {prize.slot_number}
      </span>

      {isDrawn && draw && (
        <span className="mt-0.5 truncate px-1 text-[10px] sm:text-xs opacity-75 max-w-full">
          {draw.player_name}
        </span>
      )}

      {isMyDraw && (
        <motion.div
          className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-yellow-400"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
}

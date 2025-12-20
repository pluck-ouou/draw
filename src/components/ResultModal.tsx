'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGameStore } from '@/store/gameStore';
import { X, Trophy, Frown } from 'lucide-react';

export function ResultModal() {
  const { drawResult, showResultModal, setShowResultModal } = useGameStore();

  const isWinner = drawResult?.success && drawResult?.is_winner;

  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#ef4444', '#22c55e'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#ef4444', '#22c55e'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  useEffect(() => {
    if (showResultModal && isWinner) {
      fireConfetti();
    }
  }, [showResultModal, isWinner, fireConfetti]);

  if (!drawResult) return null;

  return (
    <AnimatePresence>
      {showResultModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowResultModal(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-gray-900 to-gray-800 p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowResultModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            {drawResult.success ? (
              <>
                {isWinner ? (
                  <>
                    <motion.div
                      initial={{ rotate: -10 }}
                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="mb-4"
                    >
                      <Trophy className="mx-auto h-16 w-16 text-yellow-400" />
                    </motion.div>
                    <h2 className="mb-2 text-2xl font-bold text-yellow-400">
                      축하합니다!
                    </h2>
                    <div className="mb-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 p-4">
                      <p className="text-lg font-bold text-yellow-300">
                        {drawResult.prize_grade}
                      </p>
                      <p className="mt-1 text-2xl font-extrabold text-white">
                        {drawResult.prize_name}
                      </p>
                    </div>
                    <p className="text-gray-400">
                      {drawResult.slot_number}번을 뽑으셨습니다
                    </p>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ y: -10 }}
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.5, repeat: 2 }}
                      className="mb-4"
                    >
                      <Frown className="mx-auto h-16 w-16 text-gray-400" />
                    </motion.div>
                    <h2 className="mb-2 text-2xl font-bold text-gray-300">
                      아쉽네요...
                    </h2>
                    <div className="mb-4 rounded-xl bg-gray-700/50 p-4">
                      <p className="text-2xl font-bold text-gray-400">꽝!</p>
                    </div>
                    <p className="text-gray-500">다음 기회에!</p>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="mb-4">
                  <X className="mx-auto h-16 w-16 text-red-400" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-red-400">
                  오류가 발생했습니다
                </h2>
                <p className="text-gray-400">{drawResult.message}</p>
              </>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowResultModal(false)}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 py-3 font-bold text-black transition-all hover:from-yellow-400 hover:to-amber-400"
            >
              확인
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

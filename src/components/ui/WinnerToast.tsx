'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Gift } from 'lucide-react';

interface WinnerInfo {
  id: string;
  playerName: string;
  prizeName: string;
  prizeGrade: string | null;
}

interface WinnerToastProps {
  winners: WinnerInfo[];
  themeColor?: string;
}

export function WinnerToast({ winners, themeColor = '#facc15' }: WinnerToastProps) {
  const [currentToast, setCurrentToast] = useState<WinnerInfo | null>(null);
  const [shownIds, setShownIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // 아직 보여주지 않은 새 당첨자 찾기
    const newWinner = winners.find((w) => !shownIds.has(w.id) && w.prizeGrade);

    if (newWinner) {
      setCurrentToast(newWinner);
      setShownIds((prev) => new Set([...prev, newWinner.id]));

      // 3초 후 사라짐
      const timer = setTimeout(() => {
        setCurrentToast(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [winners, shownIds]);

  // 이름 마스킹 (김OO)
  const maskName = (name: string) => {
    if (name.length <= 1) return name;
    return name[0] + 'O'.repeat(name.length - 1);
  };

  return (
    <AnimatePresence>
      {currentToast && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          className="fixed right-4 top-20 z-50 rounded-xl p-4 shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${themeColor}20, ${themeColor}40)`,
            border: `2px solid ${themeColor}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: themeColor }}
            >
              {currentToast.prizeGrade ? (
                <Trophy className="h-5 w-5 text-black" />
              ) : (
                <Gift className="h-5 w-5 text-black" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-400">방금 당첨!</p>
              <p className="font-bold text-white">
                {maskName(currentToast.playerName)}님 - {currentToast.prizeGrade}
              </p>
              <p className="text-sm" style={{ color: themeColor }}>
                {currentToast.prizeName}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

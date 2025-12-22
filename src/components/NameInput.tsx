'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { setPlayerName as savePlayerName } from '@/lib/utils';
import { Sparkles, Users, Trophy, Gift } from 'lucide-react';

interface NameInputProps {
  participantCount: number;
  remainingSlots: number;
  prizeWinners?: number;
  inviteCode: string;
  themeColor?: string;
}

export function NameInput({
  participantCount,
  remainingSlots,
  prizeWinners = 0,
  inviteCode,
  themeColor = '#facc15',
}: NameInputProps) {
  const router = useRouter();
  const { setPlayerName } = useGameStore();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setError('이름은 2자 이상 입력해주세요.');
      return;
    }

    if (trimmedName.length > 10) {
      setError('이름은 10자 이하로 입력해주세요.');
      return;
    }

    // Save to store and localStorage
    setPlayerName(trimmedName);
    savePlayerName(trimmedName);

    // Navigate to game page
    router.push(`/game/${inviteCode}`);
  };

  // 테마 색상에서 밝기를 조절한 그라디언트 생성
  const lightenColor = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  };

  const gradientFrom = themeColor;
  const gradientTo = lightenColor(themeColor, 20);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 p-6 backdrop-blur-sm border border-gray-700/50">
          <label className="mb-3 block text-center text-lg font-medium text-gray-200">
            참가자 이름을 입력하세요
          </label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="이름 입력"
              maxLength={10}
              className="w-full rounded-xl border-2 bg-gray-900/80 px-4 py-4 text-center text-xl text-white placeholder-gray-500 transition-all focus:outline-none"
              style={{
                borderColor: isFocused ? themeColor : '#4b5563',
                boxShadow: isFocused ? `0 0 0 3px ${themeColor}33` : 'none',
              }}
              autoFocus
            />
            {name && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <Sparkles className="h-5 w-5" style={{ color: themeColor }} />
              </motion.div>
            )}
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-center text-sm text-red-400"
            >
              {error}
            </motion.p>
          )}
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-xl py-4 text-lg font-bold text-black shadow-lg transition-all"
          style={{
            background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
            boxShadow: `0 10px 30px -10px ${themeColor}80`,
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <Gift className="h-5 w-5" />
            참가하기
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </span>
        </motion.button>
      </form>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6 grid grid-cols-3 gap-3"
      >
        <div className="rounded-xl bg-gray-800/50 p-3 text-center backdrop-blur-sm">
          <div className="flex items-center justify-center gap-1 text-gray-400">
            <Users className="h-4 w-4" />
          </div>
          <p className="mt-1 text-xl font-bold text-white">{participantCount}</p>
          <p className="text-xs text-gray-500">참여자</p>
        </div>
        <div className="rounded-xl bg-gray-800/50 p-3 text-center backdrop-blur-sm">
          <div className="flex items-center justify-center gap-1 text-green-400">
            <Trophy className="h-4 w-4" />
          </div>
          <p className="mt-1 text-xl font-bold text-green-400">{prizeWinners}</p>
          <p className="text-xs text-gray-500">당첨자</p>
        </div>
        <div className="rounded-xl bg-gray-800/50 p-3 text-center backdrop-blur-sm">
          <div className="flex items-center justify-center gap-1">
            <Gift className="h-4 w-4" style={{ color: themeColor }} />
          </div>
          <p className="mt-1 text-xl font-bold" style={{ color: themeColor }}>{remainingSlots}</p>
          <p className="text-xs text-gray-500">남은 기회</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

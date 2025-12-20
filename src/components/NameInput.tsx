'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { setPlayerName as savePlayerName } from '@/lib/utils';
import { Sparkles, Users } from 'lucide-react';

interface NameInputProps {
  participantCount: number;
  remainingSlots: number;
}

export function NameInput({ participantCount, remainingSlots }: NameInputProps) {
  const router = useRouter();
  const { setPlayerName } = useGameStore();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

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
    router.push('/game');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl bg-gray-800/50 p-6 backdrop-blur">
          <label className="mb-2 block text-lg font-medium text-gray-200">
            이름을 입력하세요
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="홍길동"
            maxLength={10}
            className="w-full rounded-xl border-2 border-gray-600 bg-gray-900 px-4 py-3 text-lg text-white placeholder-gray-500 transition-all focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
            autoFocus
          />
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-sm text-red-400"
            >
              {error}
            </motion.p>
          )}
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 py-4 text-lg font-bold text-black shadow-lg shadow-yellow-500/25 transition-all hover:from-yellow-400 hover:to-amber-400"
        >
          <span className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5" />
            참가하기
          </span>
        </motion.button>
      </form>

      {/* Stats */}
      <div className="mt-8 flex justify-center gap-8 text-center">
        <div>
          <div className="flex items-center justify-center gap-1 text-gray-400">
            <Users className="h-4 w-4" />
            <span className="text-sm">참여자</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-white">{participantCount}명</p>
        </div>
        <div>
          <div className="text-sm text-gray-400">남은 기회</div>
          <p className="mt-1 text-2xl font-bold text-yellow-400">{remainingSlots}개</p>
        </div>
      </div>
    </motion.div>
  );
}

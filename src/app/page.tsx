'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Snowfall } from '@/components/Snowfall';
import { Sparkles, ArrowRight, Settings } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const code = inviteCode.trim().toUpperCase();

    if (code.length < 4) {
      setError('초대 코드를 입력해주세요.');
      return;
    }

    // Navigate to invite code page
    router.push(`/${code}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Snowfall count={50} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="mb-4 flex items-center justify-center gap-2">
          <Sparkles className="h-10 w-10 text-yellow-400" />
          <h1 className="text-5xl font-extrabold gradient-text sm:text-6xl">
            Lucky Draw
          </h1>
          <Sparkles className="h-10 w-10 text-yellow-400" />
        </div>
        <p className="text-lg text-gray-400">크리스마스 럭키 드로우 게임</p>
      </motion.div>

      {/* Invite Code Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl bg-gray-800/50 p-6 backdrop-blur">
            <label className="mb-2 block text-lg font-medium text-gray-200">
              초대 코드 입력
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="예: ABC123"
              maxLength={10}
              className="w-full rounded-xl border-2 border-gray-600 bg-gray-900 px-4 py-4 text-center text-2xl font-bold tracking-widest text-white placeholder-gray-500 transition-all focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
              autoFocus
            />
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-center text-sm text-red-400"
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
              게임 참가하기
              <ArrowRight className="h-5 w-5" />
            </span>
          </motion.button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          초대 코드는 게임 주최자에게 받으세요
        </p>
      </motion.div>

      {/* Admin Link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-12"
      >
        <Link
          href="/admin"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span className="text-sm">관리자</span>
        </Link>
      </motion.div>
    </main>
  );
}

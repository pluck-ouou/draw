'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChristmasTree } from '@/components/ChristmasTree';
import { ResultModal } from '@/components/ResultModal';
import { Snowfall } from '@/components/Snowfall';
import { useGame } from '@/hooks/useGame';
import { getPlayerName } from '@/lib/utils';
import { Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function GamePage() {
  const router = useRouter();
  const { game, playerName, isLoading, stats } = useGame();

  useEffect(() => {
    // Redirect if no player name
    const savedName = getPlayerName();
    if (!savedName) {
      router.push('/');
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4">
      {/* Snowfall Effect */}
      <Snowfall count={60} />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mb-4 max-w-4xl"
      >
        <div className="flex items-center justify-between rounded-xl bg-gray-800/50 p-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-400" />
              <h1 className="text-xl font-bold gradient-text">Lucky Draw</h1>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">안녕하세요,</p>
            <p className="font-bold text-yellow-400">{playerName}님</p>
          </div>
        </div>
      </motion.header>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mx-auto mb-4 max-w-4xl"
      >
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-800/30 p-3 text-center">
          <div>
            <p className="text-xs text-gray-500">참여자</p>
            <p className="text-lg font-bold text-white">{stats.participants}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">당첨자</p>
            <p className="text-lg font-bold text-green-400">{stats.prizeWinners}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">남은 기회</p>
            <p className="text-lg font-bold text-yellow-400">{stats.remainingSlots}</p>
          </div>
        </div>
      </motion.div>

      {/* Game Board */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-auto max-w-4xl"
      >
        <ChristmasTree />
      </motion.div>

      {/* Instructions */}
      {game?.status === 'active' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mt-4 max-w-4xl text-center"
        >
          <p className="text-sm text-gray-500">
            마음에 드는 오너먼트를 선택해서 경품을 확인하세요!
          </p>
        </motion.div>
      )}

      {/* Result Modal */}
      <ResultModal />
    </main>
  );
}

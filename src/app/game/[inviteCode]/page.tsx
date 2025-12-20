'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChristmasTree } from '@/components/ChristmasTree';
import { ResultModal } from '@/components/ResultModal';
import { Snowfall } from '@/components/Snowfall';
import { useGame } from '@/hooks/useGame';
import { getPlayerName } from '@/lib/utils';
import { Loader2, Sparkles, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const inviteCode = params.inviteCode as string;

  const { game, playerName, isLoading, stats } = useGame({ inviteCode });

  useEffect(() => {
    // Redirect if no player name
    const savedName = getPlayerName();
    if (!savedName && !isLoading) {
      router.push(`/${inviteCode}`);
    }
  }, [router, inviteCode, isLoading]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <AlertCircle className="mb-4 h-16 w-16 text-red-400" />
        <h1 className="mb-2 text-2xl font-bold text-white">게임을 찾을 수 없습니다</h1>
        <p className="mb-6 text-gray-400">초대 코드를 확인해주세요.</p>
        <Link
          href="/"
          className="rounded-lg bg-yellow-500 px-6 py-3 font-bold text-black hover:bg-yellow-400"
        >
          홈으로 돌아가기
        </Link>
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
            <Link href={`/${inviteCode}`} className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-400" />
              <div>
                <h1 className="text-xl font-bold gradient-text">Lucky Draw</h1>
                <p className="text-xs text-gray-500">{game.name}</p>
              </div>
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

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { NameInput } from '@/components/NameInput';
import { createClient } from '@/lib/supabase/client';
import { getPlayerName } from '@/lib/utils';
import { Loader2, Sparkles } from 'lucide-react';
import type { Game, Prize, Draw } from '@/lib/supabase/types';

const GAME_ID = process.env.NEXT_PUBLIC_GAME_ID!;

export default function HomePage() {
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if player already has a name saved
    const savedName = getPlayerName();
    if (savedName) {
      router.push('/game');
      return;
    }

    // Fetch game data
    const fetchData = async () => {
      const supabase = createClient();

      const [gameRes, prizesRes, drawsRes] = await Promise.all([
        supabase.from('games').select('*').eq('id', GAME_ID).single(),
        supabase.from('prizes').select('*').eq('game_id', GAME_ID),
        supabase.from('draws').select('*').eq('game_id', GAME_ID),
      ]);

      if (gameRes.data) setGame(gameRes.data);
      if (prizesRes.data) setPrizes(prizesRes.data);
      if (drawsRes.data) setDraws(drawsRes.data);

      setIsLoading(false);
    };

    fetchData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-yellow-400" />
      </div>
    );
  }

  const remainingSlots = prizes.filter((p) => !p.is_drawn).length;
  const participantCount = draws.length;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="mb-2 flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-yellow-400" />
          <h1 className="text-4xl font-extrabold gradient-text sm:text-5xl">
            Lucky Draw
          </h1>
          <Sparkles className="h-8 w-8 text-yellow-400" />
        </div>
        <p className="text-lg text-gray-400">{game?.name || '2024 송년회 뽑기'}</p>
      </motion.div>

      {/* Game Status */}
      {game?.status === 'waiting' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 rounded-xl bg-yellow-500/20 px-4 py-2 text-yellow-300"
        >
          게임 시작 대기 중...
        </motion.div>
      )}

      {game?.status === 'ended' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 rounded-xl bg-red-500/20 px-4 py-2 text-red-300"
        >
          게임이 종료되었습니다
        </motion.div>
      )}

      {/* Name Input Form */}
      <NameInput participantCount={participantCount} remainingSlots={remainingSlots} />
    </main>
  );
}

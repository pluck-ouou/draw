'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { NameInput } from '@/components/NameInput';
import { Snowfall } from '@/components/Snowfall';
import { createClient } from '@/lib/supabase/client';
import { getPlayerName } from '@/lib/utils';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import type { Game, Prize, Draw } from '@/lib/supabase/types';
import Link from 'next/link';

export default function InviteCodePage() {
  const router = useRouter();
  const params = useParams();
  const inviteCode = (params.inviteCode as string).toUpperCase();

  const [game, setGame] = useState<Game | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // 관리자 페이지 경로 체크 - admin이면 스킵
    if (inviteCode.toLowerCase() === 'admin') {
      return;
    }

    // Fetch game data by invite code
    const fetchData = async () => {
      const supabase = createClient();

      const { data: gameData, error } = await supabase
        .from('games')
        .select('*')
        .eq('invite_code', inviteCode)
        .single();

      if (error || !gameData) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setGame(gameData);

      // Check if player already has a name saved - then redirect to game
      const savedName = getPlayerName();
      if (savedName) {
        router.push(`/game/${inviteCode}`);
        return;
      }

      // Fetch prizes and draws
      const [prizesRes, drawsRes] = await Promise.all([
        supabase.from('prizes').select('*').eq('game_id', gameData.id),
        supabase.from('draws').select('*').eq('game_id', gameData.id),
      ]);

      if (prizesRes.data) setPrizes(prizesRes.data);
      if (drawsRes.data) setDraws(drawsRes.data);

      setIsLoading(false);
    };

    fetchData();
  }, [router, inviteCode]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Snowfall count={30} />
        <Loader2 className="h-12 w-12 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Snowfall count={30} />
        <AlertCircle className="mb-4 h-16 w-16 text-red-400" />
        <h1 className="mb-2 text-2xl font-bold text-white">게임을 찾을 수 없습니다</h1>
        <p className="mb-6 text-gray-400">초대 코드 &quot;{inviteCode}&quot;에 해당하는 게임이 없습니다.</p>
        <Link
          href="/"
          className="rounded-lg bg-yellow-500 px-6 py-3 font-bold text-black hover:bg-yellow-400"
        >
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const remainingSlots = prizes.filter((p) => !p.is_drawn).length;
  const participantCount = draws.length;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Snowfall count={40} />

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
        <p className="text-lg text-gray-400">{game?.name}</p>
        <p className="mt-1 text-sm text-gray-500">초대 코드: {inviteCode}</p>
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
      <NameInput
        participantCount={participantCount}
        remainingSlots={remainingSlots}
        inviteCode={inviteCode}
      />
    </main>
  );
}

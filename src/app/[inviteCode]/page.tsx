'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { NameInput } from '@/components/NameInput';
import { Snowfall } from '@/components/Snowfall';
import { createClient } from '@/lib/supabase/client';
import { getPlayerName } from '@/lib/utils';
import { Loader2, Sparkles, AlertCircle, Gift, Trophy, Clock } from 'lucide-react';
import type { Game, Prize, Draw } from '@/lib/supabase/types';
import Link from 'next/link';
// UI 컴포넌트
import { MarqueeBanner } from '@/components/ui/MarqueeBanner';
import { FloatingBadge } from '@/components/ui/FloatingBadge';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { EventPopup } from '@/components/ui/EventPopup';

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

  // 게임 설정값
  const themeColor = game?.theme_color || '#facc15';
  const showSnow = game?.show_snow ?? true;
  const clientTitle = game?.client_title || game?.name || 'Lucky Draw';
  const clientSubtitle = game?.client_subtitle;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {showSnow && <Snowfall count={30} />}
        <Loader2 className="h-12 w-12 animate-spin" style={{ color: themeColor }} />
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
  const prizeWinners = draws.filter((d) => {
    const prize = prizes.find((p) => p.id === d.prize_id);
    return prize?.prize_grade;
  }).length;

  // 경품 등급별 개수
  const prizesByGrade = prizes.reduce((acc, prize) => {
    if (prize.prize_grade && !prize.is_drawn) {
      acc[prize.prize_grade] = (acc[prize.prize_grade] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <main className="min-h-screen">
      {/* 눈 효과 */}
      {showSnow && <Snowfall count={50} />}

      {/* 마퀴 띠배너 */}
      {game?.marquee_enabled && game?.marquee_text && (
        <MarqueeBanner
          text={game.marquee_text}
          bgColor={themeColor}
          textColor="#000000"
        />
      )}

      {/* 플로팅 뱃지 */}
      {game?.badge_enabled && game?.badge_text && (
        <FloatingBadge
          text={game.badge_text}
          bgColor={game.badge_color || '#ef4444'}
        />
      )}

      {/* 팝업 배너 */}
      {game?.popup_enabled && (
        <EventPopup
          imageUrl={game.popup_image_url || undefined}
          title={game.popup_title || undefined}
          description={game.popup_description || undefined}
          themeColor={themeColor}
        />
      )}

      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        {/* 기업 로고 & 브랜딩 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          {game?.company_logo_url ? (
            <img
              src={game.company_logo_url}
              alt="Logo"
              className="mx-auto mb-4 h-16 w-auto max-w-[200px] object-contain"
            />
          ) : (
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-4 flex justify-center"
            >
              <Gift className="h-16 w-16" style={{ color: themeColor }} />
            </motion.div>
          )}

          <h1
            className="text-4xl font-extrabold sm:text-5xl"
            style={{
              background: `linear-gradient(135deg, ${themeColor} 0%, #fff 50%, ${themeColor} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {clientTitle}
          </h1>
          {clientSubtitle && (
            <p className="mt-2 text-lg text-gray-300">{clientSubtitle}</p>
          )}
        </motion.div>

        {/* 카운트다운 타이머 */}
        {game?.countdown_enabled && game?.event_end_at && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <CountdownTimer endTime={game.event_end_at} themeColor={themeColor} />
          </motion.div>
        )}

        {/* 경품 프리뷰 카드 */}
        {Object.keys(prizesByGrade).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 w-full max-w-md"
          >
            <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 p-4 backdrop-blur">
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5" style={{ color: themeColor }} />
                <span className="font-bold text-white">경품 현황</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Object.entries(prizesByGrade)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([grade, count]) => (
                    <div
                      key={grade}
                      className="rounded-xl bg-gray-700/50 p-3 text-center"
                    >
                      <div
                        className="text-sm font-bold"
                        style={{ color: themeColor }}
                      >
                        {grade}
                      </div>
                      <div className="text-xl font-bold text-white">{count}개</div>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Game Status */}
        {game?.status === 'waiting' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex items-center gap-2 rounded-xl px-4 py-2"
            style={{ backgroundColor: `${themeColor}33` }}
          >
            <Clock className="h-5 w-5" style={{ color: themeColor }} />
            <span style={{ color: themeColor }}>게임 시작 대기 중...</span>
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
          prizeWinners={prizeWinners}
          inviteCode={inviteCode}
          themeColor={themeColor}
        />

        {/* 안내 문구 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-500">
            이름을 입력하고 행운의 오너먼트를 선택하세요!
          </p>
          <p className="mt-1 text-xs text-gray-600">
            초대 코드: <span className="font-mono font-bold" style={{ color: themeColor }}>{inviteCode}</span>
          </p>
        </motion.div>

        {/* 스폰서 로고 */}
        {game?.sponsors && game.sponsors.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 w-full max-w-md"
          >
            <p className="mb-3 text-center text-xs text-gray-500">협찬사</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {game.sponsors.map((sponsor, index) => (
                <a
                  key={index}
                  href={sponsor.link_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-60 transition-opacity hover:opacity-100"
                >
                  {sponsor.logo_url ? (
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.name}
                      className="h-6 max-w-[80px] object-contain"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">{sponsor.name}</span>
                  )}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}

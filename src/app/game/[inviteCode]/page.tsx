'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChristmasTree } from '@/components/ChristmasTree';
import { ResultModal } from '@/components/ResultModal';
import { Snowfall } from '@/components/Snowfall';
import { useGame } from '@/hooks/useGame';
import { getPlayerName } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Sparkles, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
// UI 컴포넌트
import { MarqueeBanner } from '@/components/ui/MarqueeBanner';
import { WinnerToast } from '@/components/ui/WinnerToast';
import { FloatingBadge } from '@/components/ui/FloatingBadge';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { EventPopup } from '@/components/ui/EventPopup';
import { ShareButtons } from '@/components/ui/ShareButtons';
import { EventFooter } from '@/components/ui/EventFooter';

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const inviteCode = params.inviteCode as string;
  const supabase = createClient();

  const { game, template, prizes, draws, playerName, isLoading, stats } = useGame({ inviteCode });

  // 당첨자 정보 변환 (토스트용)
  const winnerInfos = draws
    .filter((d) => {
      const prize = prizes.find((p) => p.id === d.prize_id);
      return prize?.prize_grade;
    })
    .map((d) => {
      const prize = prizes.find((p) => p.id === d.prize_id);
      return {
        id: d.id,
        playerName: d.player_name,
        prizeName: prize?.prize_name || '',
        prizeGrade: prize?.prize_grade || null,
      };
    });

  // 배경음악 관련
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const [bgmVolume, setBgmVolume] = useState(0.5);
  const [audioBlocked, setAudioBlocked] = useState(false); // 자동재생 차단 여부

  // 게임방 설정 (기본값 포함)
  const clientTitle = game?.client_title || game?.name || 'Lucky Draw';
  const clientSubtitle = game?.client_subtitle;
  const themeColor = game?.theme_color || '#facc15';
  const showSnow = game?.show_snow ?? true;
  const showStats = game?.show_stats ?? true;

  useEffect(() => {
    // Redirect if no player name
    const savedName = getPlayerName();
    if (!savedName && !isLoading) {
      router.push(`/${inviteCode}`);
    }
  }, [router, inviteCode, isLoading]);

  // 배경음악 초기 상태 설정
  useEffect(() => {
    if (game) {
      setBgmPlaying(game.bgm_playing ?? false);
      setBgmVolume(game.bgm_volume ?? 0.5);
    }
  }, [game?.bgm_playing, game?.bgm_volume]);

  // 배경음악 재생/정지 처리
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !game?.bgm_url) return;

    audio.volume = isMuted ? 0 : bgmVolume;

    if (bgmPlaying && !isMuted) {
      // 브라우저 자동재생 정책으로 인해 사용자 상호작용 필요할 수 있음
      audio.play().then(() => {
        setAudioBlocked(false);
      }).catch((e) => {
        console.log('자동 재생 차단됨 - 사용자 상호작용 필요:', e);
        setAudioBlocked(true);
      });
    } else {
      audio.pause();
    }
  }, [bgmPlaying, bgmVolume, isMuted, game?.bgm_url]);

  // 사용자 상호작용 후 오디오 재생 시도
  const handleEnableAudio = () => {
    const audio = audioRef.current;
    if (audio && bgmPlaying) {
      audio.play().then(() => {
        setAudioBlocked(false);
      }).catch(console.error);
    }
  };

  // 실시간 브로드캐스트 수신 (재생/정지/볼륨)
  useEffect(() => {
    if (!game?.id) return;

    const channel = supabase.channel(`game-${game.id}`)
      .on('broadcast', { event: 'bgm_control' }, ({ payload }: { payload: { playing: boolean } }) => {
        setBgmPlaying(payload.playing);
      })
      .on('broadcast', { event: 'bgm_volume' }, ({ payload }: { payload: { volume: number } }) => {
        setBgmVolume(payload.volume);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [game?.id, supabase]);

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
    <main className="min-h-screen">
      {/* 배경음악 오디오 엘리먼트 */}
      {game?.bgm_url && (
        <audio ref={audioRef} src={game.bgm_url} loop preload="auto" />
      )}

      {/* Snowfall Effect */}
      {showSnow && <Snowfall count={60} />}

      {/* 마퀴 띠배너 */}
      {game?.marquee_enabled && game?.marquee_text && (
        <MarqueeBanner
          text={game.marquee_text}
          bgColor={themeColor}
          textColor="#000000"
        />
      )}

      {/* 실시간 당첨 토스트 */}
      {game?.toast_enabled && (
        <WinnerToast winners={winnerInfos} themeColor={themeColor} />
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

      <div className="p-4">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mb-4 max-w-4xl"
        >
          <div className="flex items-center justify-between rounded-xl bg-gray-800/50 p-4">
            <div className="flex items-center gap-3">
              {/* 기업 로고 */}
              {game?.company_logo_url ? (
                <img
                  src={game.company_logo_url}
                  alt="Logo"
                  className="h-10 w-auto max-w-[120px] object-contain"
                />
              ) : (
                <Sparkles className="h-6 w-6" style={{ color: themeColor }} />
              )}
              <div>
                <h1 className="text-xl font-bold" style={{ color: themeColor }}>{clientTitle}</h1>
                {clientSubtitle && (
                  <p className="text-xs text-gray-400">{clientSubtitle}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* 음악 컨트롤 버튼 */}
              {game?.bgm_url && bgmPlaying && (
                audioBlocked ? (
                  <button
                    onClick={handleEnableAudio}
                    className="flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-500 animate-pulse"
                  >
                    <Volume2 className="h-4 w-4" />
                    음악 재생
                  </button>
                ) : (
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="rounded-lg bg-gray-700/50 p-2 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                    title={isMuted ? '음소거 해제' : '음소거'}
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                )
              )}
              <div className="text-right">
                <p className="text-sm text-gray-400">안녕하세요,</p>
                <p className="font-bold" style={{ color: themeColor }}>{playerName}님</p>
              </div>
            </div>
          </div>
        </motion.header>

        {/* 카운트다운 타이머 */}
        {game?.countdown_enabled && game?.event_end_at && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto mb-4 max-w-4xl flex justify-center"
          >
            <CountdownTimer endTime={game.event_end_at} themeColor={themeColor} />
          </motion.div>
        )}

        {/* Stats */}
        {showStats && (
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
                <p className="text-lg font-bold" style={{ color: themeColor }}>{stats.remainingSlots}</p>
              </div>
            </div>
          </motion.div>
        )}

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

        {/* 공유 버튼 */}
        {game?.share_enabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mx-auto mt-6 max-w-4xl flex justify-center"
          >
            <ShareButtons
              title={clientTitle}
              description={clientSubtitle || undefined}
              themeColor={themeColor}
            />
          </motion.div>
        )}

        {/* 푸터 */}
        {game?.footer_enabled && (
          <div className="mx-auto max-w-4xl">
            <EventFooter
              footerText={game.footer_text || undefined}
              contactInfo={game.contact_info || undefined}
              privacyUrl={game.privacy_url || undefined}
              sponsors={game.sponsors}
              themeColor={themeColor}
            />
          </div>
        )}
      </div>

      {/* Result Modal */}
      <ResultModal />
    </main>
  );
}

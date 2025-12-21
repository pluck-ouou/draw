'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/client';
import type { Game, Prize, Draw } from '@/lib/supabase/types';
import { Ornament, SpriteConfig, DEFAULT_SPRITE_CONFIG } from '@/components/Ornament';
import type { Template } from '@/lib/supabase/types';
import { SpriteAdjuster } from '@/components/SpriteAdjuster';
import { OrnamentPositionEditor } from '@/components/admin/OrnamentPositionEditor';
import Link from 'next/link';
import {
  Loader2,
  Play,
  Pause,
  Square,
  RefreshCw,
  Download,
  Users,
  Gift,
  Trophy,
  Hash,
  ArrowLeft,
  Copy,
  Check,
  QrCode,
  X,
  Shuffle,
  Save,
  Sliders,
  Settings,
} from 'lucide-react';

const PRIZE_PRESETS = [
  { grade: '1등', name: '상품권 10만원', color: 'text-yellow-400' },
  { grade: '2등', name: '상품권 5만원', color: 'text-orange-400' },
  { grade: '3등', name: '상품권 3만원', color: 'text-purple-400' },
  { grade: '4등', name: '상품권 1만원', color: 'text-blue-400' },
  { grade: '5등', name: '커피 쿠폰', color: 'text-green-400' },
  { grade: null, name: '꽝', color: 'text-gray-500' },
];

export default function AdminGamePage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const [game, setGame] = useState<Game | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [editName, setEditName] = useState('');
  const [editGrade, setEditGrade] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'prize' | 'position'>('prize');

  // 스프라이트 설정
  const [showSpriteSettings, setShowSpriteSettings] = useState(false);
  const [spriteConfig, setSpriteConfig] = useState<SpriteConfig>(DEFAULT_SPRITE_CONFIG);
  const [spriteImageSize, setSpriteImageSize] = useState<{ width: number; height: number } | null>(null);

  // 경품 설정 펼치기
  const [showPrizeSettings, setShowPrizeSettings] = useState(false);

  const supabase = createClient();

  // 스프라이트 이미지 크기 자동 감지
  useEffect(() => {
    const imageUrl = template?.sprite_image;
    if (imageUrl) {
      const img = new window.Image();
      img.onload = () => {
        setSpriteImageSize({ width: img.naturalWidth, height: img.naturalHeight });
        // spriteConfig에 imageWidth/Height가 없으면 자동 설정
        if (!spriteConfig.imageWidth || !spriteConfig.imageHeight) {
          setSpriteConfig(prev => ({
            ...prev,
            imageWidth: img.naturalWidth,
            imageHeight: img.naturalHeight,
          }));
        }
      };
      img.src = imageUrl;
    }
  }, [template?.sprite_image]);


  const fetchData = useCallback(async () => {
    const [gameRes, prizesRes, drawsRes] = await Promise.all([
      supabase.from('games').select('*').eq('id', gameId).single(),
      supabase.from('prizes').select('*').eq('game_id', gameId).order('slot_number'),
      supabase.from('draws').select('*').eq('game_id', gameId).order('drawn_at', { ascending: false }),
    ]);

    if (gameRes.data) {
      setGame(gameRes.data);
      // 템플릿 정보 가져오기
      if (gameRes.data.template_id) {
        const { data: templateData } = await supabase
          .from('templates')
          .select('*')
          .eq('id', gameRes.data.template_id)
          .single();
        if (templateData) {
          setTemplate(templateData);
          // 템플릿의 sprite_config 적용 (imageWidth/imageHeight 유지)
          if (templateData.sprite_config) {
            setSpriteConfig(prev => ({
              ...(templateData.sprite_config as SpriteConfig),
              imageWidth: (templateData.sprite_config as SpriteConfig).imageWidth || prev.imageWidth,
              imageHeight: (templateData.sprite_config as SpriteConfig).imageHeight || prev.imageHeight,
            }));
          }
        }
      }
    }
    if (prizesRes.data) setPrizes(prizesRes.data);
    if (drawsRes.data) setDraws(drawsRes.data);
    setIsLoading(false);
  }, [gameId, supabase]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`admin-${gameId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draws', filter: `game_id=eq.${gameId}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prizes', filter: `game_id=eq.${gameId}` }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData, gameId, supabase]);

  const getGameUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/${game?.invite_code}`;
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(getGameUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateGameStatus = async (status: 'waiting' | 'active' | 'ended') => {
    setIsUpdating(true);
    await supabase.from('games').update({ status, updated_at: new Date().toISOString() }).eq('id', gameId);
    await fetchData();
    setIsUpdating(false);
  };

  const resetGame = async () => {
    if (!confirm('정말 게임을 초기화하시겠습니까?')) return;
    setIsUpdating(true);
    await supabase.rpc('reset_game', { p_game_id: gameId });
    await fetchData();
    setIsUpdating(false);
  };

  const updatePrize = async () => {
    if (!selectedPrize) return;
    setIsUpdating(true);
    await supabase.from('prizes').update({ prize_name: editName, prize_grade: editGrade }).eq('id', selectedPrize.id);
    await fetchData();
    setSelectedPrize(null);
    setIsUpdating(false);
  };

  const randomizePrizes = async () => {
    if (!confirm('경품을 랜덤 배치하시겠습니까?')) return;
    setIsUpdating(true);

    const config = [
      { grade: '1등', name: '상품권 10만원', count: 1 },
      { grade: '2등', name: '상품권 5만원', count: 3 },
      { grade: '3등', name: '상품권 3만원', count: 5 },
      { grade: '4등', name: '상품권 1만원', count: 10 },
      { grade: '5등', name: '커피 쿠폰', count: 20 },
      { grade: null, name: '꽝', count: Math.max(0, prizes.length - 39) },
    ];

    const allPrizes: { grade: string | null; name: string }[] = [];
    config.forEach((c) => { for (let i = 0; i < c.count; i++) allPrizes.push({ grade: c.grade, name: c.name }); });

    for (let i = allPrizes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allPrizes[i], allPrizes[j]] = [allPrizes[j], allPrizes[i]];
    }

    const sorted = [...prizes].sort((a, b) => a.slot_number - b.slot_number);
    for (let i = 0; i < sorted.length && i < allPrizes.length; i++) {
      await supabase.from('prizes').update({ prize_name: allPrizes[i].name, prize_grade: allPrizes[i].grade }).eq('id', sorted[i].id);
    }

    await fetchData();
    setIsUpdating(false);
  };

  const resetAllPrizes = async () => {
    if (!confirm('모든 경품을 꽝으로 초기화하시겠습니까?')) return;
    setIsUpdating(true);
    await supabase.from('prizes').update({ prize_name: '꽝', prize_grade: null }).eq('game_id', gameId);
    await fetchData();
    setIsUpdating(false);
  };

  const shuffleDisplayPositions = async () => {
    if (!confirm('전시 위치를 셔플하시겠습니까?')) return;
    setIsUpdating(true);

    const positions = Array.from({ length: prizes.length }, (_, i) => i + 1);
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    const sorted = [...prizes].sort((a, b) => a.slot_number - b.slot_number);
    for (let i = 0; i < sorted.length; i++) {
      await supabase.from('prizes').update({ display_position: positions[i] }).eq('id', sorted[i].id);
    }

    await fetchData();
    setIsUpdating(false);
  };

  const downloadResults = () => {
    const results = draws.map((draw) => {
      const prize = prizes.find((p) => p.id === draw.prize_id);
      return { 이름: draw.player_name, 번호: prize?.slot_number, 경품: prize?.prize_name, 등급: prize?.prize_grade || '-', 시간: new Date(draw.drawn_at).toLocaleString('ko-KR') };
    });
    const csv = [Object.keys(results[0] || {}).join(','), ...results.map((r) => Object.values(r).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${game?.name}-results.csv`;
    a.click();
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-yellow-400" /></div>;
  if (!game) return <div className="flex min-h-screen items-center justify-center text-white">게임을 찾을 수 없습니다</div>;

  const stats = {
    total: prizes.length,
    drawn: prizes.filter((p) => p.is_drawn).length,
    remaining: prizes.filter((p) => !p.is_drawn).length,
    winners: draws.filter((d) => prizes.find((p) => p.id === d.prize_id)?.prize_grade !== null).length,
    prizeCount: prizes.filter((p) => p.prize_grade !== null).length,
  };

  return (
    <main className="min-h-screen p-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Link href="/admin" className="mb-2 inline-flex items-center gap-1 text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> 목록으로
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text">{game.name}</h1>
              <p className="text-gray-400">초대 코드: <span className="font-mono text-yellow-400">{game.invite_code}</span></p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowQRModal(true)} className="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-white hover:bg-gray-600">
                <QrCode className="h-5 w-5" /> QR코드
              </button>
              <button onClick={copyLink} className="flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 font-bold text-black hover:bg-yellow-400">
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                {copied ? '복사됨!' : '링크 복사'}
              </button>
            </div>
          </div>
        </motion.header>

        {/* Game Control */}
        <section className="mb-6 rounded-xl bg-gray-800/50 p-4">
          <h2 className="mb-4 text-lg font-bold text-white">게임 제어</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-gray-700 px-3 py-2">
              <div className={`h-3 w-3 rounded-full ${game.status === 'active' ? 'bg-green-500 animate-pulse' : game.status === 'waiting' ? 'bg-yellow-500' : 'bg-red-500'}`} />
              <span className="text-white">{game.status === 'waiting' ? '대기 중' : game.status === 'active' ? '진행 중' : '종료됨'}</span>
            </div>
            <button onClick={() => updateGameStatus('active')} disabled={isUpdating || game.status === 'active'} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-500 disabled:opacity-50"><Play className="h-4 w-4" />시작</button>
            <button onClick={() => updateGameStatus('waiting')} disabled={isUpdating || game.status === 'waiting'} className="flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-500 disabled:opacity-50"><Pause className="h-4 w-4" />일시정지</button>
            <button onClick={() => updateGameStatus('ended')} disabled={isUpdating || game.status === 'ended'} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-500 disabled:opacity-50"><Square className="h-4 w-4" />종료</button>
            <button onClick={resetGame} disabled={isUpdating} className="flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-500 disabled:opacity-50"><RefreshCw className="h-4 w-4" />초기화</button>
            <button onClick={downloadResults} disabled={draws.length === 0} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-500 disabled:opacity-50"><Download className="h-4 w-4" />결과 다운로드</button>
          </div>
        </section>

        {/* Stats */}
        <section className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="rounded-xl bg-gray-800/50 p-4 text-center"><Users className="mx-auto mb-2 h-6 w-6 text-blue-400" /><p className="text-2xl font-bold text-white">{draws.length}</p><p className="text-sm text-gray-400">참여자</p></div>
          <div className="rounded-xl bg-gray-800/50 p-4 text-center"><Trophy className="mx-auto mb-2 h-6 w-6 text-yellow-400" /><p className="text-2xl font-bold text-white">{stats.winners}</p><p className="text-sm text-gray-400">당첨자</p></div>
          <div className="rounded-xl bg-gray-800/50 p-4 text-center"><Gift className="mx-auto mb-2 h-6 w-6 text-green-400" /><p className="text-2xl font-bold text-white">{stats.prizeCount - stats.winners}/{stats.prizeCount}</p><p className="text-sm text-gray-400">남은 경품</p></div>
          <div className="rounded-xl bg-gray-800/50 p-4 text-center"><Hash className="mx-auto mb-2 h-6 w-6 text-purple-400" /><p className="text-2xl font-bold text-white">{stats.drawn}</p><p className="text-sm text-gray-400">뽑힌 번호</p></div>
          <div className="rounded-xl bg-gray-800/50 p-4 text-center"><Hash className="mx-auto mb-2 h-6 w-6 text-gray-400" /><p className="text-2xl font-bold text-white">{stats.remaining}</p><p className="text-sm text-gray-400">남은 번호</p></div>
        </section>

        {/* Sprite Settings */}
        <section className="mb-6 rounded-xl bg-gray-800/50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="h-5 w-5" /> 스프라이트 설정
            </h2>
            <button onClick={() => setShowSpriteSettings(!showSpriteSettings)} className="rounded-lg bg-gray-700 px-3 py-1.5 text-sm text-white hover:bg-gray-600">
              {showSpriteSettings ? '접기' : '펼치기'}
            </button>
          </div>

          <AnimatePresence>
            {showSpriteSettings && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mb-4 flex items-center gap-4 rounded-lg bg-gray-900/50 p-4">
                  <div className="text-sm text-gray-400">미리보기:</div>
                  <div className="flex gap-2">
                    {[0, 1, 2, 9, 10, 11].map((i) => (
                      <div key={i} className="flex flex-col items-center">
                        <Ornament index={i} size={48} spriteConfig={spriteConfig} spriteImageUrl={template?.sprite_image || undefined} />
                        <span className="text-[10px] text-gray-500">#{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div><label className="mb-1 block text-xs text-gray-400">셀 너비 (px)</label><input type="number" value={spriteConfig.cellWidth} onChange={(e) => setSpriteConfig({ ...spriteConfig, cellWidth: Number(e.target.value) })} className="w-full rounded-lg bg-gray-700 px-3 py-2 text-white text-sm" /></div>
                  <div><label className="mb-1 block text-xs text-gray-400">셀 높이 (px)</label><input type="number" value={spriteConfig.cellHeight} onChange={(e) => setSpriteConfig({ ...spriteConfig, cellHeight: Number(e.target.value) })} className="w-full rounded-lg bg-gray-700 px-3 py-2 text-white text-sm" /></div>
                  <div><label className="mb-1 block text-xs text-gray-400">열 수</label><input type="number" value={spriteConfig.columns} onChange={(e) => setSpriteConfig({ ...spriteConfig, columns: Number(e.target.value) })} className="w-full rounded-lg bg-gray-700 px-3 py-2 text-white text-sm" /></div>
                  <div><label className="mb-1 block text-xs text-gray-400">행 수</label><input type="number" value={spriteConfig.rows} onChange={(e) => setSpriteConfig({ ...spriteConfig, rows: Number(e.target.value) })} className="w-full rounded-lg bg-gray-700 px-3 py-2 text-white text-sm" /></div>
                  <div><label className="mb-1 block text-xs text-gray-400">X 오프셋 (px)</label><input type="number" value={spriteConfig.offsetX} onChange={(e) => setSpriteConfig({ ...spriteConfig, offsetX: Number(e.target.value) })} className="w-full rounded-lg bg-gray-700 px-3 py-2 text-white text-sm" /></div>
                  <div><label className="mb-1 block text-xs text-gray-400">Y 오프셋 (px)</label><input type="number" value={spriteConfig.offsetY} onChange={(e) => setSpriteConfig({ ...spriteConfig, offsetY: Number(e.target.value) })} className="w-full rounded-lg bg-gray-700 px-3 py-2 text-white text-sm" /></div>
                  <div><label className="mb-1 block text-xs text-gray-400">X 간격 (px)</label><input type="number" value={spriteConfig.gapX} onChange={(e) => setSpriteConfig({ ...spriteConfig, gapX: Number(e.target.value) })} className="w-full rounded-lg bg-gray-700 px-3 py-2 text-white text-sm" /></div>
                  <div><label className="mb-1 block text-xs text-gray-400">Y 간격 (px)</label><input type="number" value={spriteConfig.gapY} onChange={(e) => setSpriteConfig({ ...spriteConfig, gapY: Number(e.target.value) })} className="w-full rounded-lg bg-gray-700 px-3 py-2 text-white text-sm" /></div>
                </div>
                {spriteImageSize && (
                  <div className="mt-2 text-xs text-gray-500">
                    원본 이미지 크기: {spriteImageSize.width} x {spriteImageSize.height}px
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={async () => {
                      if (!game?.template_id) {
                        alert('템플릿이 연결되지 않은 게임입니다.');
                        return;
                      }
                      try {
                        // 이미지 크기가 있으면 함께 저장
                        const configToSave = {
                          ...spriteConfig,
                          imageWidth: spriteImageSize?.width || spriteConfig.imageWidth,
                          imageHeight: spriteImageSize?.height || spriteConfig.imageHeight,
                        };
                        await supabase
                          .from('templates')
                          .update({ sprite_config: configToSave })
                          .eq('id', game.template_id);
                        await fetchData();
                        alert('저장되었습니다.');
                      } catch (error) {
                        console.error('저장 실패:', error);
                        alert('저장에 실패했습니다.');
                      }
                    }}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-500"
                  >
                    <Save className="h-4 w-4" />저장
                  </button>
                  <button onClick={() => setSpriteConfig(DEFAULT_SPRITE_CONFIG)} className="flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-500"><RefreshCw className="h-4 w-4" />기본값</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Display Position Settings */}
        <section className="mb-6 rounded-xl bg-gray-800/50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shuffle className="h-5 w-5" /> 클라이언트 오너먼트 위치 설정
            </h2>
            <button onClick={shuffleDisplayPositions} disabled={isUpdating} className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-50">
              <Shuffle className="h-4 w-4" /> 순서 셔플
            </button>
          </div>
          <OrnamentPositionEditor
            prizes={prizes}
            onUpdate={fetchData}
            backgroundImageUrl={template?.background_image || undefined}
            spriteImageUrl={template?.sprite_image || undefined}
            spriteConfig={spriteConfig}
          />
        </section>

        {/* Prize Settings */}
        <section className="mb-6 rounded-xl bg-gray-800/50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="h-5 w-5" /> 경품 설정
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setShowPrizeSettings(!showPrizeSettings)} className="rounded-lg bg-gray-700 px-3 py-1.5 text-sm text-white hover:bg-gray-600">{showPrizeSettings ? '접기' : '펼치기'}</button>
              <button onClick={randomizePrizes} disabled={isUpdating} className="flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-500 disabled:opacity-50"><Shuffle className="h-4 w-4" />랜덤 배치</button>
              <button onClick={resetAllPrizes} disabled={isUpdating} className="flex items-center gap-1 rounded-lg bg-gray-600 px-3 py-1.5 text-sm text-white hover:bg-gray-500 disabled:opacity-50"><RefreshCw className="h-4 w-4" />모두 꽝으로</button>
            </div>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {PRIZE_PRESETS.map((p) => (<span key={p.grade || 'none'} className={`rounded-full bg-gray-700 px-3 py-1 text-sm ${p.color}`}>{p.grade || '꽝'}: {prizes.filter((pr) => pr.prize_grade === p.grade).length}개</span>))}
          </div>

          <AnimatePresence>
            {showPrizeSettings && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-10 gap-1 rounded-lg bg-gray-900/50 p-2">
                  {prizes.sort((a, b) => a.slot_number - b.slot_number).map((prize) => {
                    const draw = draws.find((d) => d.prize_id === prize.id);
                    return (
                      <button key={prize.id} onClick={() => { setSelectedPrize(prize); setEditName(prize.prize_name); setEditGrade(prize.prize_grade); setModalTab('prize'); }} disabled={prize.is_drawn}
                        className={`relative flex flex-col items-center justify-center rounded-lg p-1 transition-all ${prize.is_drawn ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700 cursor-pointer'} ${prize.prize_grade ? 'ring-1 ring-yellow-500/50' : ''}`}
                        title={`#${prize.slot_number}: ${prize.prize_grade || '꽝'} - ${prize.prize_name}`}>
                        <Ornament index={prize.slot_number - 1} size={36} spriteConfig={spriteConfig} spriteImageUrl={template?.sprite_image || undefined} individualOffset={{ x: prize.offset_x, y: prize.offset_y }} />
                        <span className="text-[10px] text-gray-400">{prize.slot_number}</span>
                        {prize.prize_grade && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 text-[8px] font-bold text-black">{prize.prize_grade.replace('등', '')}</span>}
                        {draw && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-green-600 px-1 text-[8px] text-white">{draw.player_name}</span>}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-center text-xs text-gray-500">오너먼트를 클릭하여 경품을 설정하세요.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Recent Draws */}
        <section className="rounded-xl bg-gray-800/50 p-4">
          <h2 className="mb-4 text-lg font-bold text-white">실시간 뽑기 현황</h2>
          <div className="max-h-96 overflow-y-auto">
            {draws.length === 0 ? <p className="text-center text-gray-500">아직 뽑기 기록이 없습니다.</p> : (
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-800"><tr className="text-left text-sm text-gray-400"><th className="p-2">이름</th><th className="p-2">번호</th><th className="p-2">결과</th><th className="p-2">시간</th></tr></thead>
                <tbody>
                  {draws.map((draw) => {
                    const prize = prizes.find((p) => p.id === draw.prize_id);
                    return (
                      <tr key={draw.id} className={`border-t border-gray-700 ${prize?.prize_grade ? 'bg-yellow-500/10' : ''}`}>
                        <td className="p-2 text-white">{draw.player_name}</td>
                        <td className="p-2 text-gray-300">{prize?.slot_number}</td>
                        <td className="p-2">{prize?.prize_grade ? <span className="text-yellow-400">{prize.prize_grade} - {prize.prize_name}</span> : <span className="text-gray-500">꽝</span>}</td>
                        <td className="p-2 text-sm text-gray-500">{new Date(draw.drawn_at).toLocaleTimeString('ko-KR')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowQRModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-sm rounded-2xl bg-white p-8 text-center" onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-4 text-xl font-bold text-gray-900">{game.name}</h3>
              <div className="mx-auto mb-4 inline-block rounded-xl bg-white p-4">
                <QRCodeSVG value={getGameUrl()} size={200} />
              </div>
              <p className="mb-2 text-2xl font-mono font-bold text-yellow-600">{game.invite_code}</p>
              <p className="text-sm text-gray-500 break-all">{getGameUrl()}</p>
              <button onClick={() => setShowQRModal(false)} className="mt-6 w-full rounded-lg bg-gray-900 py-3 text-white hover:bg-gray-800">닫기</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prize Edit Modal */}
      <AnimatePresence>
        {selectedPrize && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedPrize(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-md rounded-2xl bg-gray-800 p-6" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">#{selectedPrize.slot_number} 오너먼트</h3>
                <button onClick={() => setSelectedPrize(null)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
              </div>

              {/* 탭 */}
              <div className="mb-4 flex rounded-lg bg-gray-700 p-1">
                <button onClick={() => setModalTab('prize')} className={`flex-1 rounded-md px-3 py-2 text-sm transition-all ${modalTab === 'prize' ? 'bg-yellow-500 text-black font-bold' : 'text-gray-300 hover:text-white'}`}>경품 설정</button>
                <button onClick={() => setModalTab('position')} className={`flex-1 rounded-md px-3 py-2 text-sm transition-all ${modalTab === 'position' ? 'bg-yellow-500 text-black font-bold' : 'text-gray-300 hover:text-white'}`}>위치 조정</button>
              </div>

              {modalTab === 'prize' ? (
                <>
                  <div className="mb-4 flex justify-center">
                    <Ornament index={selectedPrize.slot_number - 1} size={80} spriteConfig={spriteConfig} spriteImageUrl={template?.sprite_image || undefined} individualOffset={{ x: selectedPrize.offset_x, y: selectedPrize.offset_y }} />
                  </div>
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {PRIZE_PRESETS.map((p) => (
                      <button key={p.grade || 'none'} onClick={() => { setEditGrade(p.grade); setEditName(p.name); }}
                        className={`rounded-lg px-3 py-2 text-sm ${editGrade === p.grade ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>{p.grade || '꽝'}</button>
                    ))}
                  </div>
                  <div className="mb-4">
                    <label className="mb-2 block text-sm text-gray-400">등급</label>
                    <input type="text" value={editGrade || ''} onChange={(e) => setEditGrade(e.target.value || null)} placeholder="예: 1등, 특별상" className="w-full rounded-lg bg-gray-700 px-4 py-2 text-white" />
                  </div>
                  <div className="mb-4">
                    <label className="mb-2 block text-sm text-gray-400">경품명</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="예: 상품권 10만원" className="w-full rounded-lg bg-gray-700 px-4 py-2 text-white" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setSelectedPrize(null)} className="flex-1 rounded-lg bg-gray-700 py-2 text-white hover:bg-gray-600">취소</button>
                    <button onClick={updatePrize} disabled={isUpdating || !editName} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-yellow-500 py-2 font-bold text-black hover:bg-yellow-400 disabled:opacity-50">
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 저장
                    </button>
                  </div>
                </>
              ) : (
                <SpriteAdjuster
                  index={selectedPrize.slot_number - 1}
                  currentOffsetX={selectedPrize.offset_x}
                  currentOffsetY={selectedPrize.offset_y}
                  spriteConfig={spriteConfig}
                  spriteImageUrl={template?.sprite_image || undefined}
                  onSave={async (offsetX, offsetY) => {
                    await supabase.from('prizes').update({ offset_x: offsetX, offset_y: offsetY }).eq('id', selectedPrize.id);
                    await fetchData();
                  }}
                  onClose={() => setSelectedPrize(null)}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

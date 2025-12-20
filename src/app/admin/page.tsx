'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { Game } from '@/lib/supabase/types';
import Link from 'next/link';
import {
  Loader2,
  Plus,
  ChevronRight,
  Sparkles,
  Users,
  Calendar,
  X,
} from 'lucide-react';

export default function AdminPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameSlots, setNewGameSlots] = useState(100);
  const [isCreating, setIsCreating] = useState(false);

  const supabase = createClient();

  const fetchGames = async () => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setGames(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const createGame = async () => {
    if (!newGameName.trim()) return;

    setIsCreating(true);

    try {
      // 1. 게임 생성
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          name: newGameName.trim(),
          status: 'waiting',
          total_slots: newGameSlots,
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // 2. 경품 슬롯 생성
      const prizes = Array.from({ length: newGameSlots }, (_, i) => ({
        game_id: gameData.id,
        slot_number: i + 1,
        prize_name: '꽝',
        prize_grade: null,
        is_drawn: false,
        display_position: i + 1,
        offset_x: 0,
        offset_y: 0,
      }));

      const { error: prizesError } = await supabase.from('prizes').insert(prizes);

      if (prizesError) throw prizesError;

      // 성공
      setShowCreateModal(false);
      setNewGameName('');
      setNewGameSlots(100);
      await fetchGames();
    } catch (error) {
      console.error('게임 생성 실패:', error);
      alert('게임 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return (
          <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs text-yellow-400">
            대기 중
          </span>
        );
      case 'active':
        return (
          <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">
            진행 중
          </span>
        );
      case 'ended':
        return (
          <span className="rounded-full bg-gray-500/20 px-2 py-1 text-xs text-gray-400">
            종료됨
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-yellow-400" />
                <h1 className="text-3xl font-bold gradient-text">관리자</h1>
              </div>
              <p className="mt-1 text-gray-400">게임을 생성하고 관리하세요</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 font-bold text-black hover:bg-yellow-400"
            >
              <Plus className="h-5 w-5" />
              새 게임 만들기
            </button>
          </div>
        </motion.header>

        {/* Games List */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {games.length === 0 ? (
            <div className="rounded-xl bg-gray-800/50 p-12 text-center">
              <Sparkles className="mx-auto mb-4 h-12 w-12 text-gray-600" />
              <h2 className="mb-2 text-xl font-bold text-white">게임이 없습니다</h2>
              <p className="mb-6 text-gray-400">
                새 게임을 만들어 럭키 드로우를 시작하세요!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-6 py-3 font-bold text-black hover:bg-yellow-400"
              >
                <Plus className="h-5 w-5" />
                새 게임 만들기
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {games.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={`/admin/${game.id}`}
                    className="group flex items-center justify-between rounded-xl bg-gray-800/50 p-4 transition-all hover:bg-gray-800"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-white group-hover:text-yellow-400">
                          {game.name}
                        </h3>
                        {getStatusBadge(game.status)}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {game.total_slots} 슬롯
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(game.created_at).toLocaleDateString('ko-KR')}
                        </span>
                        <span className="font-mono text-yellow-400">
                          코드: {game.invite_code}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-yellow-400" />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>

      {/* Create Game Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-gray-800 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">새 게임 만들기</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    게임 이름
                  </label>
                  <input
                    type="text"
                    value={newGameName}
                    onChange={(e) => setNewGameName(e.target.value)}
                    placeholder="예: 2024 송년회 럭키드로우"
                    className="w-full rounded-lg bg-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    슬롯 개수 (오너먼트 수)
                  </label>
                  <input
                    type="number"
                    value={newGameSlots}
                    onChange={(e) => setNewGameSlots(Number(e.target.value))}
                    min={10}
                    max={200}
                    className="w-full rounded-lg bg-gray-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">10 ~ 200개 사이</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-lg bg-gray-700 px-4 py-3 text-white hover:bg-gray-600"
                >
                  취소
                </button>
                <button
                  onClick={createGame}
                  disabled={isCreating || !newGameName.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-yellow-500 px-4 py-3 font-bold text-black hover:bg-yellow-400 disabled:opacity-50"
                >
                  {isCreating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      만들기
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

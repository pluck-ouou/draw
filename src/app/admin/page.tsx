'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { Game, Template, TemplateSlot } from '@/lib/supabase/types';
import Link from 'next/link';
import {
  Loader2,
  Plus,
  ChevronRight,
  Sparkles,
  Users,
  Calendar,
  X,
  Palette,
  Gamepad2,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';

type TabType = 'games' | 'templates';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('games');
  const [games, setGames] = useState<Game[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 게임 생성 모달
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  // 템플릿 생성 모달
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateSlots, setNewTemplateSlots] = useState(100);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  const supabase = createClient();

  const fetchGames = async () => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setGames(data);
    }
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setTemplates(data as Template[]);
      // 기본 템플릿이 있으면 선택
      const defaultTemplate = (data as Template[]).find((t: Template) => t.is_default);
      if (defaultTemplate && !selectedTemplateId) {
        setSelectedTemplateId(defaultTemplate.id);
      }
    }
  };

  useEffect(() => {
    Promise.all([fetchGames(), fetchTemplates()]).then(() => {
      setIsLoading(false);
    });
  }, []);

  // 템플릿에서 슬롯 정보 가져오기
  const fetchTemplateSlots = async (templateId: string): Promise<TemplateSlot[]> => {
    const { data, error } = await supabase
      .from('template_slots')
      .select('*')
      .eq('template_id', templateId)
      .order('slot_number');

    if (error) throw error;
    return data || [];
  };

  // 게임 생성 (템플릿 클론)
  const createGame = async () => {
    if (!newGameName.trim() || !selectedTemplateId) return;

    setIsCreating(true);

    try {
      // 1. 템플릿 정보 가져오기
      const template = templates.find(t => t.id === selectedTemplateId);
      if (!template) throw new Error('템플릿을 찾을 수 없습니다');

      // 2. 템플릿 슬롯 가져오기
      const templateSlots = await fetchTemplateSlots(selectedTemplateId);

      // 3. 게임 생성
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          name: newGameName.trim(),
          status: 'waiting',
          total_slots: template.total_slots,
          template_id: selectedTemplateId,
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // 4. 경품 슬롯 생성 (템플릿에서 복사)
      let prizes;
      if (templateSlots.length > 0) {
        // 템플릿 슬롯이 있으면 복사
        prizes = templateSlots.map((slot) => ({
          game_id: gameData.id,
          slot_number: slot.slot_number,
          prize_name: slot.default_prize_name || '꽝',
          prize_grade: slot.default_prize_grade,
          is_drawn: false,
          display_position: slot.slot_number,
          offset_x: slot.offset_x,
          offset_y: slot.offset_y,
          position_top: slot.position_top,
          position_left: slot.position_left,
        }));
      } else {
        // 템플릿 슬롯이 없으면 기본값으로 생성
        prizes = Array.from({ length: template.total_slots }, (_, i) => ({
          game_id: gameData.id,
          slot_number: i + 1,
          prize_name: '꽝',
          prize_grade: null,
          is_drawn: false,
          display_position: i + 1,
          offset_x: 0,
          offset_y: 0,
        }));
      }

      const { error: prizesError } = await supabase.from('prizes').insert(prizes);

      if (prizesError) throw prizesError;

      // 성공
      setShowCreateModal(false);
      setNewGameName('');
      await fetchGames();
    } catch (error) {
      console.error('게임 생성 실패:', error);
      alert('게임 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  // 템플릿 생성
  const createTemplate = async () => {
    if (!newTemplateName.trim()) return;

    setIsCreatingTemplate(true);

    try {
      // 1. 템플릿 생성
      const { data: templateData, error: templateError } = await supabase
        .from('templates')
        .insert({
          name: newTemplateName.trim(),
          description: newTemplateDesc.trim() || null,
          total_slots: newTemplateSlots,
          is_default: templates.length === 0, // 첫 템플릿은 기본값
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // 2. 기본 슬롯 생성
      const slots = Array.from({ length: newTemplateSlots }, (_, i) => ({
        template_id: templateData.id,
        slot_number: i + 1,
        offset_x: 0,
        offset_y: 0,
        default_prize_name: '꽝',
      }));

      const { error: slotsError } = await supabase.from('template_slots').insert(slots);

      if (slotsError) throw slotsError;

      // 성공
      setShowTemplateModal(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
      setNewTemplateSlots(100);
      await fetchTemplates();
    } catch (error) {
      console.error('템플릿 생성 실패:', error);
      alert('템플릿 생성에 실패했습니다.');
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  // 템플릿 삭제
  const deleteTemplate = async (templateId: string) => {
    if (!confirm('정말 이 템플릿을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      await fetchTemplates();
    } catch (error) {
      console.error('템플릿 삭제 실패:', error);
      alert('템플릿 삭제에 실패했습니다.');
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
          className="mb-6"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-yellow-400" />
            <h1 className="text-3xl font-bold gradient-text">관리자</h1>
          </div>
          <p className="mt-1 text-gray-400">게임과 템플릿을 관리하세요</p>
        </motion.header>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('games')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all ${
              activeTab === 'games'
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Gamepad2 className="h-4 w-4" />
            게임 목록
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all ${
              activeTab === 'templates'
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Palette className="h-4 w-4" />
            템플릿 관리
          </button>
        </div>

        {/* Games Tab */}
        {activeTab === 'games' && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 font-bold text-black hover:bg-yellow-400"
              >
                <Plus className="h-5 w-5" />
                새 게임 만들기
              </button>
            </div>

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
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 font-bold text-white hover:bg-purple-400"
              >
                <Plus className="h-5 w-5" />
                새 템플릿 만들기
              </button>
            </div>

            {templates.length === 0 ? (
              <div className="rounded-xl bg-gray-800/50 p-12 text-center">
                <Palette className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                <h2 className="mb-2 text-xl font-bold text-white">템플릿이 없습니다</h2>
                <p className="mb-6 text-gray-400">
                  테마 템플릿을 만들어 게임에 적용하세요!
                </p>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-6 py-3 font-bold text-white hover:bg-purple-400"
                >
                  <Plus className="h-5 w-5" />
                  새 템플릿 만들기
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group flex items-center justify-between rounded-xl bg-gray-800/50 p-4 transition-all hover:bg-gray-800"
                  >
                    <Link
                      href={`/admin/template/${template.id}`}
                      className="flex-1"
                    >
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-white group-hover:text-purple-400">
                          {template.name}
                        </h3>
                        {template.is_default && (
                          <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs text-purple-400">
                            기본
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {template.total_slots} 슬롯
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(template.created_at).toLocaleDateString('ko-KR')}
                        </span>
                        {template.description && (
                          <span className="text-gray-500">{template.description}</span>
                        )}
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/template/${template.id}`}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-700 hover:text-white"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                      {!template.is_default && (
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-400"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
        )}
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
                    템플릿 선택
                  </label>
                  {templates.length === 0 ? (
                    <div className="rounded-lg bg-gray-700 p-4 text-center text-gray-400">
                      <p className="mb-2">템플릿이 없습니다</p>
                      <button
                        onClick={() => {
                          setShowCreateModal(false);
                          setActiveTab('templates');
                          setShowTemplateModal(true);
                        }}
                        className="text-sm text-purple-400 hover:text-purple-300"
                      >
                        템플릿 만들러 가기 →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => setSelectedTemplateId(template.id)}
                          className={`w-full rounded-lg p-3 text-left transition-all ${
                            selectedTemplateId === template.id
                              ? 'bg-yellow-500/20 ring-2 ring-yellow-500'
                              : 'bg-gray-700 hover:bg-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-white">{template.name}</span>
                              {template.is_default && (
                                <span className="ml-2 text-xs text-purple-400">(기본)</span>
                              )}
                            </div>
                            {selectedTemplateId === template.id && (
                              <Check className="h-5 w-5 text-yellow-400" />
                            )}
                          </div>
                          <div className="mt-1 text-sm text-gray-400">
                            {template.total_slots}개 슬롯
                            {template.description && ` • ${template.description}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
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
                  disabled={isCreating || !newGameName.trim() || !selectedTemplateId}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-yellow-500 px-4 py-3 font-bold text-black hover:bg-yellow-400 disabled:opacity-50"
                >
                  {isCreating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Copy className="h-5 w-5" />
                      템플릿으로 생성
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Template Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowTemplateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-gray-800 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">새 템플릿 만들기</h2>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    템플릿 이름
                  </label>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="예: 크리스마스 2024"
                    className="w-full rounded-lg bg-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    설명 (선택)
                  </label>
                  <input
                    type="text"
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    placeholder="예: 크리스마스 트리와 오너먼트 테마"
                    className="w-full rounded-lg bg-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    슬롯 개수
                  </label>
                  <input
                    type="number"
                    value={newTemplateSlots}
                    onChange={(e) => setNewTemplateSlots(Number(e.target.value))}
                    min={10}
                    max={200}
                    className="w-full rounded-lg bg-gray-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">10 ~ 200개 사이</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 rounded-lg bg-gray-700 px-4 py-3 text-white hover:bg-gray-600"
                >
                  취소
                </button>
                <button
                  onClick={createTemplate}
                  disabled={isCreatingTemplate || !newTemplateName.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-500 px-4 py-3 font-bold text-white hover:bg-purple-400 disabled:opacity-50"
                >
                  {isCreatingTemplate ? (
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

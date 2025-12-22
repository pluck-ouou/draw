'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import type { Reservation, ReservationStatus } from '@/lib/supabase/types';
import Link from 'next/link';
import {
  Loader2,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Building2,
  Users,
  ArrowLeft,
  Check,
  X,
  AlertCircle,
  FileText,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit3,
  Save,
  LogOut,
  CalendarDays,
} from 'lucide-react';

const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: '대기중', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  confirmed: { label: '확정', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  cancelled: { label: '취소됨', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  completed: { label: '완료', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
};

export default function AdminReservationsPage() {
  const { isLoading: authLoading, isAuthenticated, isSuper, profile, logout } = useAdminAuth({});

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [filterStatus, setFilterStatus] = useState<ReservationStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editNote, setEditNote] = useState('');

  const supabase = createClient();

  const fetchReservations = useCallback(async () => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setReservations(data);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchReservations();
    }
  }, [isAuthenticated, fetchReservations]);

  // 상태 업데이트
  const updateStatus = async (id: string, status: ReservationStatus) => {
    setIsUpdating(true);
    await supabase.from('reservations').update({ status }).eq('id', id);
    await fetchReservations();
    if (selectedReservation?.id === id) {
      setSelectedReservation(prev => prev ? { ...prev, status } : null);
    }
    setIsUpdating(false);
  };

  // 메모 저장
  const saveNote = async (id: string) => {
    setIsUpdating(true);
    await supabase.from('reservations').update({ admin_note: editNote }).eq('id', id);
    await fetchReservations();
    if (selectedReservation?.id === id) {
      setSelectedReservation(prev => prev ? { ...prev, admin_note: editNote } : null);
    }
    setIsUpdating(false);
  };

  // 예약 삭제
  const deleteReservation = async (id: string) => {
    if (!confirm('정말 이 예약을 삭제하시겠습니까?')) return;
    setIsUpdating(true);
    await supabase.from('reservations').delete().eq('id', id);
    await fetchReservations();
    setSelectedReservation(null);
    setIsUpdating(false);
  };

  // 필터링
  const filteredReservations = reservations.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch = searchQuery === '' ||
      r.customer_name.includes(searchQuery) ||
      r.phone.includes(searchQuery) ||
      r.email.includes(searchQuery) ||
      r.company_name?.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  // 통계
  const stats = {
    total: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    completed: reservations.filter(r => r.status === 'completed').length,
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // 슈퍼 관리자만 접근 가능
  if (!isSuper) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <AlertCircle className="mb-4 h-16 w-16 text-red-400" />
        <h1 className="mb-2 text-2xl font-bold text-white">접근 권한 없음</h1>
        <p className="mb-6 text-gray-400">슈퍼 관리자만 예약 관리에 접근할 수 있습니다.</p>
        <Link href="/admin" className="rounded-lg bg-yellow-500 px-6 py-3 font-bold text-black hover:bg-yellow-400">
          관리자 홈으로
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <Link href="/admin" className="inline-flex items-center gap-1 text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> 관리자 홈
            </Link>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-400">{profile?.email}</p>
                <p className="text-xs text-yellow-400">슈퍼관리자</p>
              </div>
              <button onClick={logout} className="rounded-lg bg-gray-700 p-2 text-gray-400 hover:bg-gray-600 hover:text-white">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-yellow-400" />
            <h1 className="text-3xl font-bold gradient-text">예약 관리</h1>
          </div>
        </motion.header>

        {/* 통계 */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-gray-800/50 p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-sm text-gray-400">전체 예약</p>
          </div>
          <div className="rounded-xl bg-yellow-500/20 p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            <p className="text-sm text-gray-400">대기중</p>
          </div>
          <div className="rounded-xl bg-green-500/20 p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{stats.confirmed}</p>
            <p className="text-sm text-gray-400">확정</p>
          </div>
          <div className="rounded-xl bg-blue-500/20 p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.completed}</p>
            <p className="text-sm text-gray-400">완료</p>
          </div>
        </div>

        {/* 필터 & 검색 */}
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl bg-gray-800/50 p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ReservationStatus | 'all')}
              className="rounded-lg bg-gray-700 px-3 py-2 text-white"
            >
              <option value="all">전체 상태</option>
              <option value="pending">대기중</option>
              <option value="confirmed">확정</option>
              <option value="cancelled">취소됨</option>
              <option value="completed">완료</option>
            </select>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, 연락처, 이메일로 검색..."
              className="w-full rounded-lg bg-gray-700 px-4 py-2 pl-10 text-white placeholder-gray-500"
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 예약 목록 */}
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-gray-800/50 p-4">
              <h2 className="mb-4 text-lg font-bold text-white">예약 목록 ({filteredReservations.length})</h2>

              {filteredReservations.length === 0 ? (
                <p className="text-center text-gray-500 py-8">예약이 없습니다.</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredReservations.map((reservation) => (
                    <motion.div
                      key={reservation.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => {
                        setSelectedReservation(reservation);
                        setEditNote(reservation.admin_note || '');
                      }}
                      className={`cursor-pointer rounded-lg bg-gray-700/50 p-4 transition-all hover:bg-gray-700 ${selectedReservation?.id === reservation.id ? 'ring-2 ring-yellow-500' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="font-bold text-white">{reservation.customer_name}</span>
                            {reservation.company_name && (
                              <span className="text-sm text-gray-400">({reservation.company_name})</span>
                            )}
                            <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_CONFIG[reservation.status].bgColor} ${STATUS_CONFIG[reservation.status].color}`}>
                              {STATUS_CONFIG[reservation.status].label}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(reservation.event_date).toLocaleDateString('ko-KR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {reservation.event_time}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {reservation.phone}
                            </span>
                            {reservation.expected_participants && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {reservation.expected_participants}명
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          {new Date(reservation.created_at).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedReservation ? (
                <motion.div
                  key={selectedReservation.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="rounded-xl bg-gray-800/50 p-4 sticky top-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">예약 상세</h2>
                    <button
                      onClick={() => setSelectedReservation(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* 상태 변경 버튼 */}
                  <div className="mb-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateStatus(selectedReservation.id, 'confirmed')}
                      disabled={isUpdating || selectedReservation.status === 'confirmed'}
                      className="flex items-center justify-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-500 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" /> 확정
                    </button>
                    <button
                      onClick={() => updateStatus(selectedReservation.id, 'cancelled')}
                      disabled={isUpdating || selectedReservation.status === 'cancelled'}
                      className="flex items-center justify-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-500 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" /> 취소
                    </button>
                    <button
                      onClick={() => updateStatus(selectedReservation.id, 'pending')}
                      disabled={isUpdating || selectedReservation.status === 'pending'}
                      className="flex items-center justify-center gap-1 rounded-lg bg-yellow-600 px-3 py-2 text-sm text-white hover:bg-yellow-500 disabled:opacity-50"
                    >
                      <Clock className="h-4 w-4" /> 대기
                    </button>
                    <button
                      onClick={() => updateStatus(selectedReservation.id, 'completed')}
                      disabled={isUpdating || selectedReservation.status === 'completed'}
                      className="flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" /> 완료
                    </button>
                  </div>

                  {/* 고객 정보 */}
                  <div className="mb-4 space-y-2 rounded-lg bg-gray-700/50 p-3">
                    <div className="flex items-center gap-2 text-white">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-bold">{selectedReservation.customer_name}</span>
                    </div>
                    {selectedReservation.company_name && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        {selectedReservation.company_name}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-300">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${selectedReservation.phone}`} className="hover:text-yellow-400">
                        {selectedReservation.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${selectedReservation.email}`} className="hover:text-yellow-400">
                        {selectedReservation.email}
                      </a>
                    </div>
                  </div>

                  {/* 이벤트 정보 */}
                  <div className="mb-4 space-y-2 rounded-lg bg-gray-700/50 p-3">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Calendar className="h-4 w-4" />
                      {new Date(selectedReservation.event_date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long',
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Clock className="h-4 w-4" />
                      {selectedReservation.event_time}
                    </div>
                    {selectedReservation.expected_participants && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Users className="h-4 w-4 text-gray-400" />
                        예상 {selectedReservation.expected_participants}명
                      </div>
                    )}
                  </div>

                  {/* 이벤트 설명 */}
                  {selectedReservation.event_description && (
                    <div className="mb-4 rounded-lg bg-gray-700/50 p-3">
                      <p className="text-sm text-gray-300">{selectedReservation.event_description}</p>
                    </div>
                  )}

                  {/* 동의 항목 */}
                  <div className="mb-4 rounded-lg bg-gray-700/50 p-3">
                    <p className="mb-2 text-xs text-gray-400">동의 항목</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`rounded-full px-2 py-1 ${selectedReservation.terms_agreed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        이용약관 {selectedReservation.terms_agreed ? '✓' : '✗'}
                      </span>
                      <span className={`rounded-full px-2 py-1 ${selectedReservation.privacy_agreed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        개인정보 {selectedReservation.privacy_agreed ? '✓' : '✗'}
                      </span>
                      <span className={`rounded-full px-2 py-1 ${selectedReservation.marketing_agreed ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'}`}>
                        마케팅 {selectedReservation.marketing_agreed ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>

                  {/* 관리자 메모 */}
                  <div className="mb-4">
                    <label className="mb-1 flex items-center gap-1 text-xs text-gray-400">
                      <Edit3 className="h-3 w-3" /> 관리자 메모
                    </label>
                    <textarea
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="내부 메모를 입력하세요..."
                      rows={3}
                      className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500"
                    />
                    <button
                      onClick={() => saveNote(selectedReservation.id)}
                      disabled={isUpdating}
                      className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-500 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" /> 메모 저장
                    </button>
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => deleteReservation(selectedReservation.id)}
                    disabled={isUpdating}
                    className="w-full flex items-center justify-center gap-1 rounded-lg bg-red-700 px-3 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" /> 예약 삭제
                  </button>

                  {/* 타임스탬프 */}
                  <div className="mt-4 text-center text-xs text-gray-500">
                    신청일: {new Date(selectedReservation.created_at).toLocaleString('ko-KR')}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl bg-gray-800/50 p-8 text-center"
                >
                  <FileText className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                  <p className="text-gray-500">예약을 선택하면 상세 정보가 표시됩니다</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}

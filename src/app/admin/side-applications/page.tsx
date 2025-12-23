'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import Link from 'next/link';
import {
  Loader2,
  ArrowLeft,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Phone,
  User,
  Gift,
  RefreshCw,
  LogOut,
} from 'lucide-react';

interface SideApplication {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminSideApplicationsPage() {
  const { isLoading: authLoading, isAuthenticated, isSuper, profile, logout } = useAdminAuth({});
  const [applications, setApplications] = useState<SideApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<SideApplication | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');

  const supabase = createClient();

  const fetchApplications = useCallback(async () => {
    const { data, error } = await supabase
      .from('side_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch applications:', error);
      return;
    }

    setApplications(data || []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchApplications();

    // 실시간 구독
    const channel = supabase
      .channel('side-applications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'side_applications' }, () => {
        fetchApplications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchApplications, supabase]);

  const updateStatus = async (id: string, status: 'pending' | 'confirmed' | 'cancelled') => {
    await supabase.from('side_applications').update({ status }).eq('id', id);
    await fetchApplications();
    if (selectedApp?.id === id) {
      setSelectedApp({ ...selectedApp, status });
    }
  };

  const saveNote = async () => {
    if (!selectedApp) return;
    await supabase.from('side_applications').update({ admin_note: adminNote }).eq('id', selectedApp.id);
    await fetchApplications();
    setSelectedApp({ ...selectedApp, admin_note: adminNote });
  };

  const deleteApplication = async (id: string) => {
    if (!confirm('이 신청을 삭제하시겠습니까?')) return;
    await supabase.from('side_applications').delete().eq('id', id);
    await fetchApplications();
    if (selectedApp?.id === id) {
      setSelectedApp(null);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    confirmed: applications.filter((a) => a.status === 'confirmed').length,
    cancelled: applications.filter((a) => a.status === 'cancelled').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs text-yellow-400">대기중</span>;
      case 'confirmed':
        return <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">확정</span>;
      case 'cancelled':
        return <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-400">취소</span>;
      default:
        return null;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (!isAuthenticated || !isSuper) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Gift className="mb-4 h-16 w-16 text-red-400" />
        <h1 className="mb-2 text-2xl font-bold text-white">접근 권한이 없습니다</h1>
        <p className="mb-6 text-gray-400">슈퍼 관리자만 접근할 수 있습니다.</p>
        <Link href="/admin" className="rounded-lg bg-yellow-500 px-6 py-3 font-bold text-black hover:bg-yellow-400">
          관리자 홈으로
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4">
      <div className="mx-auto max-w-6xl">
        {/* 헤더 */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <Link href="/admin" className="inline-flex items-center gap-1 text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> 관리자 홈
            </Link>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-400">{profile?.email}</p>
                <p className="text-xs text-yellow-400">슈퍼관리자</p>
              </div>
              <button
                onClick={logout}
                className="rounded-lg bg-gray-700 p-2 text-gray-400 hover:bg-gray-600 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Gift className="h-7 w-7 text-red-400" />
                크리스마스 특가 신청 관리
              </h1>
              <p className="text-gray-400">웹사이트 제작 50만원 특가 신청자 목록</p>
            </div>
            <button
              onClick={fetchApplications}
              className="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-white hover:bg-gray-600"
            >
              <RefreshCw className="h-4 w-4" />
              새로고침
            </button>
          </div>
        </motion.header>

        {/* 통계 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          <div className="rounded-xl bg-gray-800/50 p-4 text-center">
            <Users className="mx-auto mb-2 h-6 w-6 text-blue-400" />
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-sm text-gray-400">전체 신청</p>
          </div>
          <div className="rounded-xl bg-gray-800/50 p-4 text-center">
            <Clock className="mx-auto mb-2 h-6 w-6 text-yellow-400" />
            <p className="text-2xl font-bold text-white">{stats.pending}</p>
            <p className="text-sm text-gray-400">대기중</p>
          </div>
          <div className="rounded-xl bg-gray-800/50 p-4 text-center">
            <CheckCircle className="mx-auto mb-2 h-6 w-6 text-green-400" />
            <p className="text-2xl font-bold text-white">{stats.confirmed}</p>
            <p className="text-sm text-gray-400">확정</p>
          </div>
          <div className="rounded-xl bg-gray-800/50 p-4 text-center">
            <XCircle className="mx-auto mb-2 h-6 w-6 text-red-400" />
            <p className="text-2xl font-bold text-white">{stats.cancelled}</p>
            <p className="text-sm text-gray-400">취소</p>
          </div>
        </motion.section>

        {/* 필터 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 flex gap-2"
        >
          {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {f === 'all' ? '전체' : f === 'pending' ? '대기중' : f === 'confirmed' ? '확정' : '취소'}
              {f !== 'all' && ` (${stats[f]})`}
            </button>
          ))}
        </motion.div>

        {/* 신청 목록 & 상세 */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 목록 */}
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 rounded-xl bg-gray-800/50 p-4"
          >
            <h2 className="mb-4 text-lg font-bold text-white">신청 목록 ({filteredApplications.length}건)</h2>

            {filteredApplications.length === 0 ? (
              <p className="text-center text-gray-500 py-8">신청 내역이 없습니다.</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredApplications.map((app) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => {
                      setSelectedApp(app);
                      setAdminNote(app.admin_note || '');
                    }}
                    className={`cursor-pointer rounded-lg p-4 transition-all ${
                      selectedApp?.id === app.id
                        ? 'bg-yellow-500/20 border border-yellow-500/50'
                        : 'bg-gray-700/50 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-600">
                          <User className="h-5 w-5 text-gray-300" />
                        </div>
                        <div>
                          <p className="font-bold text-white">{app.name}</p>
                          <p className="text-sm text-gray-400 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {app.phone}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(app.status)}
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(app.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>

          {/* 상세 */}
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-xl bg-gray-800/50 p-4"
          >
            <h2 className="mb-4 text-lg font-bold text-white">상세 정보</h2>

            <AnimatePresence mode="wait">
              {selectedApp ? (
                <motion.div
                  key={selectedApp.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="rounded-lg bg-gray-700/50 p-4">
                    <p className="text-sm text-gray-400 mb-1">이름</p>
                    <p className="text-xl font-bold text-white">{selectedApp.name}</p>
                  </div>

                  <div className="rounded-lg bg-gray-700/50 p-4">
                    <p className="text-sm text-gray-400 mb-1">전화번호</p>
                    <a href={`tel:${selectedApp.phone}`} className="text-lg text-yellow-400 hover:underline">
                      {selectedApp.phone}
                    </a>
                  </div>

                  <div className="rounded-lg bg-gray-700/50 p-4">
                    <p className="text-sm text-gray-400 mb-1">신청일시</p>
                    <p className="text-white">
                      {new Date(selectedApp.created_at).toLocaleString('ko-KR')}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-700/50 p-4">
                    <p className="text-sm text-gray-400 mb-2">상태 변경</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(selectedApp.id, 'pending')}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm ${
                          selectedApp.status === 'pending'
                            ? 'bg-yellow-500 text-black'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        대기중
                      </button>
                      <button
                        onClick={() => updateStatus(selectedApp.id, 'confirmed')}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm ${
                          selectedApp.status === 'confirmed'
                            ? 'bg-green-500 text-black'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        확정
                      </button>
                      <button
                        onClick={() => updateStatus(selectedApp.id, 'cancelled')}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm ${
                          selectedApp.status === 'cancelled'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        취소
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-700/50 p-4">
                    <p className="text-sm text-gray-400 mb-2">관리자 메모</p>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="메모를 입력하세요..."
                      rows={3}
                      className="w-full rounded-lg bg-gray-600 px-3 py-2 text-sm text-white placeholder-gray-400"
                    />
                    <button
                      onClick={saveNote}
                      className="mt-2 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500"
                    >
                      메모 저장
                    </button>
                  </div>

                  <button
                    onClick={() => deleteApplication(selectedApp.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600/20 px-3 py-2 text-sm text-red-400 hover:bg-red-600/30"
                  >
                    <Trash2 className="h-4 w-4" />
                    신청 삭제
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-500 py-8"
                >
                  <Gift className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>신청을 선택하세요</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </div>
      </div>
    </main>
  );
}

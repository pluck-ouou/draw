'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Snowfall } from '@/components/Snowfall';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Building2,
  Users,
  FileText,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

// 한국 시간대
const KST_OFFSET = 9 * 60; // 분 단위

// 시간 옵션 생성 (09:00 ~ 22:00, 30분 단위)
const TIME_OPTIONS = Array.from({ length: 27 }, (_, i) => {
  const hour = Math.floor(i / 2) + 9;
  const minute = (i % 2) * 30;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

// 캘린더 헬퍼 함수
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function ReservePage() {
  const supabase = createClient();

  // 폼 상태
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    company_name: '',
    expected_participants: '',
    event_description: '',
    terms_agreed: false,
    privacy_agreed: false,
    marketing_agreed: false,
  });

  // 날짜/시간 상태
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // UI 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 입력값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // 에러 클리어
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 전화번호 포맷팅
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 유효성 검사
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = '성함을 입력해주세요';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '연락처를 입력해주세요';
    } else if (!/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(formData.phone.replace(/-/g, ''))) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다';
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }

    if (!selectedDate) {
      newErrors.date = '이벤트 날짜를 선택해주세요';
    }

    if (!selectedTime) {
      newErrors.time = '이벤트 시간을 선택해주세요';
    }

    if (!formData.terms_agreed) {
      newErrors.terms_agreed = '이용약관에 동의해주세요';
    }

    if (!formData.privacy_agreed) {
      newErrors.privacy_agreed = '개인정보 처리방침에 동의해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // 한국 시간 기준으로 datetime 생성
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const eventDatetime = new Date(selectedDate!);
      eventDatetime.setHours(hours, minutes, 0, 0);

      const { error } = await supabase.from('reservations').insert({
        customer_name: formData.customer_name.trim(),
        phone: formData.phone.replace(/-/g, ''),
        email: formData.email.trim(),
        company_name: formData.company_name.trim() || null,
        event_date: selectedDate!.toISOString().split('T')[0],
        event_time: selectedTime,
        event_datetime: eventDatetime.toISOString(),
        expected_participants: formData.expected_participants ? Number(formData.expected_participants) : null,
        event_description: formData.event_description.trim() || null,
        terms_agreed: formData.terms_agreed,
        privacy_agreed: formData.privacy_agreed,
        marketing_agreed: formData.marketing_agreed,
      });

      if (error) throw error;

      setSubmitResult({
        success: true,
        message: '예약 신청이 완료되었습니다!\n담당자가 확인 후 연락드리겠습니다.',
      });
    } catch (error) {
      console.error('예약 실패:', error);
      setSubmitResult({
        success: false,
        message: '예약 신청 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 월 변경
  const changeMonth = (delta: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  };

  // 날짜 선택 가능 여부 (오늘 이후만)
  const isDateSelectable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  // 캘린더 렌더링
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // 빈 칸 채우기
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // 날짜 채우기
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isSelected = selectedDate?.toDateString() === date.toDateString();
      const isSelectable = isDateSelectable(date);
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => isSelectable && setSelectedDate(date)}
          disabled={!isSelectable}
          className={`h-10 w-10 rounded-full text-sm font-medium transition-all
            ${isSelected ? 'bg-yellow-500 text-black' : ''}
            ${isToday && !isSelected ? 'ring-2 ring-yellow-500/50' : ''}
            ${isSelectable && !isSelected ? 'hover:bg-gray-700 text-white' : ''}
            ${!isSelectable ? 'text-gray-600 cursor-not-allowed' : ''}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  // 결과 화면
  if (submitResult) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Snowfall count={30} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-2xl bg-gray-800/80 backdrop-blur p-8 text-center"
        >
          {submitResult.success ? (
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-400" />
          ) : (
            <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-400" />
          )}
          <h2 className={`mb-4 text-2xl font-bold ${submitResult.success ? 'text-green-400' : 'text-red-400'}`}>
            {submitResult.success ? '예약 신청 완료!' : '오류 발생'}
          </h2>
          <p className="mb-6 text-gray-300 whitespace-pre-line">{submitResult.message}</p>
          <Link
            href="/"
            className="inline-block rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black hover:bg-yellow-400"
          >
            홈으로 돌아가기
          </Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <Snowfall count={40} />

      <div className="mx-auto max-w-2xl">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="mb-2 flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-yellow-400" />
            <h1 className="text-3xl font-bold text-white sm:text-4xl">이벤트 예약</h1>
            <Sparkles className="h-8 w-8 text-yellow-400" />
          </div>
          <p className="text-gray-400">럭키드로우 이벤트를 예약해보세요</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* 고객 정보 */}
          <div className="rounded-2xl bg-gray-800/50 backdrop-blur p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <User className="h-5 w-5 text-yellow-400" />
              고객 정보
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-400">
                  성함 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  placeholder="홍길동"
                  className={`w-full rounded-lg bg-gray-700 px-4 py-3 text-white placeholder-gray-500 ${errors.customer_name ? 'ring-2 ring-red-500' : ''}`}
                />
                {errors.customer_name && <p className="mt-1 text-xs text-red-400">{errors.customer_name}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-400">
                  연락처 <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      setFormData(prev => ({ ...prev, phone: formatted }));
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    placeholder="010-1234-5678"
                    className={`w-full rounded-lg bg-gray-700 px-4 py-3 pl-10 text-white placeholder-gray-500 ${errors.phone ? 'ring-2 ring-red-500' : ''}`}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-400">
                  이메일 <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    className={`w-full rounded-lg bg-gray-700 px-4 py-3 pl-10 text-white placeholder-gray-500 ${errors.email ? 'ring-2 ring-red-500' : ''}`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-400">회사/단체명</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="(주)OOO"
                    className="w-full rounded-lg bg-gray-700 px-4 py-3 pl-10 text-white placeholder-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 이벤트 정보 */}
          <div className="rounded-2xl bg-gray-800/50 backdrop-blur p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <Calendar className="h-5 w-5 text-yellow-400" />
              이벤트 일시
            </h2>

            {/* 캘린더 */}
            <div className="mb-6 rounded-xl bg-gray-700/50 p-4">
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-600 hover:text-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h3 className="text-lg font-bold text-white">
                  {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                </h3>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-600 hover:text-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-2 grid grid-cols-7 text-center text-sm text-gray-500">
                {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                  <div key={day} className={day === '일' ? 'text-red-400' : day === '토' ? 'text-blue-400' : ''}>
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 place-items-center gap-1">
                {renderCalendar()}
              </div>

              {errors.date && <p className="mt-2 text-center text-xs text-red-400">{errors.date}</p>}
            </div>

            {/* 시간 선택 */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                이벤트 시간 <span className="text-red-400">*</span>
                <span className="text-xs text-gray-500">(한국시간 기준)</span>
              </label>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {TIME_OPTIONS.map(time => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-all
                      ${selectedTime === time
                        ? 'bg-yellow-500 text-black'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
              {errors.time && <p className="mt-2 text-xs text-red-400">{errors.time}</p>}
            </div>

            {/* 선택된 일시 표시 */}
            {selectedDate && selectedTime && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-lg bg-yellow-500/20 p-3 text-center"
              >
                <p className="text-yellow-400">
                  📅 {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 {selectedTime}
                </p>
              </motion.div>
            )}
          </div>

          {/* 추가 정보 */}
          <div className="rounded-2xl bg-gray-800/50 backdrop-blur p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <FileText className="h-5 w-5 text-yellow-400" />
              추가 정보
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm text-gray-400">
                  <Users className="h-4 w-4" />
                  예상 참여 인원
                </label>
                <input
                  type="number"
                  name="expected_participants"
                  value={formData.expected_participants}
                  onChange={handleChange}
                  placeholder="예: 100"
                  min="1"
                  className="w-full rounded-lg bg-gray-700 px-4 py-3 text-white placeholder-gray-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-400">이벤트 설명 (선택)</label>
                <textarea
                  name="event_description"
                  value={formData.event_description}
                  onChange={handleChange}
                  placeholder="이벤트에 대한 추가 설명이나 요청사항을 입력해주세요..."
                  rows={3}
                  className="w-full rounded-lg bg-gray-700 px-4 py-3 text-white placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* 동의 항목 */}
          <div className="rounded-2xl bg-gray-800/50 backdrop-blur p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <Check className="h-5 w-5 text-yellow-400" />
              약관 동의
            </h2>

            <div className="space-y-3">
              <label className={`flex cursor-pointer items-start gap-3 rounded-lg bg-gray-700/50 p-3 ${errors.terms_agreed ? 'ring-2 ring-red-500' : ''}`}>
                <input
                  type="checkbox"
                  name="terms_agreed"
                  checked={formData.terms_agreed}
                  onChange={handleChange}
                  className="mt-1 h-5 w-5 rounded accent-yellow-500"
                />
                <div>
                  <span className="text-white">[필수] 이용약관 동의</span>
                  <p className="text-xs text-gray-500">서비스 이용을 위한 필수 약관입니다.</p>
                </div>
              </label>

              <label className={`flex cursor-pointer items-start gap-3 rounded-lg bg-gray-700/50 p-3 ${errors.privacy_agreed ? 'ring-2 ring-red-500' : ''}`}>
                <input
                  type="checkbox"
                  name="privacy_agreed"
                  checked={formData.privacy_agreed}
                  onChange={handleChange}
                  className="mt-1 h-5 w-5 rounded accent-yellow-500"
                />
                <div>
                  <span className="text-white">[필수] 개인정보 처리방침 동의</span>
                  <p className="text-xs text-gray-500">예약 처리를 위해 개인정보를 수집합니다.</p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-gray-700/50 p-3">
                <input
                  type="checkbox"
                  name="marketing_agreed"
                  checked={formData.marketing_agreed}
                  onChange={handleChange}
                  className="mt-1 h-5 w-5 rounded accent-yellow-500"
                />
                <div>
                  <span className="text-white">[선택] 마케팅 정보 수신 동의</span>
                  <p className="text-xs text-gray-500">이벤트, 프로모션 등 유용한 정보를 받아보세요.</p>
                </div>
              </label>
            </div>
          </div>

          {/* 제출 버튼 */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 py-4 text-lg font-bold text-black shadow-lg shadow-yellow-500/25 transition-all hover:from-yellow-400 hover:to-amber-400 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                예약 신청 중...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                예약 신청하기
              </span>
            )}
          </motion.button>
        </motion.form>

        {/* 홈 링크 */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-yellow-400">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}

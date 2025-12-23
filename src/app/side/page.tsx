'use client';

import { Snowfall } from '@/components/Snowfall';
import { SideTermsModal } from '@/components/ui/SideTermsModal';
import { createClient } from '@/lib/supabase/client';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Gift, Loader2, Phone, Sparkles, Star, TreePine, User } from 'lucide-react';
import { useState, useEffect } from 'react';

// 이벤트 마감 카운트다운 타겟 (2025년 12월 31일 자정)
const EVENT_END_DATE = new Date('2025-12-31T23:59:59');

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(): TimeLeft {
  const now = new Date();
  const difference = EVENT_END_DATE.getTime() - now.getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export default function SidePage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsModalType, setTermsModalType] = useState<'terms' | 'privacy' | 'marketing'>('terms');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  const supabase = createClient();

  // 카운트다운 업데이트
  useEffect(() => {
    setMounted(true);
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 전화번호 포맷팅
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    const phoneNumbers = phone.replace(/\D/g, '');
    if (phoneNumbers.length < 10) {
      setError('올바른 전화번호를 입력해주세요.');
      return;
    }

    if (!termsAgreed || !privacyAgreed) {
      setError('필수 약관에 동의해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: insertError } = await supabase
        .from('side_applications')
        .insert({
          name: name.trim(),
          phone: phone.trim(),
          terms_agreed: termsAgreed,
          privacy_agreed: privacyAgreed,
          marketing_agreed: marketingAgreed,
        });

      if (insertError) throw insertError;

      setIsSuccess(true);
    } catch (err) {
      console.error('신청 실패:', err);
      setError('신청에 실패했습니다. 다시 시도해주세요.');
    }

    setIsSubmitting(false);
  };

  if (isSuccess) {
    return (
      <main className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
        <Snowfall count={100} />

        {/* 배경 장식 */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-900/30 via-red-900/20 to-green-900/30" />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 w-full max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30"
          >
            <Check className="h-12 w-12 text-white" />
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-4 text-3xl font-bold text-white"
          >
            신청이 완료되었습니다!
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8 text-gray-300"
          >
            빠른 시일 내에 연락드리겠습니다.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl bg-white/10 backdrop-blur-sm p-6 border border-white/20"
          >
            <p className="text-sm text-gray-400 mb-2">신청 정보</p>
            <p className="text-lg font-bold text-white">{name}</p>
            <p className="text-gray-300">{phone}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 flex justify-center gap-2 text-yellow-400"
          >
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span className="text-sm">Merry Christmas!</span>
            <Sparkles className="h-5 w-5 animate-pulse" />
          </motion.div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <Snowfall count={80} />

      {/* 배경 장식 */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-900/30 via-red-900/20 to-green-900/30" />

      {/* 장식 요소들 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-10 left-10 text-yellow-400"
      >
        <Star className="h-8 w-8 animate-pulse" fill="currentColor" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-20 right-16 text-yellow-300"
      >
        <Star className="h-6 w-6 animate-pulse" fill="currentColor" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        className="absolute bottom-0 left-0 text-green-600"
      >
        <TreePine className="h-40 w-40" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        className="absolute bottom-0 right-0 text-green-600"
      >
        <TreePine className="h-32 w-32" />
      </motion.div>

      <div className="relative z-10 w-full max-w-md">
        {/* 카운트다운 */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6"
        >
          <div className="text-center mb-2">
            <span className="text-sm text-yellow-400 font-medium">특가 마감까지</span>
          </div>
          <div className="flex justify-center gap-2 sm:gap-3">
            {[
              { value: mounted ? timeLeft.days : 0, label: '일' },
              { value: mounted ? timeLeft.hours : 0, label: '시간' },
              { value: mounted ? timeLeft.minutes : 0, label: '분' },
              { value: mounted ? timeLeft.seconds : 0, label: '초' },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ scale: 0, rotateY: 180 }}
                animate={{ scale: 1, rotateY: 0 }}
                transition={{ delay: index * 0.1, type: 'spring' }}
                className="relative"
              >
                <div className="w-16 sm:w-20 h-20 sm:h-24 rounded-xl bg-gradient-to-b from-red-600 to-red-700 border-2 border-red-400/50 shadow-lg shadow-red-500/30 flex flex-col items-center justify-center">
                  <motion.span
                    key={item.value}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-2xl sm:text-4xl font-black text-white"
                  >
                    {String(item.value).padStart(2, '0')}
                  </motion.span>
                  <span className="text-[10px] sm:text-xs text-red-200 font-medium mt-1">{item.label}</span>
                </div>
                {/* 눈 장식 효과 */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full opacity-60" />
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-3">
            <span className="text-xs text-gray-400">2025년 12월 31일 마감</span>
          </div>
        </motion.div>

        {/* 헤더 */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center mb-4"
          >
            <div className="relative">
              <Gift className="h-16 w-16 text-red-500" />
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="h-6 w-6 text-yellow-400" />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-block rounded-full bg-red-500 px-4 py-1 text-sm font-bold text-white mb-4"
          >
            선착순 3분 한정!
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl sm:text-3xl font-bold text-white mb-2"
          >
            크리스마스 이벤트
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl sm:text-2xl font-bold text-white mb-4"
          >
            웹사이트(랜딩페이지) 제작<span className="text-yellow-400">특가</span>
            <p></p>
          </motion.h2>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="inline-block"
          >
            <div className="relative">
              <span className="text-gray-400 line-through text-lg">150만원</span>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.8, duration: 0.3 }}
                className="absolute top-1/2 left-0 h-0.5 bg-red-500"
              />
            </div>
            <div className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-400 to-yellow-400 animate-pulse">
              50만원
            </div>
          </motion.div>
        </motion.div>

        {/* 신청 폼 */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="rounded-3xl bg-white/10 backdrop-blur-md p-6 sm:p-8 border border-white/20 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                <User className="h-4 w-4" />
                이름
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                <Phone className="h-4 w-4" />
                전화번호
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="010-1234-5678"
                maxLength={13}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all"
              />
            </div>

            {/* 약관 동의 */}
            <div className="space-y-3 rounded-xl bg-white/5 p-4 border border-white/10">
              <p className="text-sm font-medium text-gray-300 mb-3">약관 동의</p>

              {/* 이용약관 */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setTermsAgreed(!termsAgreed)}
                  className="flex items-center gap-3 group"
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    termsAgreed
                      ? 'bg-gradient-to-r from-red-500 to-red-600 border-red-500'
                      : 'border-gray-500 group-hover:border-red-400'
                  }`}>
                    {termsAgreed && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-gray-300">
                    <span className="text-red-400 font-medium">[필수]</span> 이용약관 동의
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTermsModalType('terms');
                    setTermsModalOpen(true);
                  }}
                  className="text-xs text-yellow-400 hover:text-yellow-300 underline"
                >
                  보기
                </button>
              </div>

              {/* 개인정보 처리방침 */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPrivacyAgreed(!privacyAgreed)}
                  className="flex items-center gap-3 group"
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    privacyAgreed
                      ? 'bg-gradient-to-r from-red-500 to-red-600 border-red-500'
                      : 'border-gray-500 group-hover:border-red-400'
                  }`}>
                    {privacyAgreed && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-gray-300">
                    <span className="text-red-400 font-medium">[필수]</span> 개인정보 처리방침 동의
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTermsModalType('privacy');
                    setTermsModalOpen(true);
                  }}
                  className="text-xs text-yellow-400 hover:text-yellow-300 underline"
                >
                  보기
                </button>
              </div>

              {/* 마케팅 수신 동의 */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMarketingAgreed(!marketingAgreed)}
                  className="flex items-center gap-3 group"
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    marketingAgreed
                      ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-500'
                      : 'border-gray-500 group-hover:border-green-400'
                  }`}>
                    {marketingAgreed && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-gray-300">
                    <span className="text-gray-500">[선택]</span> 마케팅 정보 수신 동의
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTermsModalType('marketing');
                    setTermsModalOpen(true);
                  }}
                  className="text-xs text-yellow-400 hover:text-yellow-300 underline"
                >
                  보기
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-400 text-sm text-center"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-xl bg-gradient-to-r from-red-500 via-red-600 to-red-500 py-4 text-lg font-bold text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  신청 중...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Gift className="h-5 w-5" />
                  특가 신청하기
                </span>
              )}
            </motion.button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-500">
            * 신청 후 빠른 시일 내에 연락드립니다.
          </p>
        </motion.div>

        {/* 하단 장식 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center"
        >
          <div className="flex justify-center gap-3 text-2xl">
            🎄 🎁 ⭐ 🎅 🎄
          </div>
        </motion.div>
      </div>

      {/* 약관 모달 */}
      <SideTermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        type={termsModalType}
      />
    </main>
  );
}

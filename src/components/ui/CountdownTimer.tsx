'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endTime: string; // ISO 날짜 문자열
  themeColor?: string;
  onEnd?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer({
  endTime,
  themeColor = '#facc15',
  onEnd,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endTime).getTime() - new Date().getTime();

      if (difference <= 0) {
        setIsEnded(true);
        onEnd?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onEnd]);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-800 text-xl font-bold"
        style={{ color: themeColor }}
      >
        {String(value).padStart(2, '0')}
      </motion.div>
      <span className="mt-1 text-xs text-gray-500">{label}</span>
    </div>
  );

  if (isEnded) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-500/20 px-4 py-2">
        <Clock className="h-5 w-5 text-red-400" />
        <span className="font-bold text-red-400">이벤트가 종료되었습니다</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-800/50 px-4 py-3">
      <Clock className="h-5 w-5" style={{ color: themeColor }} />
      <span className="text-sm text-gray-400">종료까지</span>
      <div className="flex gap-2">
        {timeLeft.days > 0 && <TimeBlock value={timeLeft.days} label="일" />}
        <TimeBlock value={timeLeft.hours} label="시간" />
        <TimeBlock value={timeLeft.minutes} label="분" />
        <TimeBlock value={timeLeft.seconds} label="초" />
      </div>
    </div>
  );
}

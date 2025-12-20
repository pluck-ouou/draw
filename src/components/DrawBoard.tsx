'use client';

import { motion } from 'framer-motion';
import { SlotCard } from './SlotCard';
import { useGame } from '@/hooks/useGame';
import { useGameStore } from '@/store/gameStore';
import { Loader2 } from 'lucide-react';

export function DrawBoard() {
  const { prizes, draws, myDraw, hasParticipated, isDrawing, drawPrize, game } =
    useGame();
  const { selectedSlot, setSelectedSlot } = useGameStore();

  const isGameActive = game?.status === 'active';
  const canDraw = isGameActive && !hasParticipated;

  const handleSlotClick = async (slotNumber: number) => {
    if (!canDraw || isDrawing) return;

    const prize = prizes.find((p) => p.slot_number === slotNumber);
    if (!prize || prize.is_drawn) return;

    setSelectedSlot(slotNumber);
    await drawPrize(slotNumber);
    setSelectedSlot(null);
  };

  const getDrawForPrize = (prizeId: string) => {
    return draws.find((d) => d.prize_id === prizeId);
  };

  return (
    <div className="w-full">
      {/* Status Bar */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-gray-800/50 p-3">
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              isGameActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
            }`}
          />
          <span className="text-sm text-gray-300">
            {game?.status === 'waiting'
              ? '대기 중'
              : game?.status === 'active'
              ? '진행 중'
              : '종료됨'}
          </span>
        </div>
        <div className="text-sm text-gray-400">
          남은 기회: {prizes.filter((p) => !p.is_drawn).length} / {prizes.length}
        </div>
      </div>

      {/* Draw Board Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-5 gap-1.5 sm:grid-cols-10 sm:gap-2"
      >
        {prizes
          .sort((a, b) => a.slot_number - b.slot_number)
          .map((prize) => {
            const draw = getDrawForPrize(prize.id);
            const isMyDrawSlot = myDraw?.prize_id === prize.id;

            return (
              <SlotCard
                key={prize.id}
                prize={prize}
                draw={draw}
                isMyDraw={isMyDrawSlot}
                disabled={!canDraw}
                isDrawing={isDrawing && selectedSlot === prize.slot_number}
                onClick={() => handleSlotClick(prize.slot_number)}
              />
            );
          })}
      </motion.div>

      {/* Participation Status */}
      {hasParticipated && myDraw && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 p-4 text-center"
        >
          <p className="text-yellow-300">
            이미 참여하셨습니다! (
            {prizes.find((p) => p.id === myDraw.prize_id)?.slot_number}번)
          </p>
        </motion.div>
      )}

      {/* Loading Overlay */}
      {isDrawing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="h-12 w-12 text-yellow-400" />
          </motion.div>
        </div>
      )}
    </div>
  );
}

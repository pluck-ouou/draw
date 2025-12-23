'use client';

import { useGame } from '@/hooks/useGame';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Ornament, SpriteConfig } from './Ornament';

// 트리 모양에 맞는 오너먼트 위치 (삼각형 패턴)
// 각 행의 오너먼트 개수: 1, 3, 5, 7, 9, 11, 13, 15, 17, 19 = 100개
const TREE_ROWS = [
  { count: 1, top: 6 },    // 꼭대기
  { count: 3, top: 12 },
  { count: 5, top: 18 },
  { count: 7, top: 24 },
  { count: 9, top: 30 },
  { count: 11, top: 37 },
  { count: 13, top: 44 },
  { count: 15, top: 52 },
  { count: 17, top: 60 },
  { count: 19, top: 68 },  // 가장 아래
];

function getOrnamentPositions() {
  const positions: { row: number; col: number; top: number; left: number }[] = [];

  TREE_ROWS.forEach((row, rowIndex) => {
    const spacing = 4.2; // 오너먼트 간 간격
    const startLeft = 50 - ((row.count - 1) * spacing) / 2; // 중앙 정렬
    for (let i = 0; i < row.count; i++) {
      positions.push({
        row: rowIndex,
        col: i,
        top: row.top,
        left: startLeft + i * spacing,
      });
    }
  });

  return positions;
}

// 위치를 미리 계산 (컴포넌트 외부에서)
const ORNAMENT_POSITIONS = getOrnamentPositions();

export function ChristmasTree() {
  const { prizes, hasParticipated, isDrawing, drawPrize, game, template } = useGame();
  const { selectedSlot, setSelectedSlot } = useGameStore();

  const isGameActive = game?.status === 'active';
  const canDraw = isGameActive && !hasParticipated;

  // 템플릿 이미지 URL (템플릿이 있으면 사용, 없으면 기본값)
  const backgroundImageUrl = template?.background_image || '/tree.png';
  const spriteImageUrl = template?.sprite_image || undefined;
  const baseSpriteConfig = template?.sprite_config as SpriteConfig | undefined;

  // 스프라이트 이미지 실제 크기를 감지해서 spriteConfig 보정
  const [spriteConfig, setSpriteConfig] = useState<SpriteConfig | undefined>(baseSpriteConfig);

  useEffect(() => {
    if (spriteImageUrl) {
      const img = new window.Image();
      img.onload = () => {
        // 실제 이미지 크기로 spriteConfig 업데이트
        setSpriteConfig(prev => ({
          ...(baseSpriteConfig || prev || { columns: 10, rows: 10, cellWidth: 154, cellHeight: 154, offsetX: 0, offsetY: 0, gapX: 0, gapY: 0 }),
          imageWidth: img.naturalWidth,
          imageHeight: img.naturalHeight,
        }));
      };
      img.src = spriteImageUrl;
    } else {
      // 스프라이트 이미지가 없으면 기본 설정 사용
      setSpriteConfig(baseSpriteConfig);
    }
  }, [spriteImageUrl, baseSpriteConfig]);

  const handleOrnamentClick = async (slotNumber: number) => {
    if (!canDraw || isDrawing) return;

    const prize = prizes.find((p) => p.slot_number === slotNumber);
    if (!prize || prize.is_drawn) return;

    setSelectedSlot(slotNumber);
    await drawPrize(slotNumber);
    setSelectedSlot(null);
  };

  // display_position 기준으로 정렬 (트리에서의 표시 위치)
  // display_position이 1인 prize가 트리의 첫 번째 위치에 표시됨
  const sortedPrizes = [...prizes].sort((a, b) => a.display_position - b.display_position);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Tree Container */}
      <div className="relative w-full" style={{ paddingBottom: '100%' }}>
        {/* Tree Background Image */}
         <img
          src={backgroundImageUrl}
          alt="Christmas Tree"
          className="absolute  object-contain pointer-events-none"
          style={{ zIndex: 0 }}
        />

        {/* Ornaments Layer */}
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          {sortedPrizes.map((prize, index) => {
            // DB에 위치가 있으면 사용, 없으면 기본 위치 사용
            const defaultPos = ORNAMENT_POSITIONS[index] || { top: 50, left: 50 };
            const top = prize.position_top ?? defaultPos.top;
            const left = prize.position_left ?? defaultPos.left;

            const isDrawn = prize.is_drawn;
            const isSelected = selectedSlot === prize.slot_number;

            // 뽑힌 오너먼트는 숨김
            if (isDrawn) return null;

            // 각 오너먼트마다 다른 흔들림 패턴
            const swingDuration = 2 + (index % 5) * 0.3; // 2~3.2초
            const swingDelay = (index % 7) * 0.2; // 시작 딜레이
            const swingAmount = 3 + (index % 3); // 3~5도

            return (
              <motion.div
                key={prize.id}
                className="absolute origin-top"
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                initial={{ opacity: 0, scale: 0, rotate: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: [swingAmount, -swingAmount, swingAmount],
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  opacity: { delay: index * 0.01, duration: 0.3 },
                  scale: { delay: index * 0.01, duration: 0.3 },
                  rotate: {
                    delay: swingDelay,
                    duration: swingDuration,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
                }}
                whileHover={canDraw ? { scale: 1.3, zIndex: 20, rotate: 0 } : undefined}
                whileTap={canDraw ? { scale: 0.9 } : undefined}
              >
                <button
                  onClick={() => handleOrnamentClick(prize.slot_number)}
                  disabled={!canDraw || isDrawing}
                  className={`
                    relative transition-all duration-200
                    ${canDraw ? 'cursor-pointer hover:drop-shadow-[0_0_12px_rgba(255,215,0,0.9)]' : 'cursor-default'}
                  `}
                >
                  <Ornament
                    index={prize.slot_number - 1}
                    size={28}
                    individualOffset={{ x: prize.offset_x, y: prize.offset_y }}
                    spriteConfig={spriteConfig}
                    spriteImageUrl={spriteImageUrl}
                    itemImageUrl={prize.item_image_url}
                  />

                  {/* 선택 중 로딩 */}
                  {isSelected && isDrawing && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
                    </motion.div>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

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

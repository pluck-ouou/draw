'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ornament, SpriteConfig } from '../Ornament';
import { Prize } from '@/lib/supabase/types';
import { createClient } from '@/lib/supabase/client';
import { Save, RefreshCw, Loader2, Move, ZoomIn, ZoomOut } from 'lucide-react';

// 기본 트리 위치 (삼각형 패턴)
const TREE_ROWS = [
  { count: 1, top: 6 },
  { count: 3, top: 12 },
  { count: 5, top: 18 },
  { count: 7, top: 24 },
  { count: 9, top: 30 },
  { count: 11, top: 37 },
  { count: 13, top: 44 },
  { count: 15, top: 52 },
  { count: 17, top: 60 },
  { count: 19, top: 68 },
];

function getDefaultPositions(): { top: number; left: number }[] {
  const positions: { top: number; left: number }[] = [];
  TREE_ROWS.forEach((row) => {
    const spacing = 4.2;
    const startLeft = 50 - ((row.count - 1) * spacing) / 2;
    for (let i = 0; i < row.count; i++) {
      positions.push({
        top: row.top,
        left: startLeft + i * spacing,
      });
    }
  });
  return positions;
}

const DEFAULT_POSITIONS = getDefaultPositions();

interface OrnamentPositionEditorProps {
  prizes: Prize[];
  onUpdate: () => void;
  backgroundImageUrl?: string;
  spriteImageUrl?: string;
  spriteConfig?: SpriteConfig;
}

export function OrnamentPositionEditor({
  prizes,
  onUpdate,
  backgroundImageUrl,
  spriteImageUrl,
  spriteConfig,
}: OrnamentPositionEditorProps) {
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tempPositions, setTempPositions] = useState<Record<string, { top: number; left: number }>>({});
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // 초기 위치 설정
  useEffect(() => {
    const positions: Record<string, { top: number; left: number }> = {};
    prizes.forEach((prize) => {
      const defaultPos = DEFAULT_POSITIONS[prize.display_position - 1] || { top: 50, left: 50 };
      positions[prize.id] = {
        top: prize.position_top ?? defaultPos.top,
        left: prize.position_left ?? defaultPos.left,
      };
    });
    setTempPositions(positions);
  }, [prizes]);

  const handleMouseDown = (prize: Prize, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedPrize(prize);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedPrize || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // 범위 제한 (0~100%)
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    setTempPositions((prev) => ({
      ...prev,
      [selectedPrize.id]: { top: clampedY, left: clampedX },
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 개별 저장
  const savePosition = async (prize: Prize) => {
    const pos = tempPositions[prize.id];
    if (!pos) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('prizes')
      .update({
        position_top: Math.round(pos.top * 100) / 100,
        position_left: Math.round(pos.left * 100) / 100,
      })
      .eq('id', prize.id);

    if (error) {
      alert('저장 실패: ' + error.message);
    }
    setIsSaving(false);
    onUpdate();
  };

  // 전체 저장
  const saveAllPositions = async () => {
    setIsSaving(true);

    for (const prize of prizes) {
      const pos = tempPositions[prize.id];
      if (pos) {
        await supabase
          .from('prizes')
          .update({
            position_top: Math.round(pos.top * 100) / 100,
            position_left: Math.round(pos.left * 100) / 100,
          })
          .eq('id', prize.id);
      }
    }

    alert('모든 위치가 저장되었습니다!');
    setIsSaving(false);
    onUpdate();
  };

  // 기본 위치로 초기화
  const resetToDefault = async () => {
    if (!confirm('모든 오너먼트를 기본 트리 배치로 초기화하시겠습니까?')) return;

    setIsSaving(true);

    const sortedPrizes = [...prizes].sort((a, b) => a.display_position - b.display_position);

    for (let i = 0; i < sortedPrizes.length; i++) {
      const defaultPos = DEFAULT_POSITIONS[i] || { top: 50, left: 50 };
      await supabase
        .from('prizes')
        .update({
          position_top: defaultPos.top,
          position_left: defaultPos.left,
        })
        .eq('id', sortedPrizes[i].id);
    }

    alert('기본 위치로 초기화되었습니다!');
    setIsSaving(false);
    onUpdate();
  };

  // display_position 기준으로 정렬
  const sortedPrizes = [...prizes].sort((a, b) => a.display_position - b.display_position);

  return (
    <div className="space-y-4">
      {/* 안내 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Move className="h-4 w-4" />
        <span>오너먼트를 드래그하여 위치를 조정하세요</span>
      </div>

      {/* 줌 컨트롤 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="rounded bg-gray-700 p-1 text-white hover:bg-gray-600"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs text-gray-400 w-16 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            className="rounded bg-gray-700 p-1 text-white hover:bg-gray-600"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={resetToDefault}
            disabled={isSaving}
            className="flex items-center gap-1 rounded-lg bg-gray-600 px-3 py-1.5 text-sm text-white hover:bg-gray-500 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            기본 배치
          </button>
          <button
            onClick={saveAllPositions}
            disabled={isSaving}
            className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-500 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            전체 저장
          </button>
        </div>
      </div>

      {/* 트리 + 오너먼트 에디터 */}
      <div
        className="relative overflow-auto rounded-xl bg-gray-900 border border-gray-700"
        style={{ maxHeight: '500px' }}
      >
        <div
          ref={containerRef}
          className="relative"
          style={{
            width: `${400 * zoom}px`,
            height: `${480 * zoom}px`,
            margin: '0 auto',
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* 트리 배경 */}
          <img
            src={backgroundImageUrl || '/tree.png'}
            alt="Tree"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-50"
          />

          {/* 오너먼트들 */}
          {sortedPrizes.map((prize) => {
            const pos = tempPositions[prize.id];
            if (!pos) return null;

            const isSelected = selectedPrize?.id === prize.id;
            const isWinner = prize.prize_grade !== null;

            return (
              <motion.div
                key={prize.id}
                className={`absolute cursor-move ${isSelected ? 'z-50' : 'z-10'}`}
                style={{
                  top: `${pos.top}%`,
                  left: `${pos.left}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onMouseDown={(e) => handleMouseDown(prize, e)}
                whileHover={{ scale: 1.2 }}
              >
                <div className={`relative ${isSelected ? 'ring-2 ring-yellow-400 rounded-full' : ''}`}>
                  <Ornament
                    index={prize.slot_number - 1}
                    size={24 * zoom}
                    spriteConfig={spriteConfig}
                    spriteImageUrl={spriteImageUrl}
                    individualOffset={{ x: prize.offset_x, y: prize.offset_y }}
                  />
                  {/* 슬롯 번호 */}
                  <span
                    className={`absolute -bottom-3 left-1/2 -translate-x-1/2 text-[8px] px-1 rounded ${
                      isWinner ? 'bg-yellow-500 text-black' : 'bg-gray-600 text-white'
                    }`}
                    style={{ fontSize: `${8 * zoom}px` }}
                  >
                    {prize.slot_number}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 선택된 오너먼트 정보 */}
      {selectedPrize && (
        <div className="rounded-lg bg-gray-700 p-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-white font-bold">#{selectedPrize.slot_number}</span>
              <span className="text-sm text-gray-400 ml-2">
                {selectedPrize.prize_grade || '꽝'} - {selectedPrize.prize_name}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              위치: ({tempPositions[selectedPrize.id]?.left.toFixed(1)}%, {tempPositions[selectedPrize.id]?.top.toFixed(1)}%)
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => savePosition(selectedPrize)}
              disabled={isSaving}
              className="flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-500 disabled:opacity-50"
            >
              <Save className="h-3 w-3" />
              이 오너먼트만 저장
            </button>
            <button
              onClick={() => setSelectedPrize(null)}
              className="rounded bg-gray-600 px-2 py-1 text-xs text-white hover:bg-gray-500"
            >
              선택 해제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

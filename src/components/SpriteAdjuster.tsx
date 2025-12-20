'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  SpriteConfig,
  DEFAULT_SPRITE_CONFIG,
  getSpriteConfig,
} from './Ornament';
import { Save, RefreshCw, Move, Loader2, ZoomIn, ZoomOut } from 'lucide-react';

interface SpriteAdjusterProps {
  index: number;
  currentOffsetX?: number;
  currentOffsetY?: number;
  onSave: (offsetX: number, offsetY: number) => Promise<void>;
  onClose?: () => void;
}

export function SpriteAdjuster({
  index,
  currentOffsetX = 0,
  currentOffsetY = 0,
  onSave,
  onClose,
}: SpriteAdjusterProps) {
  const [config, setConfig] = useState<SpriteConfig>(DEFAULT_SPRITE_CONFIG);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [tempOffset, setTempOffset] = useState({ x: currentOffsetX, y: currentOffsetY });
  const [startOffset, setStartOffset] = useState({ x: currentOffsetX, y: currentOffsetY });
  const [zoom, setZoom] = useState(0.4); // 전체 이미지 줌 레벨
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedConfig = getSpriteConfig();
    setConfig(savedConfig);
  }, []);

  useEffect(() => {
    setTempOffset({ x: currentOffsetX, y: currentOffsetY });
    setStartOffset({ x: currentOffsetX, y: currentOffsetY });
  }, [currentOffsetX, currentOffsetY]);

  // 그리드에서의 기본 위치 계산
  const col = index % config.columns;
  const row = Math.floor(index / config.columns);

  // 전체 이미지 크기 (원본)
  const totalWidth = config.columns * (config.cellWidth + config.gapX);
  const totalHeight = config.rows * (config.cellHeight + config.gapY);

  // 기본 크롭 위치 (전역 offset + 그리드 위치)
  const baseCropX = config.offsetX + col * (config.cellWidth + config.gapX);
  const baseCropY = config.offsetY + row * (config.cellHeight + config.gapY);

  // 최종 크롭 위치 (기본 위치 + 개별 offset)
  const finalCropX = baseCropX + tempOffset.x;
  const finalCropY = baseCropY + tempOffset.y;

  // 미리보기 크기
  const previewSize = 100;
  const previewScale = previewSize / config.cellWidth;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartOffset({ ...tempOffset });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    // 드래그 방향과 반대로 offset 적용 (박스를 오른쪽으로 드래그 = offset 증가)
    const deltaX = (e.clientX - startPos.x) / zoom;
    const deltaY = (e.clientY - startPos.y) / zoom;

    setTempOffset({
      x: Math.round(startOffset.x + deltaX),
      y: Math.round(startOffset.y + deltaY),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(tempOffset.x, tempOffset.y);
      alert('스프라이트 위치가 저장되었습니다!');
      onClose?.();
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setTempOffset({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-4">
      {/* 안내 */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Move className="h-4 w-4" />
        <span>빨간 박스를 드래그하여 크롭 영역을 조정하세요</span>
      </div>

      {/* 전체 스프라이트 이미지 + 크롭 영역 박스 */}
      <div className="relative overflow-auto rounded-xl bg-gray-900 border border-gray-700" style={{ maxHeight: '300px' }}>
        <div
          ref={containerRef}
          className="relative"
          style={{
            width: totalWidth * zoom,
            height: totalHeight * zoom,
            backgroundImage: 'url(/selceted_ornament.png)',
            backgroundSize: `${totalWidth * zoom}px ${totalHeight * zoom}px`,
            backgroundPosition: '0 0',
            backgroundRepeat: 'no-repeat',
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* 크롭 영역 박스 */}
          <div
            className={`absolute border-2 ${isDragging ? 'border-yellow-400' : 'border-red-500'} bg-red-500/20 cursor-move`}
            style={{
              left: finalCropX * zoom,
              top: finalCropY * zoom,
              width: config.cellWidth * zoom,
              height: config.cellHeight * zoom,
            }}
            onMouseDown={handleMouseDown}
          >
            {/* 중앙 십자선 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute w-full h-px bg-red-500/50" />
              <div className="absolute h-full w-px bg-red-500/50" />
            </div>
          </div>

          {/* 기본 위치 표시 (회색 박스) */}
          <div
            className="absolute border border-dashed border-gray-500 pointer-events-none"
            style={{
              left: baseCropX * zoom,
              top: baseCropY * zoom,
              width: config.cellWidth * zoom,
              height: config.cellHeight * zoom,
            }}
          />
        </div>
      </div>

      {/* 줌 컨트롤 */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setZoom(Math.max(0.2, zoom - 0.1))}
          className="rounded bg-gray-700 p-1 text-white hover:bg-gray-600"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="text-xs text-gray-400 w-16 text-center">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom(Math.min(1, zoom + 0.1))}
          className="rounded bg-gray-700 p-1 text-white hover:bg-gray-600"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      {/* 미리보기 + 오프셋 정보 */}
      <div className="flex items-center gap-4">
        {/* 미리보기 */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500 mb-1">미리보기</span>
          <div
            className="rounded-lg border border-gray-600 bg-gray-800"
            style={{
              width: previewSize,
              height: previewSize,
              backgroundImage: 'url(/selceted_ornament.png)',
              backgroundSize: `${totalWidth * previewScale}px ${totalHeight * previewScale}px`,
              backgroundPosition: `-${finalCropX * previewScale}px -${finalCropY * previewScale}px`,
              backgroundRepeat: 'no-repeat',
            }}
          />
        </div>

        {/* 오프셋 정보 */}
        <div className="flex-1 space-y-2">
          <div className="text-xs text-gray-500">
            <div>기본 위치: ({baseCropX}, {baseCropY})</div>
            <div>개별 오프셋: ({tempOffset.x}, {tempOffset.y})</div>
            <div className="text-yellow-400">최종 위치: ({finalCropX}, {finalCropY})</div>
          </div>

          {/* 미세 조정 버튼 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTempOffset({ ...tempOffset, x: tempOffset.x - 1 })}
              className="rounded bg-gray-700 px-2 py-1 text-xs text-white hover:bg-gray-600"
            >
              ←
            </button>
            <button
              onClick={() => setTempOffset({ ...tempOffset, y: tempOffset.y - 1 })}
              className="rounded bg-gray-700 px-2 py-1 text-xs text-white hover:bg-gray-600"
            >
              ↑
            </button>
            <button
              onClick={() => setTempOffset({ ...tempOffset, y: tempOffset.y + 1 })}
              className="rounded bg-gray-700 px-2 py-1 text-xs text-white hover:bg-gray-600"
            >
              ↓
            </button>
            <button
              onClick={() => setTempOffset({ ...tempOffset, x: tempOffset.x + 1 })}
              className="rounded bg-gray-700 px-2 py-1 text-xs text-white hover:bg-gray-600"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* 셀 크기 조정 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-400">셀 너비</label>
          <input
            type="number"
            value={config.cellWidth}
            onChange={(e) => setConfig({ ...config, cellWidth: Number(e.target.value) })}
            className="w-full rounded bg-gray-700 px-2 py-1 text-sm text-white"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400">셀 높이</label>
          <input
            type="number"
            value={config.cellHeight}
            onChange={(e) => setConfig({ ...config, cellHeight: Number(e.target.value) })}
            className="w-full rounded bg-gray-700 px-2 py-1 text-sm text-white"
          />
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={handleReset}
          disabled={isSaving}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-500 disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          초기화
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-500 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          위치 저장
        </button>
      </div>
    </div>
  );
}

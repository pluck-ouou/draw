'use client';

// 스프라이트 설정 타입
export interface SpriteConfig {
  columns: number;      // 열 수
  rows: number;         // 행 수
  cellWidth: number;    // 각 셀 너비 (원본 이미지 기준)
  cellHeight: number;   // 각 셀 높이 (원본 이미지 기준)
  offsetX: number;      // X 시작 오프셋 (전역)
  offsetY: number;      // Y 시작 오프셋 (전역)
  gapX: number;         // 셀 간 X 간격
  gapY: number;         // 셀 간 Y 간격
}

// 개별 오너먼트 오프셋 타입
export interface IndividualOffset {
  x: number;
  y: number;
}

// 기본 스프라이트 설정 (localStorage에서 불러오거나 기본값 사용)
// 원본 이미지: 1536x1536px, 10x10 그리드 = 셀 크기 약 153.6px
export const DEFAULT_SPRITE_CONFIG: SpriteConfig = {
  columns: 10,
  rows: 10,
  cellWidth: 154,
  cellHeight: 154,
  offsetX: 0,
  offsetY: 0,
  gapX: 0,
  gapY: 0,
};

// 스프라이트 설정 불러오기
export function getSpriteConfig(): SpriteConfig {
  if (typeof window === 'undefined') return DEFAULT_SPRITE_CONFIG;

  const saved = localStorage.getItem('spriteConfig');
  if (saved) {
    try {
      return { ...DEFAULT_SPRITE_CONFIG, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_SPRITE_CONFIG;
    }
  }
  return DEFAULT_SPRITE_CONFIG;
}

// 스프라이트 설정 저장하기
export function saveSpriteConfig(config: SpriteConfig): void {
  localStorage.setItem('spriteConfig', JSON.stringify(config));
}

// 개별 오너먼트 오프셋 불러오기
export function getIndividualOffset(index: number): IndividualOffset {
  if (typeof window === 'undefined') return { x: 0, y: 0 };

  const saved = localStorage.getItem(`ornamentOffset_${index}`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return { x: 0, y: 0 };
    }
  }
  return { x: 0, y: 0 };
}

// 개별 오너먼트 오프셋 저장하기
export function saveIndividualOffset(index: number, offset: IndividualOffset): void {
  localStorage.setItem(`ornamentOffset_${index}`, JSON.stringify(offset));
}

// 모든 개별 오프셋 불러오기 (관리자용)
export function getAllIndividualOffsets(): Record<number, IndividualOffset> {
  if (typeof window === 'undefined') return {};

  const offsets: Record<number, IndividualOffset> = {};
  for (let i = 0; i < 100; i++) {
    const offset = getIndividualOffset(i);
    if (offset.x !== 0 || offset.y !== 0) {
      offsets[i] = offset;
    }
  }
  return offsets;
}

// 개별 오프셋 초기화
export function resetIndividualOffset(index: number): void {
  localStorage.removeItem(`ornamentOffset_${index}`);
}

interface OrnamentProps {
  index: number; // 0-99
  size?: number; // 표시할 크기 (px)
  onClick?: () => void;
  className?: string;
  spriteConfig?: SpriteConfig; // 외부에서 주입 가능
  individualOffset?: IndividualOffset; // 개별 오프셋 (외부에서 주입 가능)
}

const COLUMNS = 10;
const ROWS = 10;
export const TOTAL_ORNAMENTS = COLUMNS * ROWS; // 100

export function Ornament({
  index,
  size = 64,
  onClick,
  className = '',
  spriteConfig,
  individualOffset,
}: OrnamentProps) {
  // 스프라이트 설정 (props로 받거나 기본값)
  const config = spriteConfig || getSpriteConfig();

  // 인덱스 유효성 검사
  const safeIndex = Math.max(0, Math.min(index, TOTAL_ORNAMENTS - 1));

  // 개별 오프셋 가져오기 (props로 받거나 localStorage에서)
  const offset = individualOffset ?? getIndividualOffset(safeIndex);

  // 그리드에서의 위치 계산
  const col = safeIndex % config.columns;
  const row = Math.floor(safeIndex / config.columns);

  // 원본 이미지에서의 위치 계산 (전역 offset + 개별 offset)
  const srcX = config.offsetX + col * (config.cellWidth + config.gapX) + offset.x;
  const srcY = config.offsetY + row * (config.cellHeight + config.gapY) + offset.y;

  // 스케일 계산 (표시 크기 / 셀 크기)
  const scale = size / config.cellWidth;

  // 전체 이미지 크기 계산
  const totalWidth = config.columns * (config.cellWidth + config.gapX);
  const totalHeight = config.rows * (config.cellHeight + config.gapY);

  return (
    <div
      onClick={onClick}
      className={`${onClick ? 'cursor-pointer hover:scale-110 transition-transform' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: 'url(/selceted_ornament.png)',
        backgroundSize: `${totalWidth * scale}px ${totalHeight * scale}px`,
        backgroundPosition: `-${srcX * scale}px -${srcY * scale}px`,
        backgroundRepeat: 'no-repeat',
      }}
      title={`Ornament #${safeIndex + 1}`}
    />
  );
}

// 랜덤 오너먼트 인덱스 반환
export function getRandomOrnamentIndex(): number {
  return Math.floor(Math.random() * TOTAL_ORNAMENTS);
}

// 여러 개의 유니크한 랜덤 오너먼트 인덱스 반환
export function getRandomOrnamentIndices(count: number): number[] {
  const indices: Set<number> = new Set();
  while (indices.size < Math.min(count, TOTAL_ORNAMENTS)) {
    indices.add(getRandomOrnamentIndex());
  }
  return Array.from(indices);
}

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
  imageWidth?: number;  // 원본 이미지 너비 (선택)
  imageHeight?: number; // 원본 이미지 높이 (선택)
  displayScale?: number; // 표시 스케일 (1.0 = 100%, 1.4 = 140%)
}

// 개별 오너먼트 오프셋 타입
export interface IndividualOffset {
  x: number;
  y: number;
}

// 기본 스프라이트 설정
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
  imageWidth: 1536,
  imageHeight: 1536,
  displayScale: 1.0,
};

interface OrnamentProps {
  index: number; // 0-99
  size?: number; // 표시할 크기 (px)
  onClick?: () => void;
  className?: string;
  spriteConfig?: SpriteConfig; // 외부에서 주입 가능
  individualOffset?: IndividualOffset; // 개별 오프셋 (외부에서 주입 가능)
  spriteImageUrl?: string; // 스프라이트 이미지 URL (외부에서 주입 가능)
  itemImageUrl?: string | null; // 개별 이미지 URL (있으면 스프라이트 대신 사용)
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
  spriteImageUrl,
  itemImageUrl,
}: OrnamentProps) {
  // 개별 이미지 모드: itemImageUrl이 있으면 스프라이트 대신 단일 이미지 사용
  if (itemImageUrl) {
    return (
      <div
        onClick={onClick}
        className={`${onClick ? 'cursor-pointer hover:scale-110 transition-transform' : ''} ${className}`}
        style={{
          width: size,
          height: size,
          backgroundImage: `url(${itemImageUrl})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        title={`Item #${index + 1}`}
      />
    );
  }

  // 스프라이트 모드 (기존 동작)
  // 스프라이트 설정 (props로 받거나 기본값 - localStorage 사용 안함)
  const config = spriteConfig || DEFAULT_SPRITE_CONFIG;

  // 인덱스 유효성 검사
  const safeIndex = Math.max(0, Math.min(index, TOTAL_ORNAMENTS - 1));

  // 개별 오프셋 가져오기 (props로 받거나 기본값 - localStorage 사용 안함)
  const offset = individualOffset ?? { x: 0, y: 0 };

  // 그리드에서의 위치 계산
  const col = safeIndex % config.columns;
  const row = Math.floor(safeIndex / config.columns);

  // 원본 이미지에서의 위치 계산 (전역 offset + 개별 offset)
  const srcX = config.offsetX + col * (config.cellWidth + config.gapX) + offset.x;
  const srcY = config.offsetY + row * (config.cellHeight + config.gapY) + offset.y;

  // 스케일 계산 (표시 크기 / 셀 크기)
  const scale = size / config.cellWidth;

  // 전체 이미지 크기 (imageWidth/Height가 있으면 사용, 없으면 계산)
  const totalWidth = config.imageWidth ?? config.columns * (config.cellWidth + config.gapX);
  const totalHeight = config.imageHeight ?? config.rows * (config.cellHeight + config.gapY);

  // 스프라이트 이미지 URL (props로 받거나 기본값)
  const imageUrl = spriteImageUrl || '/selceted_ornament.png';

  // 표시 스케일 (기본값 1.0)
  const displayScale = config.displayScale ?? 1.0;

  return (
    <div
      onClick={onClick}
      className={`${onClick ? 'cursor-pointer hover:scale-110 transition-transform' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: `${totalWidth * scale}px ${totalHeight * scale}px`,
        backgroundPosition: `-${srcX * scale}px -${srcY * scale}px`,
        backgroundRepeat: 'no-repeat',
        transform: displayScale !== 1.0 ? `scale(${displayScale})` : undefined,
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

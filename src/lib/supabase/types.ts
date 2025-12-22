export type GameStatus = 'waiting' | 'active' | 'ended';

export interface Game {
  id: string;
  name: string;
  status: GameStatus;
  total_slots: number;
  invite_code: string;
  template_id: string | null;
  created_at: string;
  updated_at: string;
  // 클라이언트 커스터마이징
  client_title: string | null;
  client_subtitle: string | null;
  theme_color: string;
  show_snow: boolean;
  show_stats: boolean;
  // 배경음악
  bgm_url: string | null;
  bgm_playing: boolean;
  bgm_volume: number; // 0.0 ~ 1.0
  // 기업 브랜딩
  company_logo_url: string | null;
  brand_color_secondary: string;
  // 마퀴 띠배너
  marquee_enabled: boolean;
  marquee_text: string | null;
  // 실시간 당첨 토스트
  toast_enabled: boolean;
  // 플로팅 뱃지
  badge_enabled: boolean;
  badge_text: string | null;
  badge_color: string;
  // 카운트다운 타이머
  countdown_enabled: boolean;
  event_end_at: string | null;
  // 팝업 배너
  popup_enabled: boolean;
  popup_image_url: string | null;
  popup_title: string | null;
  popup_description: string | null;
  // 하단 정보
  footer_enabled: boolean;
  footer_text: string | null;
  contact_info: string | null;
  privacy_url: string | null;
  // 공유 버튼
  share_enabled: boolean;
  // 스폰서 로고
  sponsors: Sponsor[];
  // 당첨/꽝 메시지
  win_message: string | null;
  lose_message: string | null;
}

export interface Sponsor {
  name: string;
  logo_url: string;
  link_url?: string;
}

export interface Prize {
  id: string;
  game_id: string;
  slot_number: number;
  prize_name: string;
  prize_grade: string | null;
  is_drawn: boolean;
  created_at: string;
  offset_x: number;
  offset_y: number;
  display_position: number; // 트리에서의 표시 순서 (1~100)
  position_top: number | null; // 화면 위치 top (%)
  position_left: number | null; // 화면 위치 left (%)
}

export interface Draw {
  id: string;
  prize_id: string;
  game_id: string;
  player_name: string;
  session_id: string | null;
  drawn_at: string;
}

export interface DrawResult {
  success: boolean;
  error?: string;
  message?: string;
  draw_id?: string;
  prize_name?: string;
  prize_grade?: string | null;
  slot_number?: number;
  is_winner?: boolean;
}

export interface PrizeWithDraw extends Prize {
  draw?: Draw | null;
}

// 스프라이트 설정 타입
export interface SpriteConfig {
  offsetX: number;
  offsetY: number;
  cellWidth: number;
  cellHeight: number;
  gapX: number;
  gapY: number;
  columns: number;
  rows: number;
}

// 템플릿 타입
export interface Template {
  id: string;
  name: string;
  description: string | null;
  background_image: string | null;
  sprite_image: string | null;
  sprite_config: SpriteConfig;
  total_slots: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// 템플릿 슬롯 타입
export interface TemplateSlot {
  id: string;
  template_id: string;
  slot_number: number;
  offset_x: number;
  offset_y: number;
  position_top: number | null;
  position_left: number | null;
  default_prize_name: string;
  default_prize_grade: string | null;
  created_at: string;
}

// 템플릿과 슬롯을 함께 가져올 때
export interface TemplateWithSlots extends Template {
  slots: TemplateSlot[];
}

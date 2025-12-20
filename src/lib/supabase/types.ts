export type GameStatus = 'waiting' | 'active' | 'ended';

export interface Game {
  id: string;
  name: string;
  status: GameStatus;
  total_slots: number;
  created_at: string;
  updated_at: string;
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

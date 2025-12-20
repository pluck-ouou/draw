import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem('lucky_draw_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('lucky_draw_session_id', sessionId);
  }
  return sessionId;
}

export function getPlayerName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('lucky_draw_player_name');
}

export function setPlayerName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('lucky_draw_player_name', name);
}

export function clearPlayerData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('lucky_draw_player_name');
  localStorage.removeItem('lucky_draw_session_id');
}

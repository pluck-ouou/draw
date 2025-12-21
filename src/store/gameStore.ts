'use client';

import { create } from 'zustand';
import type { Game, Prize, Draw, DrawResult, Template } from '@/lib/supabase/types';

interface GameState {
  // Game data
  game: Game | null;
  template: Template | null;
  prizes: Prize[];
  draws: Draw[];

  // Player data
  playerName: string;
  sessionId: string;
  hasParticipated: boolean;
  myDraw: Draw | null;

  // UI state
  isLoading: boolean;
  isDrawing: boolean;
  selectedSlot: number | null;
  drawResult: DrawResult | null;
  showResultModal: boolean;

  // Actions
  setGame: (game: Game | null) => void;
  setTemplate: (template: Template | null) => void;
  setPrizes: (prizes: Prize[]) => void;
  setDraws: (draws: Draw[]) => void;
  updatePrize: (prize: Prize) => void;
  addDraw: (draw: Draw) => void;
  setPlayerName: (name: string) => void;
  setSessionId: (id: string) => void;
  setHasParticipated: (value: boolean) => void;
  setMyDraw: (draw: Draw | null) => void;
  setIsLoading: (value: boolean) => void;
  setIsDrawing: (value: boolean) => void;
  setSelectedSlot: (slot: number | null) => void;
  setDrawResult: (result: DrawResult | null) => void;
  setShowResultModal: (value: boolean) => void;
  reset: () => void;
}

const initialState = {
  game: null,
  template: null,
  prizes: [],
  draws: [],
  playerName: '',
  sessionId: '',
  hasParticipated: false,
  myDraw: null,
  isLoading: true,
  isDrawing: false,
  selectedSlot: null,
  drawResult: null,
  showResultModal: false,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setGame: (game) => set({ game }),
  setTemplate: (template) => set({ template }),
  setPrizes: (prizes) => set({ prizes }),
  setDraws: (draws) => set({ draws }),

  updatePrize: (updatedPrize) =>
    set((state) => ({
      prizes: state.prizes.map((p) =>
        p.id === updatedPrize.id ? updatedPrize : p
      ),
    })),

  addDraw: (draw) =>
    set((state) => ({
      draws: [...state.draws, draw],
    })),

  setPlayerName: (playerName) => set({ playerName }),
  setSessionId: (sessionId) => set({ sessionId }),
  setHasParticipated: (hasParticipated) => set({ hasParticipated }),
  setMyDraw: (myDraw) => set({ myDraw }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  setSelectedSlot: (selectedSlot) => set({ selectedSlot }),
  setDrawResult: (drawResult) => set({ drawResult }),
  setShowResultModal: (showResultModal) => set({ showResultModal }),

  reset: () => set(initialState),
}));

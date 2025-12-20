'use client';

import { useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useGameStore } from '@/store/gameStore';
import { getSessionId, getPlayerName } from '@/lib/utils';
import type { Draw, DrawResult } from '@/lib/supabase/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

const GAME_ID = process.env.NEXT_PUBLIC_GAME_ID!;
const supabase = createClient();

// 모듈 레벨에서 채널 관리 (HMR에서도 유지)
let globalChannel: RealtimeChannel | null = null;
let subscriberCount = 0;

// 데이터 로딩 중복 방지
let isDataFetching = false;
let isDataFetched = false;

export function useGame() {
  const {
    game,
    prizes,
    draws,
    playerName,
    sessionId,
    hasParticipated,
    myDraw,
    isLoading,
    isDrawing,
    setGame,
    setPrizes,
    setDraws,
    updatePrize,
    addDraw,
    setPlayerName,
    setSessionId,
    setHasParticipated,
    setMyDraw,
    setIsLoading,
    setIsDrawing,
    setDrawResult,
    setShowResultModal,
  } = useGameStore();

  // Initialize session and player data
  useEffect(() => {
    const sid = getSessionId();
    const name = getPlayerName();
    setSessionId(sid);
    if (name) {
      setPlayerName(name);
    }
  }, [setSessionId, setPlayerName]);

  // Fetch initial data - 의존성 없이 한 번만 실행
  useEffect(() => {
    const fetchGameData = async () => {
      // 이미 데이터를 가져오는 중이거나 가져왔으면 스킵
      if (isDataFetching || isDataFetched) {
        console.log('[useGame] 이미 데이터 로딩 중이거나 완료됨, 스킵');
        return;
      }

      isDataFetching = true;
      console.log('[useGame] fetchGameData 시작, GAME_ID:', GAME_ID);
      useGameStore.getState().setIsLoading(true);
      try {
        // Fetch game
        console.log('[useGame] games 테이블 조회 중...');
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('id', GAME_ID)
          .single();

        console.log('[useGame] games 결과:', { gameData, gameError });

        if (gameData) {
          useGameStore.getState().setGame(gameData);
        }

        // Fetch prizes
        console.log('[useGame] prizes 테이블 조회 중...');
        const { data: prizesData, error: prizesError } = await supabase
          .from('prizes')
          .select('*')
          .eq('game_id', GAME_ID)
          .order('slot_number');

        console.log('[useGame] prizes 결과:', { count: prizesData?.length, prizesError });

        if (prizesData) {
          useGameStore.getState().setPrizes(prizesData);
        }

        // Fetch draws
        console.log('[useGame] draws 테이블 조회 중...');
        const { data: drawsData, error: drawsError } = await supabase
          .from('draws')
          .select('*')
          .eq('game_id', GAME_ID);

        console.log('[useGame] draws 결과:', { count: drawsData?.length, drawsError });

        if (drawsData) {
          useGameStore.getState().setDraws(drawsData);

          // Check if current session has participated
          const sid = getSessionId();
          const myDrawRecord = drawsData.find((d: Draw) => d.session_id === sid);
          if (myDrawRecord) {
            useGameStore.getState().setHasParticipated(true);
            useGameStore.getState().setMyDraw(myDrawRecord);
          }
        }
      } catch (error) {
        console.error('[useGame] Failed to fetch game data:', error);
      } finally {
        console.log('[useGame] 로딩 완료, isLoading -> false');
        isDataFetching = false;
        isDataFetched = true;
        useGameStore.getState().setIsLoading(false);
      }
    };

    console.log('[useGame] useEffect 실행, fetchGameData 호출');
    fetchGameData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to realtime updates - 전역 채널 사용 (HMR/Strict Mode에서도 안정적)
  useEffect(() => {
    subscriberCount++;

    // 이미 채널이 있으면 재사용
    if (!globalChannel) {
      globalChannel = supabase
        .channel('game-realtime', {
          config: {
            broadcast: { self: false },
          },
        })
        .on('broadcast', { event: 'draw_completed' }, (payload: { payload: { prize?: any; draw?: any } }) => {
          const { prize, draw } = payload.payload;
          if (prize) {
            useGameStore.getState().updatePrize(prize);
          }
          if (draw) {
            useGameStore.getState().addDraw(draw);
          }
        })
        .on('broadcast', { event: 'game_updated' }, (payload: { payload: { game?: any } }) => {
          const { game: updatedGame } = payload.payload;
          if (updatedGame) {
            useGameStore.getState().setGame(updatedGame);
          }
        })
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'prizes',
            filter: `game_id=eq.${GAME_ID}`,
          },
          (payload: { new: Record<string, unknown> }) => {
            useGameStore.getState().updatePrize(payload.new as any);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'draws',
            filter: `game_id=eq.${GAME_ID}`,
          },
          (payload: { new: Record<string, unknown> }) => {
            useGameStore.getState().addDraw(payload.new as any);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'games',
            filter: `id=eq.${GAME_ID}`,
          },
          (payload: { new: Record<string, unknown> }) => {
            useGameStore.getState().setGame(payload.new as any);
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('Realtime channel subscribed successfully');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Realtime channel error');
          }
        });
    }

    return () => {
      subscriberCount--;
      // 모든 구독자가 언마운트되면 채널 정리 (HMR 중에는 유지)
      if (subscriberCount === 0 && globalChannel) {
        // 개발 모드에서는 채널을 유지하여 WebSocket 에러 방지
        if (process.env.NODE_ENV === 'production') {
          supabase.removeChannel(globalChannel);
          globalChannel = null;
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Broadcast helper function
  const broadcastDrawCompleted = useCallback(
    async (prize: any, draw: any) => {
      const channel = supabase.channel('game-realtime');
      await channel.send({
        type: 'broadcast',
        event: 'draw_completed',
        payload: { prize, draw },
      });
    },
    []
  );

  // Draw function
  const drawPrize = useCallback(
    async (slotNumber: number): Promise<DrawResult> => {
      if (!playerName || !sessionId) {
        return {
          success: false,
          error: 'NO_PLAYER_NAME',
          message: '이름을 입력해주세요.',
        };
      }

      if (hasParticipated) {
        return {
          success: false,
          error: 'ALREADY_PARTICIPATED',
          message: '이미 참여하셨습니다.',
        };
      }

      setIsDrawing(true);

      try {
        const { data, error } = await supabase.rpc('draw_prize', {
          p_game_id: GAME_ID,
          p_slot_number: slotNumber,
          p_player_name: playerName,
          p_session_id: sessionId,
        });

        if (error) {
          throw error;
        }

        const result = data as DrawResult;

        if (result.success) {
          setHasParticipated(true);
          // Fetch the draw record and updated prize
          const [{ data: drawData }, { data: prizeData }] = await Promise.all([
            supabase.from('draws').select('*').eq('id', result.draw_id).single(),
            supabase.from('prizes').select('*').eq('game_id', GAME_ID).eq('slot_number', slotNumber).single(),
          ]);

          if (drawData) {
            setMyDraw(drawData);
          }

          // Broadcast to other clients for instant update
          if (prizeData && drawData) {
            await broadcastDrawCompleted(prizeData, drawData);
          }
        }

        setDrawResult(result);
        setShowResultModal(true);

        return result;
      } catch (error: any) {
        const result: DrawResult = {
          success: false,
          error: 'UNKNOWN_ERROR',
          message: error.message || '알 수 없는 오류가 발생했습니다.',
        };
        setDrawResult(result);
        setShowResultModal(true);
        return result;
      } finally {
        setIsDrawing(false);
      }
    },
    [
      playerName,
      sessionId,
      hasParticipated,
      setIsDrawing,
      setHasParticipated,
      setMyDraw,
      setDrawResult,
      setShowResultModal,
      broadcastDrawCompleted,
    ]
  );

  // Get prize info with draw info
  const getPrizeWithDraw = useCallback(
    (slotNumber: number) => {
      const prize = prizes.find((p) => p.slot_number === slotNumber);
      if (!prize) return null;

      const draw = draws.find((d) => d.prize_id === prize.id);
      return { ...prize, draw };
    },
    [prizes, draws]
  );

  // Refetch function
  const refetch = useCallback(async () => {
    useGameStore.getState().setIsLoading(true);
    try {
      const [{ data: gameData }, { data: prizesData }, { data: drawsData }] = await Promise.all([
        supabase.from('games').select('*').eq('id', GAME_ID).single(),
        supabase.from('prizes').select('*').eq('game_id', GAME_ID).order('slot_number'),
        supabase.from('draws').select('*').eq('game_id', GAME_ID),
      ]);

      if (gameData) useGameStore.getState().setGame(gameData);
      if (prizesData) useGameStore.getState().setPrizes(prizesData);
      if (drawsData) {
        useGameStore.getState().setDraws(drawsData);
        const sid = getSessionId();
        const myDrawRecord = drawsData.find((d: Draw) => d.session_id === sid);
        if (myDrawRecord) {
          useGameStore.getState().setHasParticipated(true);
          useGameStore.getState().setMyDraw(myDrawRecord);
        }
      }
    } catch (error) {
      console.error('Failed to refetch game data:', error);
    } finally {
      useGameStore.getState().setIsLoading(false);
    }
  }, []);

  // Stats
  const stats = {
    totalSlots: prizes.length,
    drawnSlots: prizes.filter((p) => p.is_drawn).length,
    remainingSlots: prizes.filter((p) => !p.is_drawn).length,
    participants: draws.length,
    prizeWinners: draws.filter((d) => {
      const prize = prizes.find((p) => p.id === d.prize_id);
      return prize?.prize_grade !== null;
    }).length,
  };

  return {
    game,
    prizes,
    draws,
    playerName,
    hasParticipated,
    myDraw,
    isLoading,
    isDrawing,
    stats,
    drawPrize,
    getPrizeWithDraw,
    refetch,
  };
}

'use client';

import { useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useGameStore } from '@/store/gameStore';
import { getSessionId, getPlayerName } from '@/lib/utils';
import type { Draw, DrawResult } from '@/lib/supabase/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

const supabase = createClient();

// 모듈 레벨에서 채널 관리 (HMR에서도 유지)
const channelMap: Map<string, RealtimeChannel> = new Map();
const subscriberCountMap: Map<string, number> = new Map();

// 데이터 로딩 중복 방지
const fetchingGames: Set<string> = new Set();
const fetchedGames: Set<string> = new Set();

interface UseGameOptions {
  gameId?: string;
  inviteCode?: string;
}

export function useGame(options: UseGameOptions = {}) {
  const { gameId: propGameId, inviteCode } = options;

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

  // Fetch initial data
  useEffect(() => {
    const fetchGameData = async () => {
      // gameId 또는 inviteCode가 필요
      const identifier = propGameId || inviteCode;
      if (!identifier) {
        console.log('[useGame] No gameId or inviteCode provided');
        return;
      }

      // 이미 데이터를 가져오는 중이거나 가져왔으면 스킵
      if (fetchingGames.has(identifier) || fetchedGames.has(identifier)) {
        console.log('[useGame] 이미 데이터 로딩 중이거나 완료됨, 스킵');
        return;
      }

      fetchingGames.add(identifier);
      console.log('[useGame] fetchGameData 시작, identifier:', identifier);
      useGameStore.getState().setIsLoading(true);

      try {
        // Fetch game - inviteCode로 조회하거나 gameId로 조회
        let gameData;
        if (inviteCode) {
          const { data, error } = await supabase
            .from('games')
            .select('*')
            .eq('invite_code', inviteCode.toUpperCase())
            .single();
          if (error) throw error;
          gameData = data;
        } else if (propGameId) {
          const { data, error } = await supabase
            .from('games')
            .select('*')
            .eq('id', propGameId)
            .single();
          if (error) throw error;
          gameData = data;
        }

        if (!gameData) {
          console.error('[useGame] Game not found');
          return;
        }

        const currentGameId = gameData.id;
        useGameStore.getState().setGame(gameData);

        // Fetch prizes
        const { data: prizesData } = await supabase
          .from('prizes')
          .select('*')
          .eq('game_id', currentGameId)
          .order('slot_number');

        if (prizesData) {
          useGameStore.getState().setPrizes(prizesData);
        }

        // Fetch draws
        const { data: drawsData } = await supabase
          .from('draws')
          .select('*')
          .eq('game_id', currentGameId);

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
        fetchingGames.delete(identifier);
        fetchedGames.add(identifier);
        useGameStore.getState().setIsLoading(false);
      }
    };

    fetchGameData();
  }, [propGameId, inviteCode]);

  // Subscribe to realtime updates
  useEffect(() => {
    const currentGameId = game?.id;
    if (!currentGameId) return;

    const channelKey = `game-${currentGameId}`;
    subscriberCountMap.set(channelKey, (subscriberCountMap.get(channelKey) || 0) + 1);

    // 이미 채널이 있으면 재사용
    if (!channelMap.has(channelKey)) {
      const channel = supabase
        .channel(channelKey, {
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
            filter: `game_id=eq.${currentGameId}`,
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
            filter: `game_id=eq.${currentGameId}`,
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
            filter: `id=eq.${currentGameId}`,
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

      channelMap.set(channelKey, channel);
    }

    return () => {
      const count = (subscriberCountMap.get(channelKey) || 1) - 1;
      subscriberCountMap.set(channelKey, count);

      if (count === 0) {
        const channel = channelMap.get(channelKey);
        if (channel && process.env.NODE_ENV === 'production') {
          supabase.removeChannel(channel);
          channelMap.delete(channelKey);
        }
      }
    };
  }, [game?.id]);

  // Broadcast helper function
  const broadcastDrawCompleted = useCallback(
    async (prize: any, draw: any) => {
      if (!game?.id) return;
      const channel = supabase.channel(`game-${game.id}`);
      await channel.send({
        type: 'broadcast',
        event: 'draw_completed',
        payload: { prize, draw },
      });
    },
    [game?.id]
  );

  // Draw function
  const drawPrize = useCallback(
    async (slotNumber: number): Promise<DrawResult> => {
      if (!game?.id) {
        return {
          success: false,
          error: 'NO_GAME',
          message: '게임을 찾을 수 없습니다.',
        };
      }

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
          p_game_id: game.id,
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
            supabase.from('prizes').select('*').eq('game_id', game.id).eq('slot_number', slotNumber).single(),
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
      game?.id,
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
    const currentGameId = game?.id;
    if (!currentGameId) return;

    useGameStore.getState().setIsLoading(true);
    try {
      const [{ data: gameData }, { data: prizesData }, { data: drawsData }] = await Promise.all([
        supabase.from('games').select('*').eq('id', currentGameId).single(),
        supabase.from('prizes').select('*').eq('game_id', currentGameId).order('slot_number'),
        supabase.from('draws').select('*').eq('game_id', currentGameId),
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
  }, [game?.id]);

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

// 초대 코드로 게임 정보 가져오기 (서버 또는 클라이언트에서 사용)
export async function getGameByInviteCode(inviteCode: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .single();

  if (error) return null;
  return data;
}

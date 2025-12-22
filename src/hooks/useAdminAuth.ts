'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface AdminProfile {
  id: string;
  email: string;
  is_super: boolean;
  game_id: string | null;
  created_at: string;
  updated_at: string;
}

interface UseAdminAuthOptions {
  gameId?: string; // 특정 게임에 대한 접근 권한 확인
  redirectTo?: string; // 인증 실패 시 리다이렉트 경로
}

interface UseAdminAuthResult {
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuper: boolean;
  profile: AdminProfile | null;
  logout: () => Promise<void>;
}

export function useAdminAuth(options: UseAdminAuthOptions = {}): UseAdminAuthResult {
  const { gameId, redirectTo = '/admin/login' } = options;
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSuper, setIsSuper] = useState(false);
  const [profile, setProfile] = useState<AdminProfile | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 현재 세션 확인
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          router.push(redirectTo);
          return;
        }

        // admin_profiles에서 관리자 정보 조회
        const { data: adminProfile, error } = await supabase
          .from('admin_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error || !adminProfile) {
          // 관리자가 아님
          await supabase.auth.signOut();
          router.push(redirectTo);
          return;
        }

        // 게임별 관리자인 경우 해당 게임만 접근 가능
        if (gameId && !adminProfile.is_super && adminProfile.game_id !== gameId) {
          router.push(redirectTo);
          return;
        }

        setProfile(adminProfile);
        setIsSuper(adminProfile.is_super);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push(redirectTo);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: unknown) => {
        if (event === 'SIGNED_OUT' || !session) {
          setIsAuthenticated(false);
          setProfile(null);
          router.push(redirectTo);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [gameId, redirectTo, router, supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push(redirectTo);
  };

  return {
    isLoading,
    isAuthenticated,
    isSuper,
    profile,
    logout,
  };
}

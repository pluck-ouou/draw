-- ============================================
-- 관리자 인증 시스템 설정
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================

-- 1. admin_profiles 테이블 생성 (이미 생성되어 있으면 스킵)
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_super BOOLEAN DEFAULT FALSE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 코멘트 추가
COMMENT ON TABLE admin_profiles IS '관리자 프로필 테이블';
COMMENT ON COLUMN admin_profiles.is_super IS 'true면 슈퍼관리자 (모든 게임 접근 가능)';
COMMENT ON COLUMN admin_profiles.game_id IS '특정 게임만 관리하는 관리자의 경우 해당 게임 ID';

-- 2. RLS 활성화
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책 설정
-- 기존 정책 삭제 (있으면)
DROP POLICY IF EXISTS "Users can read own profile" ON admin_profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON admin_profiles;

-- 로그인한 사용자가 자신의 프로필만 읽을 수 있도록
CREATE POLICY "Users can read own profile"
  ON admin_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 슈퍼관리자는 모든 프로필을 읽을 수 있도록
CREATE POLICY "Super admins can read all profiles"
  ON admin_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE id = auth.uid() AND is_super = true
    )
  );

-- 슈퍼관리자만 프로필 생성 가능
CREATE POLICY "Super admins can insert profiles"
  ON admin_profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE id = auth.uid() AND is_super = true
    )
  );

-- 슈퍼관리자만 프로필 삭제 가능
CREATE POLICY "Super admins can delete profiles"
  ON admin_profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE id = auth.uid() AND is_super = true
    )
  );

-- ============================================
-- 슈퍼관리자 계정 생성 방법
-- ============================================
--
-- 1. Supabase Dashboard > Authentication > Users
-- 2. "Add user" 버튼 클릭
-- 3. 이메일/비밀번호 입력 후 생성
-- 4. 생성된 사용자의 UUID 복사
-- 5. 아래 SQL 실행 (UUID와 이메일 변경)
--
-- INSERT INTO admin_profiles (id, email, is_super)
-- VALUES (
--   '여기에-유저-UUID-입력',
--   'admin@example.com',
--   true
-- );
--
-- ============================================

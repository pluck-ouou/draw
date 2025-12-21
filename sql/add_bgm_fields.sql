-- 게임 테이블에 배경음악 필드 추가
ALTER TABLE games
ADD COLUMN IF NOT EXISTS bgm_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS bgm_playing BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bgm_volume DECIMAL(3,2) DEFAULT 0.5;

-- 코멘트 추가
COMMENT ON COLUMN games.bgm_url IS '배경음악 URL (Supabase Storage)';
COMMENT ON COLUMN games.bgm_playing IS '현재 재생 상태 (관리자 제어)';
COMMENT ON COLUMN games.bgm_volume IS '볼륨 (0.0 ~ 1.0)';

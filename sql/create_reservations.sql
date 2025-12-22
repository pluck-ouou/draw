-- 예약 테이블 생성
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 고객 정보
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT,  -- 회사명 (선택)

  -- 이벤트 정보
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  event_datetime TIMESTAMPTZ NOT NULL,  -- 한국시간 기준 저장
  expected_participants INTEGER,  -- 예상 참여자 수
  event_description TEXT,  -- 이벤트 설명

  -- 동의 항목
  terms_agreed BOOLEAN NOT NULL DEFAULT false,
  privacy_agreed BOOLEAN NOT NULL DEFAULT false,
  marketing_agreed BOOLEAN NOT NULL DEFAULT false,

  -- 예약 상태
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  admin_note TEXT,  -- 관리자 메모

  -- 연결된 게임 (예약 확정 후 게임 생성 시)
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_event_date ON reservations(event_date);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at DESC);

-- RLS 정책
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 누구나 예약 생성 가능 (공개 폼)
CREATE POLICY "Anyone can create reservations" ON reservations
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- 인증된 관리자만 조회/수정/삭제 가능
CREATE POLICY "Authenticated users can view reservations" ON reservations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update reservations" ON reservations
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete reservations" ON reservations
  FOR DELETE TO authenticated
  USING (true);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_reservations_updated_at();

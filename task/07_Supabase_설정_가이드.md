# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

### 1.1 계정 및 프로젝트 생성
1. https://supabase.com 접속
2. GitHub 또는 이메일로 로그인
3. "New Project" 클릭
4. 프로젝트 정보 입력:
   - **Name**: `lucky-draw` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 입력 (저장해둘 것)
   - **Region**: Northeast Asia (Tokyo) - 한국에서 가장 가까움
5. "Create new project" 클릭 후 2분 정도 대기

### 1.2 API 키 확인
1. 프로젝트 대시보드 → Settings → API
2. 다음 정보 복사해두기:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: 클라이언트용 (공개 가능)
   - **service_role key**: 관리자용 (절대 노출 금지)

## 2. 데이터베이스 테이블 생성

### 2.1 SQL Editor 접속
1. 좌측 메뉴에서 "SQL Editor" 클릭
2. "New query" 클릭

### 2.2 테이블 생성 SQL

```sql
-- =============================================
-- 1. games 테이블 생성
-- =============================================
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'ended')),
    total_slots INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. prizes 테이블 생성
-- =============================================
CREATE TABLE prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    slot_number INTEGER NOT NULL,
    prize_name VARCHAR(200) NOT NULL,
    prize_grade VARCHAR(20),
    is_drawn BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(game_id, slot_number)
);

-- 인덱스 생성
CREATE INDEX idx_prizes_game_id ON prizes(game_id);
CREATE INDEX idx_prizes_is_drawn ON prizes(game_id, is_drawn);

-- =============================================
-- 3. draws 테이블 생성
-- =============================================
CREATE TABLE draws (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prize_id UUID NOT NULL REFERENCES prizes(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_name VARCHAR(50) NOT NULL,
    session_id VARCHAR(100),
    drawn_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(prize_id)
);

-- 인덱스 생성
CREATE INDEX idx_draws_game_id ON draws(game_id);
CREATE INDEX idx_draws_session_id ON draws(session_id);
```

### 2.3 RLS (Row Level Security) 설정

```sql
-- =============================================
-- RLS 활성화
-- =============================================
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;

-- =============================================
-- games 테이블 정책
-- =============================================
-- 모든 사용자 읽기 허용
CREATE POLICY "Games are viewable by everyone"
ON games FOR SELECT
TO anon, authenticated
USING (true);

-- =============================================
-- prizes 테이블 정책
-- =============================================
-- 모든 사용자 읽기 허용
CREATE POLICY "Prizes are viewable by everyone"
ON prizes FOR SELECT
TO anon, authenticated
USING (true);

-- =============================================
-- draws 테이블 정책
-- =============================================
-- 모든 사용자 읽기 허용
CREATE POLICY "Draws are viewable by everyone"
ON draws FOR SELECT
TO anon, authenticated
USING (true);

-- 모든 사용자 생성 허용 (뽑기 함수를 통해서만 실행)
CREATE POLICY "Draws can be created by anyone"
ON draws FOR INSERT
TO anon, authenticated
WITH CHECK (true);
```

### 2.4 뽑기 함수 생성

```sql
-- =============================================
-- 뽑기 실행 함수 (핵심!)
-- =============================================
CREATE OR REPLACE FUNCTION draw_prize(
    p_game_id UUID,
    p_slot_number INTEGER,
    p_player_name VARCHAR,
    p_session_id VARCHAR
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_prize RECORD;
    v_game_status VARCHAR;
    v_existing_draw RECORD;
    v_new_draw_id UUID;
BEGIN
    -- 1. 게임 상태 확인
    SELECT status INTO v_game_status
    FROM games
    WHERE id = p_game_id;

    IF v_game_status IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'GAME_NOT_FOUND',
            'message', '게임을 찾을 수 없습니다.'
        );
    END IF;

    IF v_game_status != 'active' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'GAME_NOT_ACTIVE',
            'message', '게임이 진행중이 아닙니다.'
        );
    END IF;

    -- 2. 이미 참여했는지 확인
    SELECT * INTO v_existing_draw
    FROM draws
    WHERE game_id = p_game_id AND session_id = p_session_id;

    IF FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'ALREADY_PARTICIPATED',
            'message', '이미 참여하셨습니다.'
        );
    END IF;

    -- 3. 해당 칸 정보 조회 및 잠금 (FOR UPDATE SKIP LOCKED)
    SELECT * INTO v_prize
    FROM prizes
    WHERE game_id = p_game_id AND slot_number = p_slot_number
    FOR UPDATE SKIP LOCKED;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'SLOT_LOCKED',
            'message', '다른 사람이 선택 중입니다. 다른 번호를 선택해주세요.'
        );
    END IF;

    -- 4. 이미 뽑힌 칸인지 확인
    IF v_prize.is_drawn THEN
        RETURN json_build_object(
            'success', false,
            'error', 'ALREADY_DRAWN',
            'message', '이미 뽑힌 번호입니다.'
        );
    END IF;

    -- 5. 뽑기 처리
    UPDATE prizes
    SET is_drawn = true
    WHERE id = v_prize.id;

    INSERT INTO draws (prize_id, game_id, player_name, session_id)
    VALUES (v_prize.id, p_game_id, p_player_name, p_session_id)
    RETURNING id INTO v_new_draw_id;

    -- 6. 결과 반환
    RETURN json_build_object(
        'success', true,
        'draw_id', v_new_draw_id,
        'prize_name', v_prize.prize_name,
        'prize_grade', v_prize.prize_grade,
        'slot_number', v_prize.slot_number,
        'is_winner', v_prize.prize_grade IS NOT NULL
    );
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION draw_prize TO anon, authenticated;
```

### 2.5 관리자용 함수

```sql
-- =============================================
-- 게임 리셋 함수
-- =============================================
CREATE OR REPLACE FUNCTION reset_game(p_game_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 뽑기 기록 삭제
    DELETE FROM draws WHERE game_id = p_game_id;

    -- 모든 칸 초기화
    UPDATE prizes SET is_drawn = false WHERE game_id = p_game_id;

    -- 게임 상태 대기로 변경
    UPDATE games SET status = 'waiting', updated_at = NOW()
    WHERE id = p_game_id;
END;
$$;

-- =============================================
-- 100개 슬롯 생성 함수
-- =============================================
CREATE OR REPLACE FUNCTION create_game_slots(
    p_game_id UUID,
    p_default_prize VARCHAR DEFAULT '꽝'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO prizes (game_id, slot_number, prize_name)
    SELECT p_game_id, generate_series(1, 100), p_default_prize;
END;
$$;
```

## 3. Realtime 설정

### 3.1 Realtime 활성화
```sql
-- prizes 테이블 Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE prizes;

-- draws 테이블 Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE draws;

-- games 테이블 Realtime 활성화 (게임 상태 변경 감지용)
ALTER PUBLICATION supabase_realtime ADD TABLE games;
```

### 3.2 Realtime 설정 확인
1. Supabase 대시보드 → Database → Replication
2. `supabase_realtime` publication에 테이블이 추가되었는지 확인

## 4. 초기 데이터 생성

### 4.1 테스트 게임 생성
```sql
-- 게임 생성
INSERT INTO games (name, status)
VALUES ('2024 송년회 럭키드로우', 'waiting')
RETURNING id;

-- 반환된 id를 복사해서 아래에 사용
-- 예: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
```

### 4.2 100개 슬롯 생성
```sql
-- 위에서 생성된 game_id를 사용
SELECT create_game_slots('여기에_game_id_입력');
```

### 4.3 경품 배치 예시
```sql
-- game_id 변수 설정 (실제 ID로 교체)
DO $$
DECLARE
    v_game_id UUID := '여기에_game_id_입력';
BEGIN
    -- 1등 (1개)
    UPDATE prizes SET prize_name = '상품권 10만원', prize_grade = '1등'
    WHERE game_id = v_game_id AND slot_number = 42;

    -- 2등 (3개)
    UPDATE prizes SET prize_name = '상품권 5만원', prize_grade = '2등'
    WHERE game_id = v_game_id AND slot_number IN (7, 23, 88);

    -- 3등 (5개)
    UPDATE prizes SET prize_name = '상품권 1만원', prize_grade = '3등'
    WHERE game_id = v_game_id AND slot_number IN (3, 15, 51, 67, 94);

    -- 4등 (10개)
    UPDATE prizes SET prize_name = '편의점 상품권 5천원', prize_grade = '4등'
    WHERE game_id = v_game_id AND slot_number IN (11, 22, 33, 44, 55, 66, 77, 81, 92, 99);

    -- 5등 (20개)
    UPDATE prizes SET prize_name = '커피 쿠폰', prize_grade = '5등'
    WHERE game_id = v_game_id AND slot_number IN (
        1, 10, 19, 28, 37, 46, 52, 61, 70, 79,
        5, 14, 25, 36, 48, 59, 63, 74, 85, 96
    );
END $$;
```

## 5. Next.js 연동

### 5.1 환경 변수 설정 (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 관리자용 (서버 사이드에서만 사용)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 게임 ID (고정)
NEXT_PUBLIC_GAME_ID=your-game-uuid
```

### 5.2 Supabase 클라이언트 설정

**lib/supabase/client.ts**
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**lib/supabase/server.ts**
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}
```

### 5.3 타입 생성 (선택)
```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# 타입 생성
supabase gen types typescript --project-id your-project-id > src/lib/supabase/types.ts
```

## 6. 테스트 체크리스트

- [ ] games 테이블 조회 가능
- [ ] prizes 테이블 조회 가능
- [ ] draw_prize 함수 실행 가능
- [ ] Realtime 구독 동작 확인
- [ ] 동시성 테스트 (여러 탭에서 같은 번호 클릭)

## 7. 문제 해결

### 7.1 RLS 오류
```
new row violates row-level security policy
```
→ RLS 정책이 올바르게 설정되었는지 확인

### 7.2 Realtime 작동 안함
→ Replication 설정에서 테이블이 추가되었는지 확인
→ 클라이언트에서 올바른 채널 구독 여부 확인

### 7.3 함수 실행 권한 오류
→ `GRANT EXECUTE ON FUNCTION` 실행 확인
→ `SECURITY DEFINER` 설정 확인

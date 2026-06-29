# Oneday Class Template - 원데이클래스

> 공예, 요리, 플라워 등 원데이클래스를 운영하는 1인 강사를 위한 수강 예약 시스템

---

## 타겟 고객

- 캔들/비누 클래스
- 플라워 클래스
- 도자기/세라믹 클래스
- 요리/베이킹 클래스
- 가죽공예 클래스
- 드로잉/아트 클래스
- 뜨개질/자수 클래스

---

## 핵심 기능

| 기능 | ON/OFF | 설명 |
|-----|--------|------|
| 클래스 관리 | 기본 | 클래스 일정, 커리큘럼 |
| 예약 | ON | 일정별 인원 제한 |
| 재고 | OFF | 재료는 클래스 포함 |
| 배송 | OFF | 현장 수업 |

---

## 클래스 구조

```typescript
interface Class {
  id: string;
  name: string;
  description: string;
  category: string;

  // 기본 정보
  duration: number;        // 소요시간 (분)
  price: number;
  max_participants: number;
  min_participants?: number;  // 최소 인원 (미달 시 취소)

  // 커리큘럼
  curriculum: string[];
  what_you_learn: string[];
  what_you_get: string[];   // 완성품, 재료 등

  // 이미지
  images: string[];
  thumbnail: string;

  // 대상
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  age_restriction?: string;  // "성인", "전연령", "7세 이상"

  // 준비물
  materials_included: boolean;  // 재료 포함 여부
  what_to_bring?: string[];     // 가져와야 할 것

  is_active: boolean;
}

interface ClassSchedule {
  id: string;
  class_id: string;
  date: Date;
  start_time: string;
  end_time: string;
  max_participants: number;
  current_participants: number;
  status: 'open' | 'full' | 'cancelled' | 'completed';
}

interface ClassReservation {
  id: string;
  schedule_id: string;

  // 참가자 정보
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  participants: number;      // 신청 인원

  // 결제
  total_price: number;
  payment_status: 'pending' | 'paid' | 'refunded';

  // 상태
  status: 'pending' | 'confirmed' | 'attended' | 'no_show' | 'cancelled';
}
```

---

## Supabase SQL

```sql
-- ============================================
-- 원데이클래스 전용 스키마
-- ============================================

-- 1. 공방 설정
CREATE TABLE public.studio_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_name TEXT NOT NULL,
  studio_description TEXT,
  logo_url TEXT,

  -- 연락처
  contact_phone TEXT,
  contact_email TEXT,
  instagram_url TEXT,

  -- 위치
  address TEXT,
  address_detail TEXT,
  map_url TEXT,            -- 네이버/카카오 지도 링크
  parking_info TEXT,       -- 주차 안내

  -- 결제
  bank_name TEXT,
  bank_account TEXT,
  bank_holder TEXT,
  prepayment_required BOOLEAN DEFAULT true,

  -- 정책
  cancel_policy TEXT,      -- 취소/환불 정책
  min_hours_before INTEGER DEFAULT 24,  -- 취소 가능 시간

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 카테고리
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- 3. 클래스
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id),

  name TEXT NOT NULL,
  subtitle TEXT,           -- 부제목
  description TEXT,

  -- 이미지
  images TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,

  -- 기본 정보
  duration INTEGER NOT NULL,   -- 소요시간 (분)
  price INTEGER NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 6,
  min_participants INTEGER DEFAULT 1,

  -- 커리큘럼
  curriculum TEXT[] DEFAULT '{}',
  what_you_learn TEXT[] DEFAULT '{}',
  what_you_get TEXT[] DEFAULT '{}',

  -- 대상
  difficulty TEXT DEFAULT 'beginner'
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  age_restriction TEXT,

  -- 준비물
  materials_included BOOLEAN DEFAULT true,
  what_to_bring TEXT[] DEFAULT '{}',

  -- 상태
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 클래스 일정
CREATE TABLE public.class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,

  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  max_participants INTEGER NOT NULL,
  current_participants INTEGER DEFAULT 0,

  -- 특별 가격 (이벤트 등)
  special_price INTEGER,

  status TEXT DEFAULT 'open'
    CHECK (status IN ('open', 'full', 'cancelled', 'completed')),

  note TEXT,  -- 일정 메모

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(class_id, date, start_time)
);

-- 5. 예약
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_number TEXT NOT NULL UNIQUE,

  schedule_id UUID REFERENCES public.class_schedules(id),
  class_id UUID REFERENCES public.classes(id),

  -- 클래스 정보 스냅샷
  class_name TEXT NOT NULL,
  class_date DATE NOT NULL,
  class_time TIME NOT NULL,
  class_duration INTEGER NOT NULL,

  -- 예약자 정보
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,

  -- 인원
  participants INTEGER DEFAULT 1,

  -- 금액
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,

  -- 결제
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_confirmed_at TIMESTAMPTZ,

  -- 상태
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'attended', 'no_show', 'cancelled')),

  -- 출석
  attended_at TIMESTAMPTZ,

  -- 메모
  customer_note TEXT,
  admin_note TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 관리자
CREATE TABLE public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.studio_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON public.studio_settings FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read" ON public.classes FOR SELECT USING (is_active = true);
CREATE POLICY "Public read" ON public.class_schedules FOR SELECT USING (status IN ('open', 'full'));

CREATE POLICY "Anyone create reservation" ON public.reservations FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admin full" ON public.studio_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full" ON public.classes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full" ON public.class_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full" ON public.reservations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER classes_updated BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER schedules_updated BEFORE UPDATE ON public.class_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER reservations_updated BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 예약번호 생성
CREATE OR REPLACE FUNCTION generate_reservation_number()
RETURNS TRIGGER AS $$
DECLARE today_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count FROM public.reservations WHERE DATE(created_at) = CURRENT_DATE;
  NEW.reservation_number := 'CLASS-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservations_number BEFORE INSERT ON public.reservations FOR EACH ROW EXECUTE FUNCTION generate_reservation_number();

-- 예약 시 인원 업데이트
CREATE OR REPLACE FUNCTION update_schedule_participants()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.class_schedules
  SET current_participants = current_participants + NEW.participants
  WHERE id = NEW.schedule_id;

  -- 정원 초과 체크
  UPDATE public.class_schedules
  SET status = 'full'
  WHERE id = NEW.schedule_id AND current_participants >= max_participants;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservation_update_participants AFTER INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION update_schedule_participants();

-- 예약 취소 시 인원 복구
CREATE OR REPLACE FUNCTION restore_schedule_participants()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.class_schedules
    SET current_participants = GREATEST(0, current_participants - OLD.participants),
        status = 'open'
    WHERE id = OLD.schedule_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservation_restore_participants AFTER UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION restore_schedule_participants();

ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_schedules;

-- ============================================
-- 초기 데이터
-- ============================================
INSERT INTO public.studio_settings (studio_name, studio_description, cancel_policy, min_hours_before) VALUES
  ('아로마공방', '향기로운 캔들 & 디퓨저 원데이클래스',
   '수업 24시간 전까지 전액 환불, 24시간 이내 환불 불가', 24);

INSERT INTO public.categories (name, sort_order) VALUES
  ('캔들', 1),
  ('디퓨저', 2),
  ('석고방향제', 3),
  ('비누', 4);

INSERT INTO public.classes (name, subtitle, description, duration, price, max_participants, difficulty, curriculum, what_you_get, category_id)
SELECT
  '소이캔들 원데이클래스',
  '나만의 향기로운 캔들 만들기',
  '천연 소이왁스를 사용해 나만의 캔들을 만들어보세요.',
  120,
  45000,
  6,
  'beginner',
  '{"캔들 이론 설명", "향료 블렌딩", "왁스 녹이기", "용기에 붓기", "심지 세팅", "포장"}',
  '{"소이캔들 2개 (100g, 200g)", "캔들 관리 가이드"}',
  id
FROM public.categories WHERE name = '캔들';
```

---

## 클래스 상세 페이지

```
┌─────────────────────────────────────────────────────────────┐
│  [이미지 갤러리]                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                        │  │
│  │              소이캔들 원데이클래스                      │  │
│  │                                                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  소이캔들 원데이클래스                                       │
│  나만의 향기로운 캔들 만들기                                 │
│                                                              │
│  ⏱ 2시간  |  💰 45,000원  |  👥 최대 6명                   │
│  🌱 난이도: 초급  |  📦 재료 포함                           │
│                                                              │
│  ─────────────────────────────────────────                  │
│                                                              │
│  📝 커리큘럼                                                 │
│  1. 캔들 이론 설명 (20분)                                    │
│  2. 향료 블렌딩 (20분)                                       │
│  3. 왁스 녹이기 & 붓기 (40분)                               │
│  4. 심지 세팅 & 마무리 (30분)                               │
│  5. 포장 (10분)                                              │
│                                                              │
│  🎁 가져가는 것                                              │
│  • 소이캔들 2개 (100g, 200g)                                │
│  • 캔들 관리 가이드                                          │
│                                                              │
│  ─────────────────────────────────────────                  │
│                                                              │
│  📅 수업 일정                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 12/28 (토) 14:00-16:00    2/6명    [예약하기]       │   │
│  │ 12/29 (일) 11:00-13:00    4/6명    [예약하기]       │   │
│  │ 12/29 (일) 14:00-16:00    마감     [대기신청]       │   │
│  │ 01/04 (토) 14:00-16:00    0/6명    [예약하기]       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  📍 위치                                                     │
│  서울시 강남구 테헤란로 123, 2층                            │
│  [지도보기]  🚗 주차 가능 (2시간 무료)                      │
│                                                              │
│  ⚠️ 취소/환불 정책                                          │
│  • 수업 24시간 전: 전액 환불                                │
│  • 수업 24시간 이내: 환불 불가                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 예약 페이지

```
┌─────────────────────────────────────────────────────────────┐
│  소이캔들 원데이클래스 예약                                  │
│                                                              │
│  📅 12월 28일 (토) 14:00 - 16:00                            │
│  남은 자리: 4/6명                                            │
│                                                              │
│  ─────────────────────────────────────────                  │
│                                                              │
│  인원 선택:                                                  │
│  [ - ]  2명  [ + ]                                          │
│                                                              │
│  예약자 정보:                                                │
│  성함: [홍길동                    ]                          │
│  연락처: [010-1234-5678           ]                          │
│  이메일: [hong@email.com           ]                         │
│                                                              │
│  요청사항 (선택):                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 친구와 함께 갑니다!                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ─────────────────────────────────────────                  │
│                                                              │
│  💰 결제 정보                                                │
│  45,000원 × 2명 = 90,000원                                  │
│                                                              │
│  우리은행 1002-123-456789 홍길동                            │
│  입금 확인 후 예약이 확정됩니다.                             │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  예약 신청하기                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 관리자 - 일정 관리

```
┌─────────────────────────────────────────────────────────────┐
│  📅 12월 수업 일정                          [+ 일정 추가]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  12월 28일 (토)                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 14:00  소이캔들 원데이클래스                        │   │
│  │ 👥 4/6명 (홍길동 2명, 김철수 2명)                  │   │
│  │ [상세] [출석체크]                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  12월 29일 (일)                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 11:00  디퓨저 원데이클래스                          │   │
│  │ 👥 3/4명                                            │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 14:00  소이캔들 원데이클래스  [마감]                │   │
│  │ 👥 6/6명                                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 주요 기능

- [x] 클래스 정보 관리 (커리큘럼, 준비물 등)
- [x] 일정별 인원 제한
- [x] 실시간 잔여석 표시
- [x] 다인원 예약 (친구와 함께)
- [x] 정원 마감 시 자동 상태 변경
- [x] 취소 시 인원 자동 복구
- [x] 출석 체크
- [ ] 대기자 신청
- [ ] 정기 클래스 (매주 토요일 등)
- [ ] 수강 후기
- [ ] 쿠폰/할인

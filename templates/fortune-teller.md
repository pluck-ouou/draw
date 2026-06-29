# Fortune Teller Template - 타로/사주 상담

> 사주, 타로, 신점, 손금 등 1:1 상담 서비스를 제공하는 운세 상담사를 위한 예약 시스템

---

## 타겟 고객

- 타로 상담사
- 사주/명리학 상담사
- 신점/무속인
- 손금/관상 전문가
- 심리상담 겸업자

---

## 비즈니스 플로우

```
[고객]                              [상담사]
  │                                    │
  ├─ 1. 상담 메뉴 선택                  │
  ├─ 2. 예약 가능 시간 확인             │
  ├─ 3. 예약 신청 ─────────────────────►├─ 4. 예약 확인
  │                                    │
  │◄─────────────────────────────────── ├─ 5. 입금 안내 (선결제 시)
  │                                    │
  ├─ 6. 결제 완료 ─────────────────────►├─ 7. 예약 확정
  │                                    │
  ├─ 8. 상담 진행 (대면/비대면) ────────►├─ 9. 상담 완료 처리
  │                                    │
  └────────────────────────────────────┘
```

---

## 상담 메뉴 구조

### 상담 유형
| 유형 | 코드 | 설명 |
|-----|-----|------|
| 사주팔자 | saju | 생년월일시 기반 운세 |
| 타로 | tarot | 카드 리딩 |
| 신점 | oracle | 신내림 상담 |
| 손금/관상 | palm | 대면 전용 |
| 궁합 | compatibility | 2인 기준 |
| 작명 | naming | 이름 짓기 |

### 상담 방식
| 방식 | 코드 | 비고 |
|-----|-----|------|
| 대면 | in-person | 상담실 방문 |
| 전화 | phone | 통화 상담 |
| 영상통화 | video | 줌/카카오 |
| 채팅 | chat | 카톡/문자 |
| 음성녹음 | voice-record | 녹음 파일 전송 |

### 예시 메뉴
```yaml
menus:
  - name: "사주팔자 기본상담"
    type: saju
    duration: 60  # 분
    price: 50000
    methods: [in-person, phone, video]
    description: "올해 운세, 재물운, 건강운, 직업운"

  - name: "타로 연애운"
    type: tarot
    duration: 30
    price: 30000
    methods: [in-person, phone, video, chat]
    description: "현재 연애 상황, 상대방 마음, 미래 전망"

  - name: "타로 종합운"
    type: tarot
    duration: 60
    price: 50000
    methods: [in-person, phone, video]

  - name: "신년운세 패키지"
    type: saju
    duration: 90
    price: 100000
    methods: [in-person, phone, video]
    description: "2025년 월별 운세 + 대운 분석"

  - name: "커플 궁합"
    type: compatibility
    duration: 60
    price: 80000
    methods: [in-person, phone, video]
    requires_partner_info: true

  - name: "작명 서비스"
    type: naming
    duration: null  # 비동기
    price: 150000
    methods: [voice-record]
    deliverable: "이름 후보 3개 + 해설"
```

---

## 예약 필드

```typescript
interface FortuneReservation {
  // 고객 정보
  customer_name: string;
  customer_phone: string;
  customer_email?: string;

  // 상담 대상 정보 (사주용)
  birth_date: Date;         // 생년월일
  birth_time?: string;      // 태어난 시간 (모르면 null)
  birth_time_unknown: boolean;
  lunar_calendar: boolean;  // 음력 여부
  gender: 'male' | 'female';

  // 궁합 상담 시 상대방 정보
  partner_info?: {
    name: string;
    birth_date: Date;
    birth_time?: string;
    gender: 'male' | 'female';
  };

  // 상담 선택
  menu_id: string;
  consultation_method: 'in-person' | 'phone' | 'video' | 'chat' | 'voice-record';

  // 예약 일시
  reservation_date: Date;
  reservation_time: string;

  // 상담 주제/질문 (미리 받기)
  main_concerns: string[];   // 연애, 직업, 재물, 건강, 가족 등
  specific_questions?: string;

  // 금액
  price: number;

  // 상태
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  payment_status: 'pending' | 'paid' | 'refunded';

  // 상담 후
  consultation_notes?: string;  // 상담사 메모
  follow_up_date?: Date;        // 다음 상담 권장일
}
```

---

## Supabase SQL

```sql
-- ============================================
-- 운세 상담 전용 스키마
-- ============================================

-- 1. 상담사 프로필/설정
CREATE TABLE public.consultant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT,                    -- "타로마스터", "명리학 박사"
  introduction TEXT,             -- 자기소개
  profile_image_url TEXT,

  -- 연락처
  contact_phone TEXT,
  contact_kakao TEXT,

  -- 결제
  bank_name TEXT,
  bank_account TEXT,
  bank_holder TEXT,
  prepayment_required BOOLEAN DEFAULT true,  -- 선결제 필수 여부

  -- 운영
  available_days INTEGER[] DEFAULT '{1,2,3,4,5,6}',
  available_hours JSONB DEFAULT '{"start": "10:00", "end": "20:00"}',
  slot_duration INTEGER DEFAULT 30,  -- 기본 슬롯 단위 (분)
  break_between INTEGER DEFAULT 10,  -- 상담 사이 휴식 (분)
  max_per_day INTEGER DEFAULT 8,
  blocked_dates DATE[] DEFAULT '{}',

  -- 상담 방식
  location_address TEXT,         -- 대면 상담 주소
  video_platform TEXT,           -- zoom, kakaotalk, etc

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 상담 메뉴
CREATE TABLE public.consultation_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,            -- saju, tarot, oracle, palm, compatibility, naming
  description TEXT,
  duration INTEGER NOT NULL,     -- 소요시간 (분), null이면 비동기
  price INTEGER NOT NULL,

  -- 가능한 상담 방식
  available_methods TEXT[] DEFAULT '{"in-person","phone","video"}',

  -- 추가 정보 필요 여부
  requires_birth_time BOOLEAN DEFAULT false,
  requires_partner_info BOOLEAN DEFAULT false,

  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 상담 가능 시간 슬롯 (일별)
CREATE TABLE public.time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  reservation_id UUID,           -- 예약된 경우 연결
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(date, time)
);

-- 4. 예약
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_number TEXT NOT NULL UNIQUE,

  -- 고객 정보
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,

  -- 상담 대상 정보
  birth_date DATE NOT NULL,
  birth_time TIME,
  birth_time_unknown BOOLEAN DEFAULT false,
  is_lunar BOOLEAN DEFAULT false,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),

  -- 상대방 정보 (궁합용)
  partner_name TEXT,
  partner_birth_date DATE,
  partner_birth_time TIME,
  partner_gender TEXT CHECK (partner_gender IN ('male', 'female')),

  -- 상담 선택
  menu_id UUID REFERENCES public.consultation_menus(id),
  menu_name TEXT NOT NULL,
  consultation_method TEXT NOT NULL
    CHECK (consultation_method IN ('in-person', 'phone', 'video', 'chat', 'voice-record')),

  -- 예약 일시
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  duration INTEGER NOT NULL,      -- 분

  -- 상담 내용
  main_concerns TEXT[] DEFAULT '{}',  -- 연애, 직업, 재물, 건강 등
  specific_questions TEXT,

  -- 금액
  price INTEGER NOT NULL,
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_confirmed_at TIMESTAMPTZ,

  -- 상태
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),

  -- 상담 후
  consultation_notes TEXT,
  follow_up_recommended BOOLEAN DEFAULT false,
  follow_up_date DATE,

  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 관리자
CREATE TABLE public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.consultant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- 공개 조회
CREATE POLICY "Public read settings" ON public.consultant_settings FOR SELECT USING (true);
CREATE POLICY "Public read menus" ON public.consultation_menus FOR SELECT USING (is_active = true);
CREATE POLICY "Public read available slots" ON public.time_slots FOR SELECT USING (is_available = true);

-- 예약 생성
CREATE POLICY "Anyone can create reservation" ON public.reservations
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 관리자 전체 권한
CREATE POLICY "Admin full access settings" ON public.consultant_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access menus" ON public.consultation_menus FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access slots" ON public.time_slots FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access reservations" ON public.reservations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservations_updated_at BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 예약번호 생성 (FORTUNE-20241224-001)
CREATE OR REPLACE FUNCTION generate_reservation_number()
RETURNS TRIGGER AS $$
DECLARE today_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count FROM public.reservations WHERE DATE(created_at) = CURRENT_DATE;
  NEW.reservation_number := 'FORTUNE-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservations_generate_number BEFORE INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION generate_reservation_number();

-- 슬롯 예약 처리
CREATE OR REPLACE FUNCTION mark_slot_reserved()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.time_slots
  SET is_available = false, reservation_id = NEW.id
  WHERE date = NEW.reservation_date AND time = NEW.reservation_time;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservation_mark_slot AFTER INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION mark_slot_reserved();

-- 실시간
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_slots;

-- ============================================
-- 초기 데이터
-- ============================================
INSERT INTO public.consultant_settings (name, title, introduction, prepayment_required) VALUES
  ('별빛타로', '타로마스터', '10년 경력의 타로 전문 상담사입니다.', true);

INSERT INTO public.consultation_menus (name, type, description, duration, price, available_methods, requires_birth_time, sort_order) VALUES
  ('사주팔자 기본상담', 'saju', '올해 운세, 재물운, 건강운, 직업운 종합 분석', 60, 50000, '{"in-person","phone","video"}', true, 1),
  ('타로 연애운', 'tarot', '현재 연애 상황, 상대방 마음, 미래 전망', 30, 30000, '{"in-person","phone","video","chat"}', false, 2),
  ('타로 종합운', 'tarot', '연애, 직업, 재물, 건강 종합 리딩', 60, 50000, '{"in-person","phone","video"}', false, 3),
  ('신년운세 패키지', 'saju', '2025년 월별 운세 + 대운 분석', 90, 100000, '{"in-person","phone","video"}', true, 4),
  ('커플 궁합', 'compatibility', '두 분의 사주 궁합 분석', 60, 80000, '{"in-person","phone","video"}', true, 5),
  ('작명 서비스', 'naming', '이름 후보 3개 + 한자 해설', null, 150000, '{"voice-record"}', true, 6);
```

---

## 예약 페이지 UI

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: 상담 메뉴 선택                                       │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ⭐ 인기  사주팔자 기본상담                            │    │
│  │ 올해 운세, 재물운, 건강운, 직업운                    │    │
│  │ 60분 | 50,000원                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 타로 연애운                                          │    │
│  │ 현재 연애 상황, 상대방 마음, 미래 전망               │    │
│  │ 30분 | 30,000원                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  상담 방식: ● 대면  ○ 전화  ○ 영상통화  ○ 채팅           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 2: 생년월일 정보                                        │
│                                                              │
│  생년월일: [1990] 년 [01] 월 [15] 일                         │
│  ○ 양력  ● 음력                                             │
│                                                              │
│  태어난 시간: [모름 ▼]                                       │
│  ※ 시간을 모르셔도 상담 가능하지만 정확도가 떨어질 수 있습니다 │
│                                                              │
│  성별: ● 남성  ○ 여성                                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 3: 예약 일시                                            │
│                                                              │
│  📅 12월 2024                                               │
│  ┌───┬───┬───┬───┬───┬───┬───┐                              │
│  │ 일│ 월│ 화│ 수│ 목│ 금│ 토│                              │
│  ├───┼───┼───┼───┼───┼───┼───┤                              │
│  │   │   │   │ 25│ 26│[27]│ 28│   ← 선택                    │
│  └───┴───┴───┴───┴───┴───┴───┘                              │
│                                                              │
│  시간: ○ 10:00  ○ 11:00  ● 14:00  ○ 15:00  ○ 16:00        │
│        ○ 17:00  ○ 18:00  ○ 19:00                          │
│                                                              │
│  ※ 회색 시간은 이미 예약된 시간입니다                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 4: 상담 내용                                            │
│                                                              │
│  주요 관심사 (복수 선택 가능):                                │
│  ☑ 연애/결혼  ☐ 직업/취업  ☑ 재물/사업                     │
│  ☐ 건강      ☐ 가족관계  ☐ 학업                            │
│                                                              │
│  궁금한 점 (선택):                                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 현재 만나는 사람과 결혼까지 갈 수 있을지             │    │
│  │ 궁금합니다.                                          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 5: 연락처                                               │
│                                                              │
│  성함: [홍길동                    ]                          │
│  연락처: [010-1234-5678           ]                          │
│  이메일 (선택): [                       ]                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 관리자 - 오늘 일정 뷰

```
┌─────────────────────────────────────────────────────────────┐
│  📅 2024년 12월 27일 (금) 일정                               │
│                                                              │
│  10:00  ────────────────────────────────────────            │
│  11:00  ┌──────────────────────────────────┐                │
│         │ 홍길동 (여, 1990년생)             │                │
│         │ 사주팔자 기본상담 | 대면           │                │
│  12:00  │ 📞 010-1234-5678                │                │
│         │ 관심사: 연애, 재물                │                │
│         └──────────────────────────────────┘                │
│  13:00  ── 점심 ──                                          │
│  14:00  ┌──────────────────────────────────┐                │
│         │ 김철수 (남, 1985년생)             │                │
│         │ 타로 연애운 | 전화 (30분)         │                │
│  14:30  └──────────────────────────────────┘                │
│  15:00  ────────────────────────────────────────            │
│  16:00  ┌──────────────────────────────────┐                │
│         │ 이영희 (여, 1992년생)             │                │
│  17:00  │ 신년운세 패키지 (90분)           │                │
│         │ 영상통화 (Zoom)                  │                │
│  17:30  └──────────────────────────────────┘                │
│  18:00  ────────────────────────────────────────            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 주요 기능

- [x] 상담 메뉴별 가격/시간 설정
- [x] 생년월일시 입력 (음력 지원)
- [x] 실시간 예약 가능 시간 표시
- [x] 상담 방식 선택 (대면/전화/영상/채팅)
- [x] 궁합 상담 시 상대방 정보 입력
- [x] 상담 전 질문 미리 받기
- [x] 상담 후 메모 기록
- [ ] 카카오톡 알림 연동
- [ ] 정기 상담 고객 관리
- [ ] 상담 녹음 파일 관리

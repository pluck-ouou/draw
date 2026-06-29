# Cake Shop Template - 케이크샵 자사몰

> 레터링 케이크, 주문제작 케이크를 판매하는 1인 베이커리를 위한 예약 시스템

---

## 비즈니스 플로우

```
[고객]                              [관리자]
  │                                    │
  ├─ 1. 상품 선택 & 옵션 조합            │
  ├─ 2. 픽업 날짜/시간 선택              │
  ├─ 3. 주문서 작성 (레터링 등)          │
  ├─ 4. 예약 신청 ─────────────────────►├─ 5. 카톡/전화 상담
  │                                    │
  │◄─────────────────────────────────── ├─ 6. 입금 안내 (계좌 전송)
  │                                    │
  ├─ 7. 입금 완료 ─────────────────────►├─ 8. 입금 확인
  │                                    ├─ 9. 예약 확정 처리
  │◄─────────────────────────────────── ├─ 10. 확정 알림 발송
  │                                    │
  ├─ 11. 픽업일 방문 ──────────────────►├─ 12. 픽업 완료 처리
  │                                    │
  └────────────────────────────────────┘
```

---

## 상품 구조

### 케이크 종류 (shape)
| 종류 | 코드 |
|-----|-----|
| 원형 | circle |
| 하트 | heart |
| 롤케이크 | roll |

### 사이즈 (size)
| 사이즈 | 코드 | 기준 | 기본가 |
|-------|-----|------|-------|
| 미니미니 | mini-mini | 9cm | 25,000 |
| 미니 | mini | 11-12cm | 35,000 |
| 높은미니 | mini-tall | 미니x2 | 40,000 |
| 1호 | size-1 | 15cm | 45,000 |
| 2호 | size-2 | 18cm | 55,000 |
| 3호 | size-3 | 22cm | 65,000 |
| 롤미니 | roll-mini | 11x11cm | 40,000 |
| 롤빅 | roll-big | 21cm | 70,000 |

### 맛 (flavor)
| 맛 | 코드 | 추가금 | 제한 |
|---|-----|-------|-----|
| 바닐라 | vanilla | 0 | - |
| 초코 | choco | 0 | - |
| 얼그레이 | earl-grey | 0 | 미니미니, 롤케이크 불가 |

### 추가 옵션 (addons)
| 옵션 | 코드 | 추가금 | 조건 |
|-----|-----|-------|-----|
| 하트시트 변경 | heart-sheet | 3,000 | 미니, 1호만 |
| 레터링 추가 | extra-lettering | 1,000 | - |
| 긴 레터링 | long-lettering | 1,000 | 영문20자/한글15자 이상 |
| 색상 변경 | color-change | 1,000 | 기본색 외 |
| 투명박스 | clear-box | 2,000 | - |
| 2단 투명박스 | clear-box-2tier | 5,000 | - |

---

## 주문서 필드

```typescript
interface CakeOrder {
  // 고객 정보
  customer_name: string;       // 성함
  customer_phone: string;      // 연락처

  // 픽업 정보
  pickup_date: Date;           // 픽업 날짜
  pickup_time: string;         // 픽업 시간

  // 케이크 선택
  cake_shape: 'circle' | 'heart' | 'roll';
  cake_size: string;
  cake_flavor: 'vanilla' | 'choco' | 'earl-grey';

  // 디자인
  base_color: string;          // 케이크 바탕색
  lettering_color: string;     // 레터링 색상
  lettering_text: string;      // 레터링 문구
  lettering_position: 'plate' | 'cake';  // 케이크판/케이크 위

  // 포장
  box_type: 'paper' | 'clear' | 'clear-2tier';

  // 추가 옵션
  addons: string[];            // 선택된 추가 옵션들

  // 요청사항
  special_request?: string;

  // 금액
  base_price: number;
  addon_price: number;
  total_price: number;

  // 상태
  status: 'pending' | 'contacted' | 'paid' | 'confirmed' | 'completed' | 'cancelled';
  payment_confirmed_at?: Date;
  admin_note?: string;
}
```

---

## Supabase SQL

```sql
-- ============================================
-- 케이크샵 전용 스키마
-- ============================================

-- 1. 스토어 설정
CREATE TABLE public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT NOT NULL DEFAULT '케이크샵',
  store_description TEXT,
  logo_url TEXT,
  instagram_url TEXT,
  kakao_channel_url TEXT,

  -- 연락처
  contact_phone TEXT,
  contact_kakao TEXT,

  -- 입금 정보
  bank_name TEXT NOT NULL,
  bank_account TEXT NOT NULL,
  bank_holder TEXT NOT NULL,

  -- 운영 설정
  min_advance_days INTEGER DEFAULT 3,      -- 최소 3일 전 예약
  max_orders_per_day INTEGER DEFAULT 5,    -- 하루 최대 5건
  available_days INTEGER[] DEFAULT '{1,2,3,4,5,6}', -- 월~토
  pickup_times TEXT[] DEFAULT '{"12:00","14:00","16:00","18:00"}',
  blocked_dates DATE[] DEFAULT '{}',       -- 휴무일

  -- 공지
  notice_text TEXT,  -- 상단 공지 (환불규정 등)

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 케이크 사이즈
CREATE TABLE public.cake_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,         -- mini-mini, mini, size-1...
  name TEXT NOT NULL,                -- 미니미니, 미니, 1호...
  size_cm TEXT,                      -- 9cm, 11-12cm...
  base_price INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- 제한
  available_shapes TEXT[] DEFAULT '{"circle","heart"}',  -- 가능한 모양
  available_flavors TEXT[] DEFAULT '{"vanilla","choco","earl-grey"}',

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 케이크 맛
CREATE TABLE public.cake_flavors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  extra_price INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  -- 제한 (이 맛은 특정 사이즈에서 불가)
  excluded_sizes TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 추가 옵션
CREATE TABLE public.cake_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  extra_price INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  -- 조건부 옵션 (특정 사이즈에만 적용)
  applicable_sizes TEXT[] DEFAULT '{}',  -- 빈 배열 = 모든 사이즈

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 색상 프리셋
CREATE TABLE public.color_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,              -- 화이트, 핑크, 민트...
  hex_code TEXT NOT NULL,          -- #FFFFFF
  type TEXT CHECK (type IN ('base', 'lettering', 'both')) DEFAULT 'both',
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 주문/예약
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,

  -- 고객 정보
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,

  -- 픽업 정보
  pickup_date DATE NOT NULL,
  pickup_time TIME NOT NULL,

  -- 케이크 선택
  cake_shape TEXT NOT NULL CHECK (cake_shape IN ('circle', 'heart', 'roll')),
  cake_size_code TEXT NOT NULL,
  cake_size_name TEXT NOT NULL,
  cake_flavor_code TEXT NOT NULL,
  cake_flavor_name TEXT NOT NULL,

  -- 디자인
  base_color TEXT NOT NULL,
  lettering_color TEXT,
  lettering_text TEXT,
  lettering_position TEXT CHECK (lettering_position IN ('plate', 'cake')),

  -- 포장
  box_type TEXT DEFAULT 'paper' CHECK (box_type IN ('paper', 'clear', 'clear-2tier')),

  -- 추가 옵션 (선택된 addon 코드 배열)
  addons TEXT[] DEFAULT '{}',

  -- 요청사항
  special_request TEXT,

  -- 금액
  base_price INTEGER NOT NULL,
  addon_price INTEGER DEFAULT 0,
  total_price INTEGER NOT NULL,

  -- 상태
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'contacted', 'waiting_payment', 'paid', 'confirmed', 'completed', 'cancelled', 'no_show')),

  -- 관리
  payment_confirmed_at TIMESTAMPTZ,
  admin_note TEXT,
  contacted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. 관리자
CREATE TABLE public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cake_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cake_flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cake_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.color_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- 공개 조회
CREATE POLICY "Public read store_settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Public read cake_sizes" ON public.cake_sizes FOR SELECT USING (is_active = true);
CREATE POLICY "Public read cake_flavors" ON public.cake_flavors FOR SELECT USING (is_active = true);
CREATE POLICY "Public read cake_addons" ON public.cake_addons FOR SELECT USING (is_active = true);
CREATE POLICY "Public read color_presets" ON public.color_presets FOR SELECT USING (true);

-- 주문 생성 (비로그인 가능)
CREATE POLICY "Anyone can create order" ON public.orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 관리자 전체 권한
CREATE POLICY "Admin full access" ON public.store_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access sizes" ON public.cake_sizes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access flavors" ON public.cake_flavors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access addons" ON public.cake_addons FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access colors" ON public.color_presets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access orders" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin read own profile" ON public.admin_profiles FOR SELECT TO authenticated USING (auth.uid() = id);

-- ============================================
-- 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 주문번호 생성 (CAKE-20241224-001)
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  today_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM public.orders
  WHERE DATE(created_at) = CURRENT_DATE;

  NEW.order_number := 'CAKE-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_generate_number BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ============================================
-- 실시간 구독
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ============================================
-- 초기 데이터
-- ============================================

-- 스토어 설정
INSERT INTO public.store_settings (
  store_name,
  store_description,
  bank_name,
  bank_account,
  bank_holder,
  notice_text,
  min_advance_days,
  max_orders_per_day,
  pickup_times
) VALUES (
  '달콤케이크',
  '수제 레터링 케이크 전문',
  '우리은행',
  '1002-553-180452',
  'ㅇㅎㅂ',
  '‼️ 입금 전 필독 ‼️ 예약 확정은 상담순이 아닌 입금순으로 진행됩니다. 주문 제작 케이크는 환불이 어려우니 환불 규정 숙지 후 입금 부탁드려요.',
  3,
  5,
  '{"12:00","14:00","16:00","18:00"}'
);

-- 케이크 사이즈
INSERT INTO public.cake_sizes (code, name, size_cm, base_price, sort_order, available_shapes, available_flavors) VALUES
  ('mini-mini', '미니미니', '9cm', 25000, 1, '{"circle","heart"}', '{"vanilla","choco"}'),
  ('mini', '미니', '11-12cm', 35000, 2, '{"circle","heart"}', '{"vanilla","choco","earl-grey"}'),
  ('mini-tall', '높은미니', '미니x2', 40000, 3, '{"circle","heart"}', '{"vanilla","choco","earl-grey"}'),
  ('size-1', '1호', '15cm', 45000, 4, '{"circle","heart"}', '{"vanilla","choco","earl-grey"}'),
  ('size-2', '2호', '18cm', 55000, 5, '{"circle","heart"}', '{"vanilla","choco","earl-grey"}'),
  ('size-3', '3호', '22cm', 65000, 6, '{"circle","heart"}', '{"vanilla","choco","earl-grey"}'),
  ('roll-mini', '롤미니', '11x11cm', 40000, 7, '{"roll"}', '{"vanilla","choco"}'),
  ('roll-big', '롤빅', '21cm', 70000, 8, '{"roll"}', '{"vanilla","choco"}');

-- 맛
INSERT INTO public.cake_flavors (code, name, extra_price, sort_order, excluded_sizes) VALUES
  ('vanilla', '바닐라', 0, 1, '{}'),
  ('choco', '초코', 0, 2, '{}'),
  ('earl-grey', '얼그레이', 0, 3, '{"mini-mini","roll-mini","roll-big"}');

-- 추가 옵션
INSERT INTO public.cake_addons (code, name, description, extra_price, sort_order, applicable_sizes) VALUES
  ('heart-sheet', '하트시트 변경', '하트 모양 시트로 변경', 3000, 1, '{"mini","size-1"}'),
  ('extra-lettering', '레터링 추가', '추가 레터링', 1000, 2, '{}'),
  ('long-lettering', '긴 레터링', '영문 20자/한글 15자 이상', 1000, 3, '{}'),
  ('color-change', '색상 변경', '기본색 외 색상', 1000, 4, '{}'),
  ('clear-box', '투명박스', '투명 케이크 박스', 2000, 5, '{}'),
  ('clear-box-2tier', '2단 투명박스', '2단 투명 케이크 박스', 5000, 6, '{}');

-- 색상 프리셋
INSERT INTO public.color_presets (name, hex_code, type, is_default, sort_order) VALUES
  ('화이트', '#FFFFFF', 'both', true, 1),
  ('아이보리', '#FFFFF0', 'base', false, 2),
  ('핑크', '#FFB6C1', 'both', false, 3),
  ('민트', '#98FF98', 'both', false, 4),
  ('스카이블루', '#87CEEB', 'both', false, 5),
  ('라벤더', '#E6E6FA', 'both', false, 6),
  ('피치', '#FFDAB9', 'base', false, 7),
  ('골드', '#FFD700', 'lettering', false, 8),
  ('블랙', '#000000', 'lettering', false, 9);
```

---

## 페이지 구조

```
/                           # 메인 (케이크 갤러리 + 메뉴)
/order                      # 주문서 작성
/order/complete             # 주문 완료

/admin                      # 관리자 대시보드
/admin/login                # 로그인
/admin/orders               # 주문 관리
/admin/orders/[id]          # 주문 상세
/admin/calendar             # 캘린더 뷰
/admin/menu                 # 메뉴/가격 관리
/admin/settings             # 설정 (입금정보, 운영시간 등)
```

---

## 주문 페이지 UI 플로우

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: 케이크 선택                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                        │
│  │  원형   │ │  하트   │ │롤케이크 │                        │
│  └─────────┘ └─────────┘ └─────────┘                        │
│                                                              │
│  사이즈 선택                                                  │
│  ○ 미니미니 (9cm) - 25,000원                                 │
│  ● 미니 (11-12cm) - 35,000원                                │
│  ○ 1호 (15cm) - 45,000원                                    │
│  ○ 2호 (18cm) - 55,000원                                    │
│                                                              │
│  맛 선택                                                      │
│  ● 바닐라  ○ 초코  ○ 얼그레이                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 2: 디자인                                               │
│                                                              │
│  케이크 바탕색: [화이트 ▼] 🎨                                  │
│                                                              │
│  레터링                                                       │
│  ┌─────────────────────────────────────┐                    │
│  │ Happy Birthday                      │                    │
│  └─────────────────────────────────────┘                    │
│  레터링 색상: [골드 ▼]                                        │
│  위치: ○ 케이크판  ● 케이크 위                                │
│                                                              │
│  포장: ○ 종이박스  ● 투명박스(+2,000)  ○ 2단투명(+5,000)     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 3: 픽업 예약                                            │
│                                                              │
│  📅 2024년 12월                                              │
│  ┌───┬───┬───┬───┬───┬───┬───┐                              │
│  │ 일│ 월│ 화│ 수│ 목│ 금│ 토│                              │
│  ├───┼───┼───┼───┼───┼───┼───┤                              │
│  │   │   │   │   │ 26│ 27│[28]│   ← 선택된 날짜             │
│  └───┴───┴───┴───┴───┴───┴───┘                              │
│                                                              │
│  픽업 시간: ○ 12:00  ● 14:00  ○ 16:00  ○ 18:00             │
│                                                              │
│  ⚠️ 최소 3일 전 예약 필요                                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 4: 고객 정보                                            │
│                                                              │
│  성함: ┌─────────────────────────────────┐                  │
│       │ 홍길동                           │                  │
│       └─────────────────────────────────┘                  │
│  연락처: ┌─────────────────────────────────┐                │
│         │ 010-1234-5678                  │                  │
│         └─────────────────────────────────┘                │
│  요청사항 (선택):                                             │
│  ┌─────────────────────────────────────────┐                │
│  │ 딸기는 빼주세요                          │                │
│  └─────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  주문 확인                                                    │
│  ─────────────────────────────────────────                  │
│  미니 케이크 (11-12cm) 바닐라                 35,000원       │
│  └ 투명박스                                  +2,000원       │
│  ─────────────────────────────────────────                  │
│  합계                                        37,000원       │
│                                                              │
│  📍 픽업: 2024년 12월 28일 (토) 14:00                        │
│                                                              │
│  ⚠️ 입금 안내                                                │
│  우리은행 1002-553-180452 ㅇㅎㅂ                             │
│  상담 후 입금 시 예약이 확정됩니다.                           │
│                                                              │
│  ┌─────────────────────────────────────────┐                │
│  │           예약 신청하기                   │                │
│  └─────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## 관리자 대시보드

```
┌─────────────────────────────────────────────────────────────┐
│  🎂 달콤케이크 관리자                          [로그아웃]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  오늘의 현황 (12월 24일)                                     │
│  ┌──────────┬──────────┬──────────┬──────────┐              │
│  │ 신규주문  │ 입금대기  │ 확정완료  │ 오늘픽업  │              │
│  │    3     │    2     │    5     │    2     │              │
│  └──────────┴──────────┴──────────┴──────────┘              │
│                                                              │
│  ┌─ 오늘 픽업 ──────────────────────────────────────────┐   │
│  │ 14:00  홍길동  미니 바닐라  "Happy Birthday"  ✅ 확정  │   │
│  │ 16:00  김철수  1호 초코    "축하해"          ✅ 확정  │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─ 최근 주문 ──────────────────────────────────────────┐   │
│  │ CAKE-1224-003  이영희  입금대기  12/28 14:00  37,000 │   │
│  │ CAKE-1224-002  박민수  상담중    12/27 16:00  55,000 │   │
│  │ CAKE-1224-001  최수진  신규      12/29 12:00  45,000 │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 주문 상태 플로우

```
pending (신규)
    ↓ 관리자가 카톡/전화로 연락
contacted (상담중)
    ↓ 입금 계좌 안내
waiting_payment (입금대기)
    ↓ 입금 확인
paid (입금완료)
    ↓ 예약 확정 처리
confirmed (확정)
    ↓ 픽업일 완료 처리
completed (완료)

※ 어느 단계에서든 → cancelled (취소) 가능
※ 픽업 안 오면 → no_show (노쇼)
```

---

## 알림 시나리오

| 시점 | 대상 | 채널 | 내용 |
|-----|-----|-----|------|
| 주문 접수 | 관리자 | 카톡/알림 | 새 주문 알림 |
| 상담 완료 | 고객 | 카톡 | 입금 안내 메시지 |
| 입금 확인 | 고객 | 카톡 | 예약 확정 안내 |
| 픽업 D-1 | 고객 | 카톡 | 픽업 리마인더 |

---

## 환불 규정 (참고)

```
- 픽업 7일 전: 100% 환불
- 픽업 5-6일 전: 80% 환불
- 픽업 3-4일 전: 50% 환불
- 픽업 2일 전 이후: 환불 불가
- 당일 취소/노쇼: 환불 불가
```

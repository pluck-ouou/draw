# Solo Commerce - 1인 자사몰 솔루션

> 네이버 스마트스토어, 크몽에서 벗어나 **나만의 브랜드몰**을 만들고 싶은 1인 사업자를 위한 올인원 솔루션

---

## 타겟 고객

| 업종 | 예시 | 핵심 니즈 |
|------|------|----------|
| 케이크/베이커리 | 생일케이크, 마카롱, 쿠키 판매 | 예약 + 픽업일정 관리 |
| 운세/상담 | 사주, 타로, 신점, 손금 | 예약 + 상담 스케줄 |
| 수제/핸드메이드 | 비누, 캔들, 악세서리, 인형 | 재고 + 주문 관리 |
| 꽃/플라워 | 꽃다발, 화환, 드라이플라워 | 예약 + 당일배송 |
| 반려동물 | 수제간식, 용품, 미용예약 | 상품 + 예약 혼합 |
| 클래스/강의 | 원데이클래스, 개인레슨 | 일정 + 인원 관리 |
| 농산물/식품 | 과일, 반찬, 밀키트 | 재고 + 정기배송 |

---

## 핵심 기능 모듈

### 1. 상품 관리 (기본)

```
products
├── id
├── name (상품명)
├── description (상품 설명)
├── price (가격)
├── sale_price (할인가 - 선택)
├── images[] (이미지 배열)
├── category_id (카테고리)
├── options[] (옵션: 맛, 크기, 색상 등)
├── is_active (판매중/품절/숨김)
├── sort_order (정렬순서)
├── created_at
└── updated_at
```

**기능:**
- 상품 등록/수정/삭제
- 이미지 다중 업로드
- 옵션 설정 (맛: 초코/딸기/바닐라)
- 카테고리 분류
- 드래그앤드롭 순서 변경

---

### 2. 예약 관리 (선택 ON/OFF)

```
reservations
├── id
├── product_id (상품 연결)
├── customer_name
├── customer_phone
├── customer_email (선택)
├── reservation_date (예약 날짜)
├── reservation_time (예약 시간)
├── quantity (수량)
├── total_price (총 금액)
├── options_selected (선택한 옵션)
├── request_note (요청사항)
├── status (pending/confirmed/completed/cancelled)
├── admin_note (관리자 메모)
├── created_at
└── updated_at
```

**기능:**
- 캘린더 기반 예약 현황
- 휴무일/예약불가일 설정
- 시간대별 예약 제한 (하루 최대 5건)
- 예약 확정/취소 처리
- 고객에게 알림톡 발송 (선택)

**설정 옵션:**
```
reservation_settings
├── is_enabled (예약 기능 ON/OFF)
├── advance_days (며칠 전부터 예약 가능)
├── min_advance_hours (최소 몇시간 전 예약)
├── max_per_day (하루 최대 예약 수)
├── max_per_slot (시간대별 최대)
├── available_days[] (영업 요일)
├── available_hours (영업 시간 시작~끝)
├── blocked_dates[] (휴무일)
└── time_slots[] (예약 가능 시간대)
```

---

### 3. 재고 관리 (선택 ON/OFF)

```
inventory
├── id
├── product_id
├── variant_id (옵션별 재고 - 선택)
├── quantity (현재 재고)
├── low_stock_alert (재고 부족 알림 기준)
├── track_inventory (재고 추적 여부)
└── updated_at

inventory_logs (재고 변동 이력)
├── id
├── product_id
├── change_type (in/out/adjust)
├── quantity_change (+10, -1 등)
├── reason (판매/입고/수동조정/폐기)
├── note
└── created_at
```

**기능:**
- 재고 현황 대시보드
- 재고 부족 알림
- 판매 시 자동 차감
- 수동 재고 조정
- 변동 이력 추적

---

### 4. 주문 관리

```
orders
├── id
├── order_number (주문번호: ORD-20241224-001)
├── customer_name
├── customer_phone
├── customer_email
├── shipping_address (배송 주소 - 선택)
├── items[] (주문 상품 목록)
├── subtotal (상품 금액)
├── shipping_fee (배송비)
├── discount (할인)
├── total_price (최종 금액)
├── payment_method (결제 방식)
├── payment_status (paid/pending/refunded)
├── order_status (pending/processing/shipped/delivered/cancelled)
├── tracking_number (송장번호)
├── customer_note (고객 메모)
├── admin_note (관리자 메모)
├── created_at
└── updated_at
```

---

### 5. 고객 관리

```
customers
├── id
├── name
├── phone
├── email
├── address
├── total_orders (총 주문 횟수)
├── total_spent (총 구매 금액)
├── last_order_at (마지막 주문일)
├── tags[] (VIP, 단골, 신규 등)
├── notes (관리자 메모)
├── marketing_agreed (마케팅 수신 동의)
├── created_at
└── updated_at
```

---

## 관리자 설정 화면

```
store_settings
├── store_name (스토어 이름)
├── store_description
├── logo_url
├── contact_phone
├── contact_email
├── business_hours
├── address
├──
├── -- 모듈 ON/OFF --
├── enable_reservation (예약 기능)
├── enable_inventory (재고 관리)
├── enable_shipping (배송 기능)
├── enable_coupon (쿠폰 기능)
├── enable_review (리뷰 기능)
├──
├── -- 결제 --
├── payment_methods[] (카드/계좌이체/무통장)
├── bank_info (무통장 입금 정보)
├──
├── -- 배송 --
├── shipping_fee (기본 배송비)
├── free_shipping_threshold (무료배송 기준)
├──
├── -- 알림 --
├── notify_kakao (카카오 알림톡)
├── notify_sms (SMS)
├── notify_email (이메일)
└── updated_at
```

---

## 업종별 템플릿 예시

### 케이크샵 (예약 중심)

```yaml
name: "달콤케이크"
modules:
  reservation: ON    # 픽업 예약 필수
  inventory: OFF     # 주문제작이라 재고 불필요
  shipping: OFF      # 픽업만

reservation_settings:
  advance_days: 3           # 3일 전부터 예약
  min_advance_hours: 48     # 최소 48시간 전
  max_per_day: 5           # 하루 최대 5개
  available_days: [1,2,3,4,5,6]  # 월~토
  time_slots: ["12:00", "14:00", "16:00", "18:00"]

categories:
  - 생일케이크
  - 기념일케이크
  - 미니케이크
  - 컵케이크
```

### 타로/사주 (상담 예약)

```yaml
name: "별빛타로"
modules:
  reservation: ON    # 상담 예약
  inventory: OFF
  shipping: OFF

reservation_settings:
  max_per_slot: 1          # 1:1 상담
  duration_minutes: 60     # 1시간 단위
  available_days: [1,2,3,4,5]
  time_slots: ["10:00", "11:00", "14:00", "15:00", "16:00"]

products:  # = 상담 메뉴
  - name: "사주팔자 기본상담"
    price: 50000
    duration: 60
  - name: "타로 연애운"
    price: 30000
    duration: 30
  - name: "신년운세 패키지"
    price: 100000
    duration: 90
```

### 수제캔들샵 (재고 중심)

```yaml
name: "아로마공방"
modules:
  reservation: OFF
  inventory: ON     # 재고 관리 필수
  shipping: ON      # 택배 배송

inventory_settings:
  low_stock_alert: 5       # 5개 이하면 알림
  auto_hide_zero: true     # 품절시 자동 숨김

shipping_settings:
  base_fee: 3000
  free_threshold: 50000    # 5만원 이상 무료배송

categories:
  - 소이캔들
  - 필라캔들
  - 디퓨저
  - 왁스타블렛
```

### 원데이클래스 (일정+인원)

```yaml
name: "플라워클래스"
modules:
  reservation: ON
  inventory: OFF
  shipping: OFF

reservation_settings:
  type: "class"
  max_per_slot: 6          # 클래스당 최대 6명

products:
  - name: "꽃다발 원데이클래스"
    price: 80000
    max_participants: 6
    schedule:
      - date: "2024-12-28"
        time: "14:00"
        remaining: 4
```

---

## Supabase 테이블 구조 (SQL)

```sql
-- ============================================
-- 1. 스토어 설정
-- ============================================
CREATE TABLE public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT NOT NULL,
  store_description TEXT,
  logo_url TEXT,
  contact_phone TEXT,
  contact_email TEXT,

  -- 모듈 ON/OFF
  enable_reservation BOOLEAN DEFAULT false,
  enable_inventory BOOLEAN DEFAULT false,
  enable_shipping BOOLEAN DEFAULT true,
  enable_review BOOLEAN DEFAULT false,

  -- 결제
  bank_name TEXT,
  bank_account TEXT,
  bank_holder TEXT,

  -- 배송
  shipping_fee INTEGER DEFAULT 3000,
  free_shipping_threshold INTEGER DEFAULT 50000,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. 카테고리
-- ============================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. 상품
-- ============================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  sale_price INTEGER,
  images TEXT[] DEFAULT '{}',
  options JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  -- 예약 관련 (예약 상품인 경우)
  is_reservation_product BOOLEAN DEFAULT false,
  duration_minutes INTEGER,  -- 소요시간 (상담 등)

  -- 재고 관련
  track_inventory BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_alert INTEGER DEFAULT 5,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. 예약 설정
-- ============================================
CREATE TABLE public.reservation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled BOOLEAN DEFAULT false,
  advance_days INTEGER DEFAULT 7,
  min_advance_hours INTEGER DEFAULT 24,
  max_per_day INTEGER DEFAULT 10,
  max_per_slot INTEGER DEFAULT 1,
  available_days INTEGER[] DEFAULT '{1,2,3,4,5}',
  available_hours JSONB DEFAULT '{"start": "10:00", "end": "18:00"}',
  time_slots TEXT[] DEFAULT '{}',
  blocked_dates DATE[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. 예약
-- ============================================
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  quantity INTEGER DEFAULT 1,
  options_selected JSONB DEFAULT '{}',
  total_price INTEGER NOT NULL,
  request_note TEXT,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 6. 고객
-- ============================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  address TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  marketing_agreed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 7. 주문
-- ============================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address JSONB,
  items JSONB NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping_fee INTEGER DEFAULT 0,
  discount INTEGER DEFAULT 0,
  total_price INTEGER NOT NULL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  order_status TEXT DEFAULT 'pending'
    CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  tracking_number TEXT,
  customer_note TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 8. 재고 변동 로그
-- ============================================
CREATE TABLE public.inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id),
  change_type TEXT CHECK (change_type IN ('in', 'out', 'adjust')),
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reason TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 9. 관리자
-- ============================================
CREATE TABLE public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS 정책
-- ============================================
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- 공개 조회 (상품, 카테고리)
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active categories" ON public.categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view store settings" ON public.store_settings
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view reservation settings" ON public.reservation_settings
  FOR SELECT USING (true);

-- 예약/주문 생성 (비로그인 가능)
CREATE POLICY "Anyone can create reservation" ON public.reservations
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can create order" ON public.orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 관리자 전체 권한
CREATE POLICY "Admin full access to products" ON public.products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to categories" ON public.categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to reservations" ON public.reservations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to orders" ON public.orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to customers" ON public.customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to inventory_logs" ON public.inventory_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to store_settings" ON public.store_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access to reservation_settings" ON public.reservation_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

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

CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER reservations_updated_at BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 주문번호 자동 생성
-- ============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  today_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM public.orders
  WHERE DATE(created_at) = CURRENT_DATE;

  NEW.order_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_generate_number BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ============================================
-- 재고 자동 차감 (주문 생성 시)
-- ============================================
CREATE OR REPLACE FUNCTION update_inventory_on_order()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    UPDATE public.products
    SET stock_quantity = stock_quantity - (item->>'quantity')::INTEGER
    WHERE id = (item->>'product_id')::UUID
      AND track_inventory = true;

    INSERT INTO public.inventory_logs (product_id, change_type, quantity_change, quantity_after, reason)
    SELECT
      (item->>'product_id')::UUID,
      'out',
      -(item->>'quantity')::INTEGER,
      stock_quantity,
      '주문: ' || NEW.order_number
    FROM public.products
    WHERE id = (item->>'product_id')::UUID
      AND track_inventory = true;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_update_inventory AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_inventory_on_order();

-- ============================================
-- 실시간 구독
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ============================================
-- 초기 데이터
-- ============================================
INSERT INTO public.store_settings (store_name, store_description)
VALUES ('내 스토어', '나만의 특별한 스토어입니다.');

INSERT INTO public.reservation_settings (is_enabled)
VALUES (false);
```

---

## 페이지 구조

```
/                       # 메인 (상품 목록)
/product/[id]           # 상품 상세
/cart                   # 장바구니
/checkout               # 결제
/reservation            # 예약 페이지 (예약 ON인 경우)
/order/complete         # 주문 완료

/admin                  # 관리자 대시보드
/admin/login            # 로그인
/admin/products         # 상품 관리
/admin/orders           # 주문 관리
/admin/reservations     # 예약 관리 (ON인 경우)
/admin/inventory        # 재고 관리 (ON인 경우)
/admin/customers        # 고객 관리
/admin/settings         # 스토어 설정
```

---

## 관리자 대시보드 위젯

```
┌─────────────────────────────────────────────────────────┐
│  오늘의 현황                                              │
├──────────┬──────────┬──────────┬──────────┐              │
│ 신규주문  │ 오늘예약  │ 총 매출   │ 재고부족  │              │
│   12     │    5     │ 850,000  │    3     │              │
└──────────┴──────────┴──────────┴──────────┘              │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │ 최근 주문       │  │ 오늘 예약       │               │
│  │ ─────────────── │  │ ─────────────── │               │
│  │ ORD-1224-001   │  │ 14:00 홍길동    │               │
│  │ ORD-1224-002   │  │ 16:00 김철수    │               │
│  │ ORD-1224-003   │  │ 18:00 이영희    │               │
│  └─────────────────┘  └─────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

---

## 향후 확장 가능 기능

- [ ] 쿠폰/할인코드
- [ ] 리뷰 시스템
- [ ] 정기구독 (밀키트, 반찬 등)
- [ ] 카카오 알림톡 연동
- [ ] 토스페이먼츠/포트원 결제 연동
- [ ] 네이버/카카오 로그인
- [ ] 배송 추적 연동
- [ ] 매출 통계/리포트
- [ ] 다국어 지원

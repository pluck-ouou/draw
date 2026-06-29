# Flower Shop Template - 꽃집/플라워샵

> 꽃다발, 화환, 드라이플라워를 판매하는 1인 플로리스트를 위한 예약+배송 시스템

---

## 타겟 고객

- 동네 꽃집
- 웨딩플라워 전문
- 드라이플라워/프리저브드
- 화환/조화 전문
- 플랜테리어샵
- 꽃 정기구독

---

## 핵심 기능

| 기능 | ON/OFF | 설명 |
|-----|--------|------|
| 상품 관리 | 기본 | 꽃다발, 화환 등 |
| 예약 | ON | 픽업/배송 날짜 지정 |
| 배송 | ON | 당일/익일 배송 |
| 주문제작 | ON | 맞춤 꽃다발 |
| 재고 | OFF | 당일 입고 상품 |

---

## 상품 구조

### 상품 유형
| 유형 | 코드 | 특징 |
|-----|-----|------|
| 꽃다발 | bouquet | 사이즈 선택, 주문제작 |
| 꽃바구니 | basket | 사이즈 선택 |
| 화환 | wreath | 리본 문구 |
| 화분 | pot | 재고 관리 |
| 드라이플라워 | dried | 재고 관리 |
| 정기구독 | subscription | 월/격주 배송 |

### 배송 유형
| 유형 | 코드 | 추가비 |
|-----|-----|-------|
| 픽업 | pickup | 0 |
| 당일배송 | same-day | 5,000 |
| 익일배송 | next-day | 3,000 |
| 지정일배송 | scheduled | 3,000 |

---

## 주문서 필드

```typescript
interface FlowerOrder {
  // 고객 정보
  customer_name: string;
  customer_phone: string;

  // 상품 정보
  product_id: string;
  product_name: string;
  size: string;           // S, M, L, XL
  color_tone?: string;    // 핑크톤, 화이트톤, 레드톤

  // 꽃 제외 요청
  excluded_flowers?: string[];  // 알러지 등

  // 리본/카드 문구
  ribbon_text?: string;
  card_message?: string;

  // 배송 정보
  delivery_type: 'pickup' | 'same-day' | 'next-day' | 'scheduled';
  delivery_date: Date;
  delivery_time_slot?: string;  // 오전/오후/저녁

  // 배송지 (배송인 경우)
  recipient_name?: string;
  recipient_phone?: string;
  recipient_address?: string;
  delivery_request?: string;

  // 비밀 배송 여부
  is_secret_delivery: boolean;  // 보내는 사람 비공개

  // 금액
  product_price: number;
  delivery_fee: number;
  total_price: number;

  // 상태
  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
}
```

---

## Supabase SQL

```sql
-- ============================================
-- 꽃집 전용 스키마
-- ============================================

-- 1. 스토어 설정
CREATE TABLE public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT NOT NULL,
  store_description TEXT,
  logo_url TEXT,

  -- 연락처
  contact_phone TEXT,
  contact_kakao TEXT,
  instagram_url TEXT,

  -- 위치
  store_address TEXT,
  store_hours TEXT,  -- 영업시간

  -- 결제
  bank_name TEXT,
  bank_account TEXT,
  bank_holder TEXT,

  -- 배송
  delivery_areas TEXT[],          -- 배송 가능 지역
  same_day_cutoff TIME DEFAULT '14:00',  -- 당일배송 마감
  same_day_fee INTEGER DEFAULT 5000,
  next_day_fee INTEGER DEFAULT 3000,

  -- 공지
  notice_text TEXT,

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

-- 3. 상품
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id),

  name TEXT NOT NULL,
  description TEXT,

  -- 이미지
  images TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,

  -- 가격 (사이즈별)
  sizes JSONB DEFAULT '[]',
  /*
  sizes: [
    { code: "S", name: "스몰", price: 35000 },
    { code: "M", name: "미디움", price: 55000 },
    { code: "L", name: "라지", price: 80000 },
    { code: "XL", name: "스페셜", price: 120000 }
  ]
  */

  -- 색감 옵션
  color_tones TEXT[] DEFAULT '{}',  -- 핑크톤, 화이트톤, 레드톤, 믹스

  -- 상품 유형
  product_type TEXT DEFAULT 'bouquet'
    CHECK (product_type IN ('bouquet', 'basket', 'wreath', 'pot', 'dried', 'subscription')),

  -- 주문제작
  is_custom_order BOOLEAN DEFAULT true,
  min_order_hours INTEGER DEFAULT 3,  -- 최소 주문 시간 (시간)

  -- 화환 전용
  has_ribbon_text BOOLEAN DEFAULT false,

  -- 상태
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 주문
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,

  -- 주문자
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,

  -- 상품
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_size TEXT NOT NULL,
  product_size_name TEXT,
  color_tone TEXT,

  -- 꽃 관련
  excluded_flowers TEXT,  -- 제외할 꽃
  special_request TEXT,   -- 특별 요청

  -- 리본/카드
  ribbon_text TEXT,
  card_message TEXT,

  -- 배송 정보
  delivery_type TEXT NOT NULL
    CHECK (delivery_type IN ('pickup', 'same-day', 'next-day', 'scheduled')),
  delivery_date DATE NOT NULL,
  delivery_time_slot TEXT,  -- morning, afternoon, evening

  -- 수령인 (배송인 경우)
  recipient_name TEXT,
  recipient_phone TEXT,
  recipient_zipcode TEXT,
  recipient_address TEXT,
  recipient_address_detail TEXT,
  delivery_request TEXT,

  -- 비밀 배송
  is_secret_delivery BOOLEAN DEFAULT false,

  -- 금액
  product_price INTEGER NOT NULL,
  delivery_fee INTEGER DEFAULT 0,
  total_price INTEGER NOT NULL,

  -- 결제
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_confirmed_at TIMESTAMPTZ,

  -- 주문 상태
  order_status TEXT DEFAULT 'pending'
    CHECK (order_status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'picked_up', 'cancelled')),

  -- 배송 추적
  delivery_started_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  delivery_photo_url TEXT,  -- 배송 완료 사진

  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 배송 불가일
CREATE TABLE public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  reason TEXT,  -- 휴무, 명절 등
  created_at TIMESTAMPTZ DEFAULT now()
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
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Public read blocked" ON public.blocked_dates FOR SELECT USING (true);

CREATE POLICY "Anyone create order" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admin full" ON public.store_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full" ON public.blocked_dates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE today_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count FROM public.orders WHERE DATE(created_at) = CURRENT_DATE;
  NEW.order_number := 'FLOWER-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ============================================
-- 초기 데이터
-- ============================================
INSERT INTO public.store_settings (store_name, store_description, same_day_cutoff, same_day_fee, next_day_fee) VALUES
  ('플라워블룸', '감성 꽃다발 전문', '14:00', 5000, 3000);

INSERT INTO public.categories (name, sort_order) VALUES
  ('꽃다발', 1),
  ('꽃바구니', 2),
  ('화환/리스', 3),
  ('화분', 4),
  ('드라이플라워', 5);

INSERT INTO public.products (name, category_id, product_type, sizes, color_tones, is_custom_order) VALUES
  ('시그니처 꽃다발', (SELECT id FROM public.categories WHERE name = '꽃다발'),
   'bouquet',
   '[{"code": "S", "name": "스몰", "price": 35000}, {"code": "M", "name": "미디움", "price": 55000}, {"code": "L", "name": "라지", "price": 80000}]'::JSONB,
   '{"핑크톤", "화이트톤", "레드톤", "오렌지톤", "믹스"}',
   true);
```

---

## 주문 페이지 UI

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: 상품 선택                                           │
│                                                              │
│  시그니처 꽃다발                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [이미지]  [이미지]  [이미지]                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  사이즈: ○ S (35,000)  ● M (55,000)  ○ L (80,000)         │
│                                                              │
│  색감: ○ 핑크톤  ● 화이트톤  ○ 레드톤  ○ 믹스             │
│                                                              │
│  제외할 꽃 (선택): [백합 (알러지)                    ]       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 2: 배송 방법                                           │
│                                                              │
│  ● 매장 픽업 (무료)                                          │
│  ○ 당일 배송 (+5,000원) - 14시 이전 주문 시                  │
│  ○ 익일 배송 (+3,000원)                                      │
│  ○ 지정일 배송 (+3,000원)                                    │
│                                                              │
│  📅 배송/픽업일: [2024년 12월 28일 ▼]                        │
│  ⏰ 시간대: ○ 오전 (9-12시)  ● 오후 (12-18시)  ○ 저녁       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 3: 수령인 정보 (배송 선택 시)                           │
│                                                              │
│  ☐ 비밀 배송 (보내는 사람 정보 비공개)                       │
│                                                              │
│  받으시는 분                                                  │
│  성함: [김철수                    ]                          │
│  연락처: [010-9876-5432           ]                          │
│  주소: [검색] 서울시 강남구 테헤란로 123                     │
│  상세주소: [OO빌딩 5층                ]                      │
│                                                              │
│  배송 요청사항: [문 앞에 놓아주세요          ]               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 4: 카드 메시지                                         │
│                                                              │
│  리본 문구 (선택):                                            │
│  [축하합니다                                 ]               │
│                                                              │
│  카드 메시지 (선택):                                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 생일 축하해! 항상 건강하고 행복하길 바래.           │    │
│  │ - 영희가                                            │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 관리자 - 오늘 배송 현황

```
┌─────────────────────────────────────────────────────────────┐
│  🌸 오늘 배송 현황 (12/28)                    [지도보기]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  오전 (9-12시)                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✅ FLOWER-1228-001                                  │   │
│  │    김철수 (강남구) | 시그니처 M 화이트              │   │
│  │    "문 앞에 놓아주세요" | 비밀배송                  │   │
│  │    [배송완료] 10:32                                 │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 🚚 FLOWER-1228-002                                  │   │
│  │    이영희 (서초구) | 꽃바구니 L                     │   │
│  │    [배송중]                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  오후 (12-18시)                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🌸 FLOWER-1228-003  준비중                         │   │
│  │    박민수 (송파구) | 시그니처 S 핑크               │   │
│  │    리본: "사랑해"                                   │   │
│  │    [제작시작]                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  픽업                                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🏪 14:00 홍길동 | 시그니처 M                       │   │
│  │ 🏪 16:00 최수진 | 드라이플라워                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 주요 기능

- [x] 사이즈별 가격 설정
- [x] 색감(톤) 선택
- [x] 제외할 꽃 입력
- [x] 당일/익일/지정일 배송
- [x] 배송 시간대 선택
- [x] 비밀 배송 옵션
- [x] 리본 문구 & 카드 메시지
- [x] 배송 완료 사진 첨부
- [ ] 정기구독 (월/격주)
- [ ] 배송 지역별 추가비
- [ ] 화환 전용 모드 (조문/축하)

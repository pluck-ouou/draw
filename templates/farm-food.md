# Farm & Food Template - 농산물/식품

> 과일, 반찬, 밀키트 등 신선식품을 판매하는 1인 농장/식품점을 위한 자사몰

---

## 타겟 고객

- 과일 농장 직거래
- 수제 반찬 가게
- 밀키트 제조
- 수제 잼/소스
- 건강식품/차
- 지역 특산물
- CSA (정기배송 농산물)

---

## 핵심 기능

| 기능 | ON/OFF | 설명 |
|-----|--------|------|
| 상품 관리 | 기본 | 상품, 옵션, 가격 |
| 재고 관리 | ON | 한정 수량 |
| 배송 관리 | ON | 택배/새벽배송 |
| 정기배송 | ON | 구독 서비스 |
| 예약 주문 | ON | 제철 상품 예약 |

---

## 상품 구조

### 상품 유형
| 유형 | 코드 | 특징 |
|-----|-----|------|
| 일반상품 | normal | 상시 판매 |
| 제철상품 | seasonal | 특정 기간만 판매 |
| 예약상품 | preorder | 예약 주문 후 발송 |
| 정기배송 | subscription | 주기적 배송 |

### 배송 유형
| 유형 | 코드 | 설명 |
|-----|-----|------|
| 일반택배 | normal | 상온 배송 |
| 냉장택배 | cold | 아이스팩 |
| 냉동택배 | frozen | 냉동 배송 |
| 새벽배송 | dawn | 새벽 도착 |

---

## 데이터 구조

```typescript
interface FoodProduct {
  id: string;
  name: string;
  description: string;

  // 상품 유형
  product_type: 'normal' | 'seasonal' | 'preorder' | 'subscription';

  // 제철/예약 상품
  available_from?: Date;
  available_to?: Date;
  preorder_start?: Date;
  preorder_end?: Date;
  shipping_start?: Date;  // 발송 시작일

  // 가격
  price: number;
  sale_price?: number;

  // 옵션 (중량, 수량)
  options: {
    name: string;
    values: { label: string; price: number; stock?: number }[];
  }[];

  // 배송
  shipping_type: 'normal' | 'cold' | 'frozen';
  shipping_fee: number;
  free_shipping_threshold?: number;

  // 식품 정보
  origin: string;          // 원산지
  storage_method: string;  // 보관방법
  expiry_info: string;     // 유통기한
  allergens?: string[];    // 알러지 유발 성분

  // 재고
  stock_quantity: number;
  max_order_quantity?: number;  // 1인당 최대 구매

  // 정기배송
  subscription_options?: {
    interval: 'weekly' | 'biweekly' | 'monthly';
    discount_rate: number;
  }[];
}
```

---

## Supabase SQL

```sql
-- ============================================
-- 농산물/식품 전용 스키마
-- ============================================

-- 1. 스토어 설정
CREATE TABLE public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT NOT NULL,
  store_description TEXT,
  logo_url TEXT,
  banner_url TEXT,

  -- 연락처
  contact_phone TEXT,
  contact_email TEXT,
  contact_kakao TEXT,

  -- 사업자 정보
  business_name TEXT,
  business_number TEXT,
  business_address TEXT,

  -- 결제
  bank_name TEXT,
  bank_account TEXT,
  bank_holder TEXT,

  -- 배송
  default_shipping_fee INTEGER DEFAULT 3000,
  cold_shipping_fee INTEGER DEFAULT 5000,
  frozen_shipping_fee INTEGER DEFAULT 6000,
  free_shipping_threshold INTEGER DEFAULT 50000,

  -- 새벽배송 지역
  dawn_delivery_areas TEXT[] DEFAULT '{}',
  dawn_delivery_fee INTEGER DEFAULT 0,

  -- 공지
  shipping_notice TEXT,
  return_policy TEXT,

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
  subtitle TEXT,
  description TEXT,
  images TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,

  -- 상품 유형
  product_type TEXT DEFAULT 'normal'
    CHECK (product_type IN ('normal', 'seasonal', 'preorder', 'subscription')),

  -- 판매 기간 (제철/예약)
  available_from DATE,
  available_to DATE,
  preorder_start DATE,
  preorder_end DATE,
  shipping_start DATE,

  -- 가격
  price INTEGER NOT NULL,
  sale_price INTEGER,

  -- 옵션 (중량 등)
  options JSONB DEFAULT '[]',
  /*
  [
    { "name": "중량", "values": [
      { "label": "3kg", "price": 30000 },
      { "label": "5kg", "price": 45000 },
      { "label": "10kg", "price": 80000 }
    ]}
  ]
  */

  -- 배송
  shipping_type TEXT DEFAULT 'normal'
    CHECK (shipping_type IN ('normal', 'cold', 'frozen')),
  shipping_fee INTEGER,
  free_shipping_threshold INTEGER,
  can_bundle_shipping BOOLEAN DEFAULT true,  -- 합배송 가능

  -- 식품 정보
  origin TEXT,             -- 원산지
  storage_method TEXT,     -- 보관방법
  expiry_info TEXT,        -- 유통기한
  allergens TEXT[] DEFAULT '{}',

  -- 재고
  track_inventory BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_alert INTEGER DEFAULT 10,
  max_order_quantity INTEGER,

  -- 정기배송 옵션
  enable_subscription BOOLEAN DEFAULT false,
  subscription_options JSONB DEFAULT '[]',
  /*
  [
    { "interval": "weekly", "discount_rate": 10 },
    { "interval": "biweekly", "discount_rate": 5 },
    { "interval": "monthly", "discount_rate": 3 }
  ]
  */

  -- 상태
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 고객
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,

  -- 기본 배송지
  default_zipcode TEXT,
  default_address TEXT,
  default_address_detail TEXT,

  -- 추가 배송지
  saved_addresses JSONB DEFAULT '[]',

  total_orders INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 주문
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,

  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,

  -- 배송지
  recipient_name TEXT,
  recipient_phone TEXT,
  shipping_zipcode TEXT,
  shipping_address TEXT,
  shipping_address_detail TEXT,
  shipping_request TEXT,

  -- 선물 옵션
  is_gift BOOLEAN DEFAULT false,
  gift_message TEXT,

  -- 주문 상품
  items JSONB NOT NULL,
  /*
  [
    {
      "product_id": "uuid",
      "product_name": "사과",
      "option": "5kg",
      "quantity": 2,
      "unit_price": 45000,
      "subtotal": 90000,
      "shipping_type": "cold"
    }
  ]
  */

  -- 금액
  subtotal INTEGER NOT NULL,
  shipping_fee INTEGER DEFAULT 0,
  discount INTEGER DEFAULT 0,
  total_price INTEGER NOT NULL,

  -- 결제
  payment_method TEXT DEFAULT 'bank_transfer',
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_confirmed_at TIMESTAMPTZ,

  -- 주문 상태
  order_status TEXT DEFAULT 'pending'
    CHECK (order_status IN (
      'pending', 'confirmed', 'preparing', 'shipped',
      'delivered', 'cancelled', 'refund_requested', 'refunded'
    )),

  -- 배송
  tracking_company TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 정기배송 구독
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_number TEXT NOT NULL UNIQUE,

  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,

  -- 상품
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  option_selected TEXT,
  quantity INTEGER DEFAULT 1,

  -- 배송 주기
  interval TEXT NOT NULL CHECK (interval IN ('weekly', 'biweekly', 'monthly')),
  next_delivery_date DATE NOT NULL,

  -- 배송지
  shipping_zipcode TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_address_detail TEXT,

  -- 가격
  unit_price INTEGER NOT NULL,
  discount_rate INTEGER DEFAULT 0,
  final_price INTEGER NOT NULL,

  -- 상태
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'cancelled')),

  -- 히스토리
  total_deliveries INTEGER DEFAULT 0,
  last_delivery_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. 정기배송 이력
CREATE TABLE public.subscription_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id),
  order_id UUID REFERENCES public.orders(id),
  delivery_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. 관리자
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
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read" ON public.products FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone create" ON public.customers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone create" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone create" ON public.subscriptions FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admin full" ON public.store_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full" ON public.subscriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full" ON public.subscription_deliveries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subscriptions_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE today_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count FROM public.orders WHERE DATE(created_at) = CURRENT_DATE;
  NEW.order_number := 'FARM-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();

CREATE OR REPLACE FUNCTION generate_subscription_number()
RETURNS TRIGGER AS $$
DECLARE count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO count FROM public.subscriptions;
  NEW.subscription_number := 'SUB-' || LPAD(count::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_number BEFORE INSERT ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION generate_subscription_number();

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;

-- ============================================
-- 초기 데이터
-- ============================================
INSERT INTO public.store_settings (store_name, store_description, default_shipping_fee, cold_shipping_fee, free_shipping_threshold) VALUES
  ('행복한농장', '건강한 먹거리를 전합니다', 3000, 5000, 50000);

INSERT INTO public.categories (name, sort_order) VALUES
  ('과일', 1),
  ('채소', 2),
  ('반찬', 3),
  ('밀키트', 4),
  ('잼/소스', 5);

INSERT INTO public.products (name, subtitle, category_id, price, product_type, shipping_type, origin, storage_method, enable_subscription, subscription_options, options)
SELECT
  '제철 사과',
  '아삭하고 달콤한 청송 사과',
  id,
  45000,
  'seasonal',
  'cold',
  '경북 청송',
  '냉장 보관',
  true,
  '[{"interval": "weekly", "discount_rate": 10}, {"interval": "biweekly", "discount_rate": 5}]'::JSONB,
  '[{"name": "중량", "values": [{"label": "3kg (12-15과)", "price": 30000}, {"label": "5kg (20-25과)", "price": 45000}, {"label": "10kg (40-50과)", "price": 80000}]}]'::JSONB
FROM public.categories WHERE name = '과일';
```

---

## 상품 상세 페이지

```
┌─────────────────────────────────────────────────────────────┐
│  [이미지 갤러리]                                             │
│                                                              │
│  🍎 제철 사과                                               │
│  아삭하고 달콤한 청송 사과                                   │
│                                                              │
│  ⭐ 4.9 (리뷰 128개)                                        │
│                                                              │
│  ─────────────────────────────────────────                  │
│  원산지: 경북 청송                                           │
│  보관방법: 냉장 보관                                         │
│  배송: 🧊 냉장배송 | 5만원 이상 무료배송                     │
│  ─────────────────────────────────────────                  │
│                                                              │
│  중량 선택:                                                   │
│  ○ 3kg (12-15과) - 30,000원                                │
│  ● 5kg (20-25과) - 45,000원                                │
│  ○ 10kg (40-50과) - 80,000원                               │
│                                                              │
│  수량: [ - ] 1 [ + ]                                        │
│                                                              │
│  ─────────────────────────────────────────                  │
│                                                              │
│  🔄 정기배송 할인                                            │
│  ☐ 매주 배송 (10% 할인) - 40,500원                         │
│  ☐ 격주 배송 (5% 할인) - 42,750원                          │
│  ☐ 월 1회 배송 (3% 할인) - 43,650원                        │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              45,000원 구매하기                        │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              🛒 장바구니 담기                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 관리자 - 정기배송 관리

```
┌─────────────────────────────────────────────────────────────┐
│  🔄 정기배송 관리                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  이번 주 배송 예정 (12/30 ~ 01/05)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ SUB-000123  홍길동  사과 5kg  매주  12/30 배송       │   │
│  │ SUB-000089  김철수  반찬세트  격주  01/02 배송       │   │
│  │ SUB-000156  이영희  샐러드    매주  01/03 배송       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  전체 구독자 현황                                            │
│  ┌──────────┬──────────┬──────────┐                        │
│  │  활성     │  일시정지  │  해지     │                        │
│  │   45     │    8     │   12     │                        │
│  └──────────┴──────────┴──────────┘                        │
│                                                              │
│  [일괄 배송처리]  [송장 업로드]                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 예약 주문 (제철 상품)

```
┌─────────────────────────────────────────────────────────────┐
│  🍑 황도 복숭아 예약 주문                                   │
│                                                              │
│  📅 예약 기간: 6/1 ~ 6/30                                   │
│  📦 발송 예정: 7/15 ~ 7/25                                  │
│                                                              │
│  ※ 예약 주문 상품은 제철에 수확하여                         │
│    가장 맛있을 때 보내드립니다.                              │
│                                                              │
│  ─────────────────────────────────────────                  │
│                                                              │
│  현재 예약: 127/200 박스                                    │
│  ████████████████████░░░░░░  63%                           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              예약 주문하기                            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 주요 기능

- [x] 일반/제철/예약/정기배송 상품
- [x] 중량별 옵션 가격
- [x] 냉장/냉동 배송 구분
- [x] 정기배송 구독
- [x] 예약 주문 (제철 상품)
- [x] 선물하기 옵션
- [x] 원산지/보관방법 표시
- [ ] 새벽배송 지역 설정
- [ ] 합배송 처리
- [ ] 후기/별점
- [ ] 쿠폰/적립금

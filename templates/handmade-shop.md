# Handmade Shop Template - 수제품/핸드메이드

> 캔들, 비누, 악세서리, 인형 등 수제품을 판매하는 1인 공방을 위한 자사몰

---

## 타겟 고객

- 캔들/디퓨저 공방
- 수제비누 제작자
- 핸드메이드 악세서리
- 인형/뜨개질 작가
- 가죽공예 작가
- 도자기/세라믹 작가

---

## 핵심 기능

| 기능 | ON/OFF | 설명 |
|-----|--------|------|
| 상품 관리 | 기본 | 상품 등록, 옵션, 이미지 |
| 재고 관리 | ON | 수량 한정 상품 |
| 주문 관리 | 기본 | 주문 접수, 배송 |
| 주문제작 | ON | 커스텀 주문 |
| 예약 | OFF | 일반적으로 불필요 |

---

## 상품 구조

```typescript
interface HandmadeProduct {
  id: string;
  name: string;
  description: string;

  // 가격
  price: number;
  sale_price?: number;

  // 이미지
  images: string[];
  thumbnail: string;

  // 카테고리
  category_id: string;
  tags: string[];

  // 옵션 (향, 색상, 사이즈 등)
  options: ProductOption[];

  // 재고
  track_inventory: boolean;
  stock_quantity: number;
  low_stock_alert: number;

  // 주문제작
  is_custom_order: boolean;
  production_days: number;     // 제작 소요일

  // 상태
  status: 'active' | 'soldout' | 'hidden';

  // 메타
  created_at: Date;
  updated_at: Date;
}

interface ProductOption {
  name: string;           // 향, 색상, 사이즈
  type: 'select' | 'text' | 'color';
  required: boolean;
  values: OptionValue[];
}

interface OptionValue {
  label: string;          // 라벤더, 화이트, M
  extra_price: number;    // 추가금
  stock?: number;         // 옵션별 재고
}
```

---

## 예시: 캔들샵

### 상품 예시
```yaml
products:
  - name: "라벤더 소이캔들"
    price: 18000
    category: 소이캔들
    options:
      - name: 사이즈
        values:
          - { label: "S (80g)", extra_price: 0 }
          - { label: "M (150g)", extra_price: 5000 }
          - { label: "L (250g)", extra_price: 12000 }
      - name: 심지
        values:
          - { label: "우드심지", extra_price: 2000 }
          - { label: "면심지", extra_price: 0 }
    stock_quantity: 20

  - name: "시그니처 디퓨저"
    price: 25000
    category: 디퓨저
    options:
      - name: 향
        values:
          - { label: "화이트머스크", extra_price: 0 }
          - { label: "피오니", extra_price: 0 }
          - { label: "우디앰버", extra_price: 3000 }
      - name: 용량
        values:
          - { label: "100ml", extra_price: 0 }
          - { label: "200ml", extra_price: 10000 }
    stock_quantity: 15

  - name: "웨딩 캔들 세트 (주문제작)"
    price: 80000
    is_custom_order: true
    production_days: 7
    options:
      - name: 각인 문구
        type: text
        required: true
      - name: 베이스 향
        values:
          - { label: "로즈", extra_price: 0 }
          - { label: "자스민", extra_price: 0 }
```

---

## Supabase SQL

```sql
-- ============================================
-- 수제품샵 전용 스키마
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
  instagram_url TEXT,

  -- 결제
  bank_name TEXT,
  bank_account TEXT,
  bank_holder TEXT,

  -- 배송
  shipping_fee INTEGER DEFAULT 3000,
  free_shipping_threshold INTEGER DEFAULT 50000,
  shipping_notice TEXT,  -- 배송 안내 문구

  -- 제작/배송 기간
  default_production_days INTEGER DEFAULT 3,

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
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 상품
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id),

  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  sale_price INTEGER,

  images TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,

  -- 옵션 (JSON 배열)
  options JSONB DEFAULT '[]',

  -- 재고
  track_inventory BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_alert INTEGER DEFAULT 5,

  -- 주문제작
  is_custom_order BOOLEAN DEFAULT false,
  production_days INTEGER,
  custom_order_notice TEXT,  -- 주문제작 안내

  -- 상태
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'soldout', 'hidden')),

  -- 메타
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 고객
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,

  -- 배송지
  address_zipcode TEXT,
  address_main TEXT,
  address_detail TEXT,

  -- 통계
  total_orders INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  last_order_at TIMESTAMPTZ,

  notes TEXT,
  marketing_agreed BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(phone)
);

-- 5. 주문
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,

  -- 고객
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,

  -- 배송지
  shipping_zipcode TEXT,
  shipping_address TEXT,
  shipping_address_detail TEXT,
  shipping_request TEXT,  -- 배송 요청사항

  -- 주문 상품
  items JSONB NOT NULL,
  /*
  items: [
    {
      product_id: "uuid",
      product_name: "라벤더 소이캔들",
      options: { 사이즈: "M (150g)", 심지: "우드심지" },
      quantity: 2,
      unit_price: 25000,
      subtotal: 50000
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
    CHECK (order_status IN ('pending', 'confirmed', 'producing', 'ready', 'shipped', 'delivered', 'cancelled')),

  -- 배송
  tracking_company TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- 제작 (주문제작 상품)
  production_start_at TIMESTAMPTZ,
  estimated_completion DATE,

  -- 메모
  customer_note TEXT,
  admin_note TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 재고 로그
CREATE TABLE public.inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id),
  change_type TEXT CHECK (change_type IN ('in', 'out', 'adjust')),
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reason TEXT,  -- 주문, 입고, 수동조정, 폐기
  order_id UUID,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. 관리자
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
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- 공개 조회
CREATE POLICY "Public read settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (status = 'active');

-- 주문 생성
CREATE POLICY "Anyone can create order" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can create customer" ON public.customers FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 관리자 전체 권한
CREATE POLICY "Admin full" ON public.store_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full categories" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full customers" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full orders" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full inventory" ON public.inventory_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 주문번호 생성
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE today_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count FROM public.orders WHERE DATE(created_at) = CURRENT_DATE;
  NEW.order_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- 재고 차감
CREATE OR REPLACE FUNCTION deduct_inventory()
RETURNS TRIGGER AS $$
DECLARE item JSONB;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    UPDATE public.products
    SET stock_quantity = stock_quantity - (item->>'quantity')::INTEGER
    WHERE id = (item->>'product_id')::UUID AND track_inventory = true;

    INSERT INTO public.inventory_logs (product_id, change_type, quantity_change, quantity_after, reason, order_id)
    SELECT (item->>'product_id')::UUID, 'out', -(item->>'quantity')::INTEGER, stock_quantity, '주문', NEW.id
    FROM public.products WHERE id = (item->>'product_id')::UUID AND track_inventory = true;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_deduct_inventory AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION deduct_inventory();

-- 고객 통계 업데이트
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.customers
  SET total_orders = total_orders + 1,
      total_spent = total_spent + NEW.total_price,
      last_order_at = NEW.created_at
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_update_customer AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION update_customer_stats();

-- 실시간
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ============================================
-- 초기 데이터
-- ============================================
INSERT INTO public.store_settings (store_name, store_description, shipping_fee, free_shipping_threshold) VALUES
  ('아로마공방', '수제 캔들 & 디퓨저 전문', 3000, 50000);

INSERT INTO public.categories (name, sort_order) VALUES
  ('소이캔들', 1),
  ('필라캔들', 2),
  ('디퓨저', 3),
  ('왁스타블렛', 4),
  ('선물세트', 5);
```

---

## 주문 상태 플로우

```
pending (주문접수)
    ↓ 입금 확인
confirmed (주문확정)
    ↓ 제작 시작 (주문제작 상품)
producing (제작중)
    ↓ 제작 완료
ready (배송준비)
    ↓ 송장 등록
shipped (배송중)
    ↓ 배송 완료
delivered (배송완료)

※ 어느 단계에서든 → cancelled (취소) 가능
```

---

## 관리자 화면

### 재고 현황

```
┌─────────────────────────────────────────────────────────────┐
│  📦 재고 현황                                    [입고 등록] │
├─────────────────────────────────────────────────────────────┤
│  ⚠️ 재고 부족 알림                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔴 라벤더 소이캔들 M  재고: 3개 (알림: 5개)         │   │
│  │ 🟡 피오니 디퓨저 100ml  재고: 5개 (알림: 5개)       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  전체 상품                                        [검색]     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 상품명                    │ 재고 │ 상태   │ 조정      │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ 라벤더 소이캔들 S         │  12  │ 판매중 │ [+] [-]  │ │
│  │ 라벤더 소이캔들 M         │   3  │ 부족   │ [+] [-]  │ │
│  │ 라벤더 소이캔들 L         │   8  │ 판매중 │ [+] [-]  │ │
│  │ 시그니처 디퓨저 100ml    │   5  │ 부족   │ [+] [-]  │ │
│  │ 웨딩 캔들 세트 (주문제작) │   -  │ 주문제작│    -     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 주요 기능

- [x] 상품 옵션 (향, 사이즈, 색상) 설정
- [x] 옵션별 추가금 설정
- [x] 재고 관리 & 부족 알림
- [x] 주문제작 상품 (제작 소요일)
- [x] 무료배송 기준 설정
- [x] 주문 상태 관리
- [x] 송장번호 등록
- [ ] 쿠폰/할인코드
- [ ] 리뷰 시스템
- [ ] 위시리스트

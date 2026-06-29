# Pet Shop Template - 반려동물 용품/간식

> 수제 반려동물 간식, 용품을 판매하거나 미용 예약을 받는 1인 펫샵을 위한 자사몰

---

## 타겟 고객

- 수제 펫 간식 판매
- 펫 의류/악세서리
- 펫 미용실
- 펫 호텔/돌봄
- 펫 포토샵
- 펫 장례 서비스

---

## 핵심 기능

| 기능 | ON/OFF | 업종 |
|-----|--------|------|
| 상품 관리 | ON | 간식/용품 |
| 재고 관리 | ON | 간식/용품 |
| 예약 관리 | ON | 미용/호텔 |
| 배송 관리 | ON | 간식/용품 |
| 반려동물 프로필 | ON | 전체 |

---

## 데이터 구조

### 반려동물 프로필
```typescript
interface Pet {
  id: string;
  owner_id: string;

  name: string;
  species: 'dog' | 'cat' | 'etc';
  breed: string;           // 품종
  birth_date?: Date;
  gender: 'male' | 'female';
  neutered: boolean;       // 중성화 여부
  weight?: number;         // kg

  // 건강 정보
  allergies?: string[];    // 알러지
  health_notes?: string;   // 건강 특이사항

  // 성격/주의사항
  temperament?: string;    // 온순함, 활발함 등
  caution_notes?: string;  // 주의사항

  photo_url?: string;
}
```

### 상품 (간식/용품)
```typescript
interface PetProduct {
  id: string;
  name: string;
  category: string;

  // 대상
  target_species: ('dog' | 'cat' | 'all')[];
  target_size?: ('small' | 'medium' | 'large')[];  // 소형견/중형견/대형견

  // 간식 정보
  ingredients?: string[];  // 원재료
  calorie?: number;        // 칼로리
  weight_g?: number;       // 중량

  price: number;
  stock: number;
}
```

### 미용 예약
```typescript
interface GroomingReservation {
  id: string;
  pet_id: string;

  // 미용 서비스
  service_type: string;    // 목욕, 전체미용, 부분미용
  additional_services: string[];  // 발톱, 귀청소, 항문낭 등

  reservation_date: Date;
  reservation_time: string;

  // 특이사항
  special_notes?: string;

  price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}
```

---

## Supabase SQL

```sql
-- ============================================
-- 펫샵 전용 스키마
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

  -- 위치 (미용실인 경우)
  store_address TEXT,
  store_hours TEXT,

  -- 결제
  bank_name TEXT,
  bank_account TEXT,
  bank_holder TEXT,

  -- 배송 (상품 판매 시)
  shipping_fee INTEGER DEFAULT 3000,
  free_shipping_threshold INTEGER DEFAULT 30000,

  -- 기능 ON/OFF
  enable_products BOOLEAN DEFAULT true,
  enable_grooming BOOLEAN DEFAULT false,
  enable_hotel BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 고객 (보호자)
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  address TEXT,

  total_orders INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 반려동물
CREATE TABLE public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('dog', 'cat', 'etc')),
  breed TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  neutered BOOLEAN DEFAULT false,
  weight DECIMAL(4,1),

  -- 건강
  allergies TEXT[] DEFAULT '{}',
  health_notes TEXT,

  -- 성격
  temperament TEXT,
  caution_notes TEXT,

  photo_url TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 상품 카테고리
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_species TEXT[] DEFAULT '{"dog", "cat"}',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- 5. 상품
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id),

  name TEXT NOT NULL,
  description TEXT,
  images TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,

  -- 대상
  target_species TEXT[] DEFAULT '{"dog", "cat"}',
  target_size TEXT[] DEFAULT '{}',  -- small, medium, large

  -- 간식 정보
  ingredients TEXT[] DEFAULT '{}',
  calorie INTEGER,
  weight_g INTEGER,
  storage_method TEXT,     -- 보관방법
  expiry_info TEXT,        -- 유통기한 정보

  -- 가격/재고
  price INTEGER NOT NULL,
  sale_price INTEGER,
  stock_quantity INTEGER DEFAULT 0,
  track_inventory BOOLEAN DEFAULT true,

  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 미용 서비스
CREATE TABLE public.grooming_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,

  -- 대상
  target_species TEXT DEFAULT 'dog',
  target_sizes TEXT[] DEFAULT '{"small", "medium", "large"}',

  -- 가격 (사이즈별)
  price_small INTEGER,
  price_medium INTEGER,
  price_large INTEGER,

  duration INTEGER,  -- 예상 소요시간 (분)

  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- 7. 미용 예약
CREATE TABLE public.grooming_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_number TEXT NOT NULL UNIQUE,

  -- 고객/반려동물
  customer_id UUID REFERENCES public.customers(id),
  pet_id UUID REFERENCES public.pets(id),

  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  pet_name TEXT NOT NULL,
  pet_species TEXT NOT NULL,
  pet_breed TEXT,
  pet_weight DECIMAL(4,1),

  -- 서비스
  service_id UUID REFERENCES public.grooming_services(id),
  service_name TEXT NOT NULL,
  additional_services TEXT[] DEFAULT '{}',  -- 발톱, 귀청소 등

  -- 예약
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  duration INTEGER,

  -- 금액
  price INTEGER NOT NULL,
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'refunded')),

  -- 상태
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),

  -- 메모
  special_notes TEXT,
  grooming_notes TEXT,  -- 미용 후 메모
  before_photo_url TEXT,
  after_photo_url TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. 상품 주문
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,

  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,

  -- 배송지
  shipping_address TEXT,
  shipping_request TEXT,

  -- 주문 상품
  items JSONB NOT NULL,

  -- 금액
  subtotal INTEGER NOT NULL,
  shipping_fee INTEGER DEFAULT 0,
  total_price INTEGER NOT NULL,

  payment_status TEXT DEFAULT 'pending',
  order_status TEXT DEFAULT 'pending',

  tracking_number TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. 관리자
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
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grooming_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grooming_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Public read" ON public.grooming_services FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone create" ON public.customers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone create" ON public.pets FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone create" ON public.grooming_reservations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone create" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admin full" ON public.store_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full" ON public.pets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full" ON public.grooming_services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full" ON public.grooming_reservations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER grooming_updated BEFORE UPDATE ON public.grooming_reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION generate_reservation_number()
RETURNS TRIGGER AS $$
DECLARE today_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count FROM public.grooming_reservations WHERE DATE(created_at) = CURRENT_DATE;
  NEW.reservation_number := 'GROOM-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER grooming_number BEFORE INSERT ON public.grooming_reservations FOR EACH ROW EXECUTE FUNCTION generate_reservation_number();

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE today_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count FROM public.orders WHERE DATE(created_at) = CURRENT_DATE;
  NEW.order_number := 'PET-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();

ALTER PUBLICATION supabase_realtime ADD TABLE public.grooming_reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ============================================
-- 초기 데이터
-- ============================================
INSERT INTO public.store_settings (store_name, store_description, enable_products, enable_grooming) VALUES
  ('해피펫', '수제 반려동물 간식 & 미용', true, true);

INSERT INTO public.categories (name, target_species, sort_order) VALUES
  ('수제간식', '{"dog", "cat"}', 1),
  ('건조간식', '{"dog", "cat"}', 2),
  ('의류', '{"dog"}', 3),
  ('장난감', '{"dog", "cat"}', 4);

INSERT INTO public.grooming_services (name, description, target_species, price_small, price_medium, price_large, duration) VALUES
  ('기본 목욕', '샴푸 + 드라이 + 귀청소 + 발톱정리', 'dog', 30000, 40000, 50000, 60),
  ('전체 미용', '목욕 + 전체 커트', 'dog', 50000, 70000, 90000, 120),
  ('위생 미용', '발바닥, 항문, 눈가 정리', 'dog', 20000, 25000, 30000, 30),
  ('스파 패키지', '목욕 + 아로마 마사지 + 팩', 'dog', 60000, 80000, 100000, 90);
```

---

## 미용 예약 페이지

```
┌─────────────────────────────────────────────────────────────┐
│  🐕 미용 예약                                                │
│                                                              │
│  Step 1: 반려동물 정보                                       │
│  ─────────────────────────────────────────                  │
│  이름: [뽀삐                      ]                          │
│  종류: ● 강아지  ○ 고양이  ○ 기타                          │
│  품종: [말티즈                    ]                          │
│  몸무게: [3.5] kg                                            │
│  성별: ○ 남아  ● 여아    중성화: ● 예  ○ 아니오            │
│                                                              │
│  알러지/주의사항:                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 낯선 사람에게 짖음, 목욕 시 물 무서워함              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 2: 서비스 선택                                         │
│  ─────────────────────────────────────────                  │
│                                                              │
│  ● 기본 목욕 - 30,000원 (소형견 기준)                        │
│    샴푸 + 드라이 + 귀청소 + 발톱정리 | 약 1시간              │
│                                                              │
│  ○ 전체 미용 - 50,000원                                     │
│    목욕 + 전체 커트 | 약 2시간                               │
│                                                              │
│  ○ 스파 패키지 - 60,000원                                   │
│    목욕 + 아로마 마사지 + 팩 | 약 1.5시간                   │
│                                                              │
│  추가 서비스:                                                 │
│  ☐ 발톱 컬러링 (+5,000)                                     │
│  ☑ 치석 제거 (+10,000)                                      │
│  ☐ 모근 영양팩 (+15,000)                                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 3: 예약 일시                                           │
│  ─────────────────────────────────────────                  │
│                                                              │
│  📅 12월 28일 (토)                                          │
│                                                              │
│  ○ 10:00  ● 11:00  ○ 14:00  ○ 15:00  ○ 16:00             │
│                                                              │
│  ※ 회색은 예약 마감                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 관리자 - 미용 before/after

```
┌─────────────────────────────────────────────────────────────┐
│  🐕 GROOM-1228-001 | 뽀삐 (말티즈, 3.5kg)                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  보호자: 홍길동 | 010-1234-5678                             │
│  서비스: 전체 미용 + 치석제거                                │
│  금액: 60,000원 (입금완료)                                   │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │                 │  │                 │                  │
│  │    Before       │  │    After        │                  │
│  │   [사진 업로드]  │  │   [사진 업로드]  │                  │
│  │                 │  │                 │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                              │
│  미용 메모:                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 털이 많이 엉켜있어서 짧게 정리함                      │   │
│  │ 귀 안쪽 빨갛게 염증 있음 - 보호자에게 안내            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [미용 완료] [보호자에게 알림]                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 주요 기능

- [x] 반려동물 프로필 관리
- [x] 종/품종/사이즈별 가격
- [x] 알러지/주의사항 기록
- [x] 미용 예약 관리
- [x] Before/After 사진
- [x] 상품 판매 (간식, 용품)
- [x] 재고 관리
- [ ] 정기 미용 예약
- [ ] 미용 이력 관리
- [ ] 펫 호텔/돌봄 예약

-- 008_product_availability.up.sql
-- WOLYA ARCHIVE 스키마 8단계 — 매입 상태(보유/예약주문) + 원본 매물 추적
--
-- 왜: 온라인 소싱 29건이 들어오면서 `Product` 타입에 세 필드가 생겼다.
--     DB 에 자리가 없으면 A1(화면→DB 교체) 에서 전부 잘못된 값으로 표시된다.
--
--       status    → availability  (available: 이미 매입해 보유 / preorder: 사입 확인 전 예약주문)
--       sourceUrl → source_url    (원본 매물 링크. 생존 체크용)
--       note      → note          (판매자 고지. 하자·가격 변동 등)
--       kind      → kind          (코디 교차 슬라이드의 윗줄/아랫줄. category 와 다른 축)
--       shortMeasure → short_measure (카드에 한 줄로 노출하는 짧은 실측)
--
--     ⚠️ 이름 주의: `products.status` 는 **이미 다른 뜻으로 쓰이고 있다**
--        (draft / published / hidden / sold_out = 화면 노출 상태).
--        매입 상태는 완전히 별개의 축이므로 `availability` 라는 다른 이름을 쓴다.
--        둘을 섞으면 "예약주문이라 안 보임" 같은 사고가 난다.
--
-- 적용:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/008_product_availability.up.sql
-- 되돌리기: db/migrations/008_product_availability.down.sql
--
-- 안전성
--  - 전부 ADD COLUMN. 기존 행·기존 쿼리에 영향 없음
--  - availability 는 NOT NULL DEFAULT 'available' — PG 11+ 는 테이블 재작성 없이 즉시 끝난다.
--    기존 3건은 실제로 매입해서 보유 중인 물건이므로 'available' 이 맞는 값이다.
--  - 기존 컬럼에 대한 DROP / DELETE / SET NOT NULL 없음 → 추가형 마이그레이션
--  - IF NOT EXISTS 로 재실행 안전(멱등)

BEGIN;

-- ── 매입 상태 ───────────────────────────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS availability VARCHAR(20) NOT NULL DEFAULT 'available';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_availability_check'
      AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_availability_check
      CHECK (availability IN ('available', 'preorder'));
  END IF;
END $$;

COMMENT ON COLUMN products.availability IS
  'available: 이미 매입해 보유 중 / preorder: 사입 확인 전 예약주문. products.status(노출 상태)와 다른 축이다';

-- ── 원본 매물 추적 ──────────────────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS note       TEXT;

COMMENT ON COLUMN products.source_url IS
  '원본 매물 링크. 팔린 매물을 사이트에서 내리는 생존 체크에 쓴다. 기존 3건은 수집 당시 기록이 없어 비어 있다';
COMMENT ON COLUMN products.note IS
  '판매자 고지(하자·할인가 변동 등). 있으면 상세페이지 하단에 노출';

-- ── 코디 슬라이드 · 카드 표기 ───────────────────────────────────
-- kind 는 "입는 위치"다. 가방·신발처럼 상·하의가 아닌 품목은 NULL 이고
-- 코디 교차 슬라이드에서 제외된다. 필터용 category 와는 축이 다르므로 컬럼도 따로 둔다.
ALTER TABLE products ADD COLUMN IF NOT EXISTS kind          VARCHAR(10);
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_measure TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_kind_check' AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_kind_check CHECK (kind IS NULL OR kind IN ('top', 'bottom'));
  END IF;
END $$;

COMMENT ON COLUMN products.kind IS
  '코디 교차 슬라이드의 윗줄(top)/아랫줄(bottom). 가방·신발 등은 NULL. 필터용 category 와 다른 축이다';
COMMENT ON COLUMN products.short_measure IS
  '상품 카드에 한 줄로 노출하는 짧은 실측. 상세 실측은 measurements';

-- 예약주문 건을 빠르게 뽑기 위한 부분 인덱스. 29건이 전부 여기 걸린다.
CREATE INDEX IF NOT EXISTS products_preorder_idx
  ON products (availability)
  WHERE availability = 'preorder' AND deleted_at IS NULL;

COMMIT;

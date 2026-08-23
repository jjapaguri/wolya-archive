-- 006_product_presentation.up.sql
-- WOLYA ARCHIVE 스키마 6단계 — 상품 상세 표현 필드
--
-- 왜: `src/data/products.ts` 의 `Product` 타입이 DB 에 자리가 없는 필드를 갖고 있다.
--     조회 계층(`src/lib/products.ts`)이 **기존 타입과 똑같은 모양**을 반환해야
--     화면 코드를 건드리지 않고 A1(정적 import → 쿼리 교체)을 할 수 있다.
--     그래서 부족한 필드를 products 에 nullable 컬럼으로 더한다.
--
-- 적용:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/006_product_presentation.up.sql
-- 되돌리기: db/migrations/006_product_presentation.down.sql
--
-- 안전성
--  - 전부 ADD COLUMN (nullable). 기존 행·기존 쿼리에 영향 없음
--  - DROP / DELETE / SET NOT NULL 없음 → 무인 자동화가 흘려도 되는 추가형 마이그레이션
--  - IF NOT EXISTS 로 재실행 안전(멱등)

BEGIN;

-- ── 상세 표현 필드 ──────────────────────────────────────────────
-- 화면에 그대로 노출되는 서술 필드들. 길이 제한을 두지 않는 곳은 TEXT.
ALTER TABLE products ADD COLUMN IF NOT EXISTS tag_label      VARCHAR(40);
ALTER TABLE products ADD COLUMN IF NOT EXISTS condition_note TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS hook           TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS fabric         TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS fit            TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS measurements   TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_note     VARCHAR(80);
ALTER TABLE products ADD COLUMN IF NOT EXISTS recommended_for TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS hashtags       TEXT;

COMMENT ON COLUMN products.tag_label       IS '화면 표시용 아카이브 번호. 예: ARCHIVE 001';
COMMENT ON COLUMN products.condition_note  IS '상태 서술문(자유 텍스트). 등급값은 products.condition 이 따로 갖는다';
COMMENT ON COLUMN products.stock_note      IS '재고 문구. 예: 1점 한정. 실제 수량은 product_variants.stock_quantity';
COMMENT ON COLUMN products.hashtags        IS '검색·분위기 표현용 해시태그 문자열. 분류가 아니다(분류는 category_id)';

-- ── 매입 원가 ───────────────────────────────────────────────────
-- 내부 검산용. 화면에 절대 노출하지 않는다(조회 계층에서 SELECT 하지 않는 것이 원칙이나,
-- 어드민(B단계)이 쓰므로 컬럼 자체는 여기 둔다).
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_price INTEGER;

COMMENT ON COLUMN products.source_price IS '매입가(원). 내부 검산 전용 — 고객 화면 비노출';

-- 금액은 음수가 될 수 없다. 이미 붙어 있으면 건너뛴다(재실행 안전).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_source_price_check'
      AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_source_price_check CHECK (source_price >= 0);
  END IF;
END $$;

COMMIT;

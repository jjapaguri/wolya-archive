-- 008_product_listing_state.up.sql
-- WOLYA ARCHIVE 스키마 8단계 — 노출 상태·카드 표기 필드
--
-- 왜: 006 이 `Product` 타입의 서술 필드를 채웠지만 **세 개가 아직 비어 있다.**
--     그대로 A1 을 하면 화면이 조용히 틀린 값을 보여준다:
--
--       1. status  — `src/lib/product-queries.ts` 의 mapRow 가 `"available"` 로 **고정**해 둔 값이다.
--                    실제 원장(`src/data/products.ts`) 37건은 available 3 / sold 7 / preorder 27 이다.
--                    고치지 않고 붙이면 **판매완료 7건이 구매 가능으로, 예약주문 27건이 보유 재고로**
--                    보인다. AGENTS.md 최상단("품절 반영 속도와 재고 정확도가 먼저다")을 정면으로 어긴다.
--       2. shortMeasure — 카드 한 줄용 짧은 실측. 없어서 mapRow 가 긴 `measurements` 를 대신 넣고 있다.
--                    37건 전부 두 값이 다르다 → 홈 코디 슬라이드 카드가 전부 긴 문장으로 잘린다.
--       3. note    — 판매자 고지(하자·라벨 미확인 등). 37건 중 19건에 있는데 DB 에 자리가 없어 사라진다.
--
--     sold 는 새 컬럼을 만들지 않는다. `products.status='sold_out'`(001 의 CHECK 에 이미 있다)과
--     `product_variants.stock_quantity`(재고의 실체)로 표현한다 — AGENTS.md 불변규칙 3의 조건부
--     UPDATE 가 재고를 0으로 만들면 그것이 곧 품절이어야 하기 때문이다.
--     예약주문만 재고로 표현할 수 없어(사입 전이라 물건이 없다) 불리언 하나를 더한다.
--
-- 적용:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/008_product_listing_state.up.sql
-- 되돌리기: db/migrations/008_product_listing_state.down.sql
--
-- 전제: 006_product_presentation.up.sql 이 먼저 적용돼 있어야 한다.
--
-- 안전성
--  - 전부 ADD COLUMN. DROP / DELETE / TRUNCATE 없음
--  - is_preorder 만 NOT NULL 이지만 DEFAULT FALSE 가 붙어 있어 기존 행이 즉시 채워진다
--    (PG 11+ 는 이 형태를 테이블 재작성 없이 처리한다)
--  - IF NOT EXISTS 로 재실행 안전(멱등)

BEGIN;

-- ── 카드 한 줄 실측 ─────────────────────────────────────────────
-- 상세 실측은 006 의 measurements. 이건 카드에 한 줄로 그리는 요약이다.
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_measure VARCHAR(120);

COMMENT ON COLUMN products.short_measure IS
  '카드 한 줄용 짧은 실측. 예: 어깨 55 · 가슴 68.5 · 총장 73. 상세 실측은 measurements';

-- ── 판매자 고지 ─────────────────────────────────────────────────
-- 상세페이지 하단에 "판매자 고지" 로 노출된다. 하자·라벨 미확인 등 고객이 알아야 할 사실.
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_note TEXT;

COMMENT ON COLUMN products.seller_note IS
  '판매자 고지(하자·라벨 미확인 등). 상세페이지 하단 노출. 내부 메모가 아니라 고객이 읽는 문장이다';

-- ── 예약주문 여부 ───────────────────────────────────────────────
-- 사입 확인 전 예약주문. 물건이 아직 없으므로 stock_quantity 로는 표현할 수 없다.
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN products.is_preorder IS
  '사입 확인 전 예약주문이면 TRUE. 품절(sold)은 이 컬럼이 아니라 status=''sold_out'' / stock_quantity=0 이 표현한다';

COMMIT;

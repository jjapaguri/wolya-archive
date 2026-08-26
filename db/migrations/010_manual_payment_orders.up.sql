-- 010_manual_payment_orders.up.sql
-- WOLYA ARCHIVE 스키마 10단계 — 무통장 입금 주문 플로우가 필요로 하는 필드
--
-- 왜: 003(주문) · 004(결제) 테이블은 이미 있고 데이터만 0행이다. 비회원 무통장 주문을
--     실제로 받으려면 세 가지가 더 필요하다. 전부 기존 테이블에 컬럼을 더하는 것뿐이다.
--
--   1. order_items.is_preorder — **재고를 안 깎은 줄을 표시한다.**
--      지금 카탈로그는 무재고(선주문 후 사입)라 예약주문 상품의 stock_quantity 가 0이다.
--      그래서 예약주문 항목은 불변규칙 3의 조건부 UPDATE 를 태우지 않는다(태우면 전부 품절이 된다).
--      "이 줄은 재고 차감을 건너뛰었다" 는 사실이 주문서에 남아 있어야 운영이 사입 대상을 고른다.
--      products.is_preorder 를 조인해서 보면 안 된다 — 주문서는 스냅샷이고(불변규칙 4),
--      order_items.product_id 는 상품이 지워지면 NULL 이 된다.
--
--   2. orders.terms_agreed_at / privacy_agreed_at — **동의는 boolean 이 아니라 시각이다**(불변규칙 7).
--      002 의 users 가 같은 규칙을 쓰고 있는데, 비회원 주문에는 users 행 자체가 없어
--      동의 증빙을 남길 자리가 없었다. 분쟁 시 "언제 동의했는지" 가 증빙이다.
--
--   3. payments.deposit_name / deposit_due_at — 무통장 입금(pg_provider='manual') 운영에 필요한 두 값.
--      입금자명이 주문자명과 다른 경우가 대부분이라 대사(對査)가 이 컬럼 없이는 사람 눈으로만 된다.
--      raw_response JSONB 에 넣지 않는 이유: 그 컬럼은 PG 응답 원본 자리이고(004 주석),
--      운영이 "입금 기한 지난 미입금 주문" 을 매일 조회해야 하므로 인덱스 가능한 컬럼이어야 한다.
--
-- 적용:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/010_manual_payment_orders.up.sql
-- 확인:  psql "$DATABASE_URL" -f db/migrations/010_manual_payment_orders.verify.sql
-- 되돌리기: db/migrations/010_manual_payment_orders.down.sql
--
-- 전제: 004_payments.up.sql 까지 적용돼 있어야 한다.
--
-- 안전성
--  - 전부 ADD COLUMN / CREATE INDEX IF NOT EXISTS. DROP / DELETE / TRUNCATE 없음
--  - is_preorder 만 NOT NULL 이지만 DEFAULT FALSE 라 기존 행이 즉시 채워진다
--    (PG 11+ 는 테이블 재작성 없이 처리한다). 지금 order_items 는 0행이라 어차피 즉시 끝난다
--  - IF NOT EXISTS 로 재실행 안전(멱등)

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.payments') IS NULL OR to_regclass('public.order_items') IS NULL THEN
    RAISE EXCEPTION '003_orders 와 004_payments 를 먼저 적용해야 합니다';
  END IF;
END;
$$;

-- ── 1. 주문 항목 — 예약주문 스냅샷 ──────────────────────────────
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN order_items.is_preorder IS
  '주문 시점 스냅샷. TRUE = 사입 전 예약주문이라 재고 차감(조건부 UPDATE)을 건너뛴 줄. '
  'products.is_preorder 를 조인해 보지 말 것 — 주문서는 스냅샷이고 product_id 는 NULL 이 될 수 있다.';

-- 같은 예약주문 상품을 두 사람이 동시에 예약하는 것을 앱이 막는다(단벌이라 하나만 사입된다).
-- 그 확인 질의가 매번 풀스캔하지 않도록 부분 인덱스를 둔다.
CREATE INDEX IF NOT EXISTS idx_order_items_preorder_variant
  ON order_items(variant_id) WHERE is_preorder;

-- ── 2. 비회원 주문의 동의 시각 ──────────────────────────────────
-- boolean 으로 바꾸지 말 것. 언제 동의했는지가 증빙이다 (AGENTS.md 불변규칙 7).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS terms_agreed_at   TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS privacy_agreed_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.terms_agreed_at IS
  '주문서에서 이용약관에 동의한 시각. 앱이 주문 생성 시 now() 로 채운다. NULL = 이 컬럼이 생기기 전 주문.';
COMMENT ON COLUMN orders.privacy_agreed_at IS
  '주문서에서 개인정보 수집·이용에 동의한 시각. 필수 동의라 앱은 이 값 없이 주문을 만들지 않는다.';

-- ── 3. 무통장 입금 운영 필드 ────────────────────────────────────
ALTER TABLE payments ADD COLUMN IF NOT EXISTS deposit_name   VARCHAR(60);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS deposit_due_at TIMESTAMPTZ;

COMMENT ON COLUMN payments.deposit_name IS
  '무통장 입금자명(pg_provider=''manual''). 주문자명과 다른 경우가 많아 입금 대사에 필요하다.';
COMMENT ON COLUMN payments.deposit_due_at IS
  '입금 기한. 지나도 미입금이면 운영이 주문을 취소하고 예약주문 자리를 푼다.';

-- 운영이 매일 보는 질의: "입금 기한이 지난 ready 상태 결제"
CREATE INDEX IF NOT EXISTS idx_payments_deposit_due
  ON payments(deposit_due_at) WHERE status = 'ready';

COMMIT;

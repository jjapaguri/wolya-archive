-- 010_manual_payment_orders.down.sql
-- 되돌리기 — 010 이 더한 컬럼 5개와 인덱스 2개를 뗀다.
--
-- ⚠️ 이건 파괴적이다. 동의 시각·입금자명·예약주문 표시가 같이 사라진다.
--    동의 시각은 분쟁 시 증빙이므로 실제 주문이 쌓인 뒤에는 사실상 되돌릴 수 없다.
--    되돌리기 전에 백업할 것: ~/app/scripts/pg_backup.sh
--    AGENTS.md 4절에 따라 운영 DB 에서는 **사람 승인 없이 실행 금지.**
--
-- 앱이 이 컬럼들을 이미 읽고 있으면 먼저 앱을 되돌린 뒤 이걸 돌린다.
-- 순서를 뒤집으면 주문 조회가 "column does not exist" 로 죽는다.

BEGIN;

DROP INDEX IF EXISTS idx_payments_deposit_due;
DROP INDEX IF EXISTS idx_order_items_preorder_variant;

ALTER TABLE payments    DROP COLUMN IF EXISTS deposit_due_at;
ALTER TABLE payments    DROP COLUMN IF EXISTS deposit_name;
ALTER TABLE orders      DROP COLUMN IF EXISTS privacy_agreed_at;
ALTER TABLE orders      DROP COLUMN IF EXISTS terms_agreed_at;
ALTER TABLE order_items DROP COLUMN IF EXISTS is_preorder;

COMMIT;

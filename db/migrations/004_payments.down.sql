-- 004_payments.down.sql
-- 004_payments.up.sql 되돌리기.
--
-- ⚠️ 결제·배송 기록이 전부 사라진다. 정산 증빙이 사라지는 것이므로
--    실행 전 반드시 백업할 것: ~/app/scripts/pg_backup.sh
--
-- 적용: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/004_payments.down.sql

BEGIN;

DROP TRIGGER IF EXISTS trg_orders_log_status_change ON orders;
DROP TRIGGER IF EXISTS trg_orders_log_initial_status ON orders;

DROP TABLE IF EXISTS order_status_histories;
DROP TABLE IF EXISTS shipments;
DROP TABLE IF EXISTS payments;

DROP FUNCTION IF EXISTS orders_log_status_change();
DROP FUNCTION IF EXISTS orders_log_initial_status();
DROP FUNCTION IF EXISTS payments_check_amount_matches_order();

COMMIT;

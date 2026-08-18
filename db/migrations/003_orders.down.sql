-- 003_orders.down.sql
-- 003_orders.up.sql 되돌리기.
--
-- ⚠️ 주문·장바구니 데이터가 전부 사라진다. 실행 전 반드시 백업: ~/app/scripts/pg_backup.sh
-- ⚠️ 4단계(결제·배송)를 적용한 상태라면 payments/shipments 가 orders 를 참조하므로
--    그쪽을 먼저 되돌려야 한다.
--
-- 적용: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/003_orders.down.sql

BEGIN;

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;

DROP FUNCTION IF EXISTS orders_check_items_total();

COMMIT;

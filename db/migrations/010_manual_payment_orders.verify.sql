-- 010_manual_payment_orders.verify.sql
-- 적용 후 확인용. 읽기 전용이며 데이터를 바꾸지 않는다.
--
-- 적용: psql "$DATABASE_URL" -f db/migrations/010_manual_payment_orders.verify.sql

\echo '=== 1. 추가된 컬럼 5개 (order_items.is_preorder 만 NOT NULL + DEFAULT false) ==='
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE (table_name = 'order_items' AND column_name = 'is_preorder')
   OR (table_name = 'orders'      AND column_name IN ('terms_agreed_at', 'privacy_agreed_at'))
   OR (table_name = 'payments'    AND column_name IN ('deposit_name', 'deposit_due_at'))
ORDER BY table_name, column_name;

\echo ''
\echo '=== 2. 추가된 부분 인덱스 2개 ==='
SELECT indexname, tablename
FROM pg_indexes
WHERE indexname IN ('idx_order_items_preorder_variant', 'idx_payments_deposit_due')
ORDER BY indexname;

\echo ''
\echo '=== 3. 동의 시각이 비어 있는 비회원 주문 (앱이 채우므로 0이어야 정상) ==='
SELECT count(*) AS 동의시각_없는_비회원주문
FROM orders
WHERE user_id IS NULL AND privacy_agreed_at IS NULL;

\echo ''
\echo '=== 4. 무통장 결제 대기 현황 (입금 기한 지난 건이 운영 대상) ==='
SELECT
  p.status,
  count(*) AS 건수,
  count(*) FILTER (WHERE p.deposit_due_at < now()) AS 기한초과
FROM payments p
WHERE p.pg_provider = 'manual'
GROUP BY p.status
ORDER BY p.status;

\echo ''
\echo '=== 5. 예약주문 항목 — 재고 차감을 건너뛴 줄 ==='
SELECT
  oi.is_preorder,
  count(*) AS 항목수,
  count(DISTINCT oi.order_id) AS 주문수
FROM order_items oi
GROUP BY oi.is_preorder
ORDER BY oi.is_preorder;

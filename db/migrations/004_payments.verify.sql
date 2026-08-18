-- 004_payments.verify.sql
-- 적용 후 확인용. 모든 테스트 데이터는 롤백되므로 실제 데이터는 남지 않는다.
--
-- 적용: psql "$DATABASE_URL" -f db/migrations/004_payments.verify.sql

\echo '=== 1. 결제·배송 테이블 3개 생성 확인 ==='
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('payments', 'shipments', 'order_status_histories')
ORDER BY table_name;

\echo ''
\echo '=== 2. 웹훅 멱등성 장치 확인 (pg_transaction_id UNIQUE 여야 함) ==='
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'payments'::regclass AND contype = 'u';

\echo ''
\echo '=== 3. 상태 이력 자동 기록 트리거 확인 ==='
SELECT tgname FROM pg_trigger
WHERE tgrelid = 'orders'::regclass AND NOT tgisinternal
ORDER BY tgname;

\echo ''
\echo '=== 4. 동작 테스트 ==='
\echo '   4-1 ~ 4-3 은 성공, 4-4 ~ 4-8 은 전부 ERROR 가 나야 정상이다.'
BEGIN;
\set ON_ERROR_STOP off

INSERT INTO orders (order_no, orderer_name, orderer_phone, recipient, recipient_phone,
                    postcode, address1, items_amount, shipping_fee, total_amount)
VALUES ('20260818-PAYVER', '검증', '010-0000-0000', '검증', '010-0000-0000',
        '06234', '서울', 50000, 3000, 53000);
INSERT INTO order_items (order_id, product_name, unit_price, quantity, line_amount)
VALUES ((SELECT id FROM orders WHERE order_no='20260818-PAYVER'), '검증상품', 50000, 1, 50000);

\echo ''
\echo '-- 4-1 주문 생성 시 상태 이력이 자동으로 남았는지 (1건이어야 정상)'
SELECT count(*) AS "자동 기록된 이력 수" FROM order_status_histories
WHERE order_id = (SELECT id FROM orders WHERE order_no='20260818-PAYVER');

\echo ''
\echo '-- 4-2 정상 결제 (금액 일치) → 성공해야 함'
SAVEPOINT s2;
INSERT INTO payments (order_id, pg_provider, pg_transaction_id, method, status, amount, paid_at)
VALUES ((SELECT id FROM orders WHERE order_no='20260818-PAYVER'),
        'toss', 'TXN-VERIFY-001', 'card', 'paid', 53000, now());
RELEASE SAVEPOINT s2;

\echo ''
\echo '-- 4-3 주문 상태 변경 → 이력이 자동으로 늘어야 정상 (2건)'
SAVEPOINT s3;
UPDATE orders SET status='paid', paid_at=now() WHERE order_no='20260818-PAYVER';
SELECT count(*) AS "이력 수(2여야 정상)" FROM order_status_histories
WHERE order_id = (SELECT id FROM orders WHERE order_no='20260818-PAYVER');
RELEASE SAVEPOINT s3;

\echo ''
\echo '-- 4-4 같은 웹훅 재수신 (거래 ID 중복) → ERROR 나야 정상'
SAVEPOINT s4;
INSERT INTO payments (order_id, pg_provider, pg_transaction_id, method, status, amount, paid_at)
VALUES ((SELECT id FROM orders WHERE order_no='20260818-PAYVER'),
        'toss', 'TXN-VERIFY-001', 'card', 'paid', 53000, now());
ROLLBACK TO SAVEPOINT s4;

\echo ''
\echo '-- 4-5 주문 총액과 다른 금액으로 결제 승인 기록 → ERROR 나야 정상'
\echo '   (별도 주문으로 테스트한다. 같은 주문에 넣으면 "주문당 결제 1건" 제약에 먼저 걸려'
\echo '    금액 대조 장치가 검증되지 않는다.)'
SAVEPOINT s5;
INSERT INTO orders (order_no, orderer_name, orderer_phone, recipient, recipient_phone,
                    postcode, address1, items_amount, shipping_fee, total_amount)
VALUES ('20260818-AMTBAD', '금액', '010-0000-0009', '금액', '010-0000-0009',
        '06234', '서울', 0, 70000, 70000);
INSERT INTO payments (order_id, pg_provider, pg_transaction_id, method, status, amount, paid_at)
VALUES ((SELECT id FROM orders WHERE order_no='20260818-AMTBAD'),
        'toss', 'TXN-VERIFY-BAD', 'card', 'paid', 100, now());
SET CONSTRAINTS trg_payments_amount_matches_order IMMEDIATE;
ROLLBACK TO SAVEPOINT s5;

\echo ''
\echo '-- 4-6 결제완료인데 거래 ID 없음 → ERROR 나야 정상'
SAVEPOINT s6;
INSERT INTO payments (order_id, pg_provider, method, status, amount, paid_at)
VALUES ((SELECT id FROM orders WHERE order_no='20260818-PAYVER'),
        'toss', 'card', 'paid', 53000, now());
ROLLBACK TO SAVEPOINT s6;

\echo ''
\echo '-- 4-7 송장번호 없이 발송 처리 → ERROR 나야 정상'
SAVEPOINT s7;
INSERT INTO shipments (order_id, carrier, status, shipped_at)
VALUES ((SELECT id FROM orders WHERE order_no='20260818-PAYVER'), 'CJ대한통운', 'shipped', now());
ROLLBACK TO SAVEPOINT s7;

\echo ''
\echo '-- 4-8 같은 송장번호를 두 번 입력 → 두 번째가 ERROR 나야 정상'
SAVEPOINT s8;
INSERT INTO orders (order_no, orderer_name, orderer_phone, recipient, recipient_phone,
                    postcode, address1, items_amount, total_amount)
VALUES ('20260818-PAYVE2', '검증2', '010-0000-0001', '검증2', '010-0000-0001',
        '06234', '서울', 0, 0);
INSERT INTO shipments (order_id, carrier, tracking_no, status, shipped_at)
VALUES ((SELECT id FROM orders WHERE order_no='20260818-PAYVER'), 'CJ대한통운', '1234567890', 'shipped', now());
INSERT INTO shipments (order_id, carrier, tracking_no, status, shipped_at)
VALUES ((SELECT id FROM orders WHERE order_no='20260818-PAYVE2'), 'CJ대한통운', '1234567890', 'shipped', now());
ROLLBACK TO SAVEPOINT s8;

ROLLBACK;

\echo ''
\echo '=== 5. 최종 상태 (테스트 데이터가 남지 않았는지) ==='
SELECT count(*) AS "orders(0이어야 함)" FROM orders;
SELECT count(*) AS "payments(0이어야 함)" FROM payments;
SELECT count(*) AS "이력(0이어야 함)" FROM order_status_histories;
SELECT count(*) AS "public 테이블 수(17이어야 함)" FROM information_schema.tables
  WHERE table_schema='public' AND table_type='BASE TABLE';

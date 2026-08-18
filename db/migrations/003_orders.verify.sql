-- 003_orders.verify.sql
-- 적용 후 확인용. 모든 테스트 데이터는 롤백되므로 실제 데이터는 남지 않는다.
--
-- 적용: psql "$DATABASE_URL" -f db/migrations/003_orders.verify.sql

\echo '=== 1. 주문 테이블 4개 생성 확인 ==='
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('carts', 'cart_items', 'orders', 'order_items')
ORDER BY table_name;

\echo ''
\echo '=== 2. 금액 컬럼이 전부 integer 인지 ==='
SELECT table_name, column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('items_amount','shipping_fee','discount_amount','total_amount','unit_price','line_amount')
ORDER BY table_name, column_name;

\echo ''
\echo '=== 3. 주문서 스냅샷 컬럼 존재 확인 (참조가 아니라 값으로 들고 있는지) ==='
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='order_items'
  AND column_name IN ('product_name','variant_label','unit_price')
ORDER BY column_name;

\echo ''
\echo '=== 4. 핵심 제약 목록 ==='
SELECT conrelid::regclass AS "table", conname FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND conname IN ('orders_total_matches','orders_discount_within_items','orders_no_format',
                  'orders_paid_needs_time','orders_cancelled_needs_time',
                  'order_items_line_matches','carts_needs_owner','carts_owner_is_exclusive',
                  'cart_items_unique_variant')
ORDER BY conname;

\echo ''
\echo '=== 5. 동작 테스트 ==='
\echo '   5-1, 5-2 는 성공해야 하고 5-3 ~ 5-8 은 전부 ERROR 가 나야 정상이다.'
BEGIN;
\set ON_ERROR_STOP off

-- 테스트용 상품 준비
INSERT INTO products (slug, name, base_price, status) VALUES ('__vt__', '검증상품', 50000, 'draft');
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
  VALUES ((SELECT id FROM products WHERE slug='__vt__'), '__VT__', 'L', 'BLACK', 10);

\echo ''
\echo '-- 5-1 비회원 주문 (user_id 없음) → 성공해야 함'
SAVEPOINT s1;
INSERT INTO orders (order_no, orderer_name, orderer_phone, recipient, recipient_phone,
                    postcode, address1, items_amount, shipping_fee, total_amount)
VALUES ('20260818-GUEST1', '비회원', '010-1111-2222', '비회원', '010-1111-2222',
        '06234', '서울시 강남구', 50000, 3000, 53000);
INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_label,
                         unit_price, quantity, line_amount)
VALUES ((SELECT id FROM orders WHERE order_no='20260818-GUEST1'),
        (SELECT id FROM products WHERE slug='__vt__'),
        (SELECT id FROM product_variants WHERE sku='__VT__'),
        '검증상품', 'L / BLACK', 50000, 1, 50000);
RELEASE SAVEPOINT s1;

\echo ''
\echo '-- 5-2 비회원 장바구니 (session_key) → 성공해야 함'
SAVEPOINT s2;
INSERT INTO carts (session_key) VALUES ('sess-abc-123');
INSERT INTO cart_items (cart_id, variant_id, quantity)
  VALUES ((SELECT id FROM carts WHERE session_key='sess-abc-123'),
          (SELECT id FROM product_variants WHERE sku='__VT__'), 2);
RELEASE SAVEPOINT s2;

\echo ''
\echo '-- 5-3 합계가 안 맞는 주문 (50000+3000 인데 total 10000) → ERROR 나야 정상'
SAVEPOINT s3;
INSERT INTO orders (order_no, orderer_name, orderer_phone, recipient, recipient_phone,
                    postcode, address1, items_amount, shipping_fee, total_amount)
VALUES ('20260818-BADSUM', '조작', '010-0000-0000', '조작', '010-0000-0000',
        '06234', '서울', 50000, 3000, 10000);
ROLLBACK TO SAVEPOINT s3;

\echo ''
\echo '-- 5-4 항목 합계와 주문 금액 불일치 → 커밋 시점에 ERROR 나야 정상'
SAVEPOINT s4;
INSERT INTO orders (order_no, orderer_name, orderer_phone, recipient, recipient_phone,
                    postcode, address1, items_amount, total_amount)
VALUES ('20260818-MISMAT', '불일치', '010-0000-0000', '불일치', '010-0000-0000',
        '06234', '서울', 50000, 50000);
INSERT INTO order_items (order_id, product_name, unit_price, quantity, line_amount)
VALUES ((SELECT id FROM orders WHERE order_no='20260818-MISMAT'), '검증상품', 100, 1, 100);
SET CONSTRAINTS trg_order_items_total_matches IMMEDIATE;
ROLLBACK TO SAVEPOINT s4;

\echo ''
\echo '-- 5-5 줄 금액이 단가x수량과 다름 → ERROR 나야 정상'
SAVEPOINT s5;
INSERT INTO order_items (order_id, product_name, unit_price, quantity, line_amount)
VALUES ((SELECT id FROM orders WHERE order_no='20260818-GUEST1'), '검증상품', 50000, 2, 50000);
ROLLBACK TO SAVEPOINT s5;

\echo ''
\echo '-- 5-6 주문번호 형식 위반 (순번 방식) → ERROR 나야 정상'
SAVEPOINT s6;
INSERT INTO orders (order_no, orderer_name, orderer_phone, recipient, recipient_phone,
                    postcode, address1, items_amount, total_amount)
VALUES ('1001', '순번', '010-0000-0000', '순번', '010-0000-0000', '06234', '서울', 0, 0);
ROLLBACK TO SAVEPOINT s6;

\echo ''
\echo '-- 5-7 결제완료인데 결제시각 없음 → ERROR 나야 정상'
SAVEPOINT s7;
INSERT INTO orders (order_no, orderer_name, orderer_phone, recipient, recipient_phone,
                    postcode, address1, items_amount, total_amount, status)
VALUES ('20260818-NOPAID', '결제', '010-0000-0000', '결제', '010-0000-0000',
        '06234', '서울', 0, 0, 'paid');
ROLLBACK TO SAVEPOINT s7;

\echo ''
\echo '-- 5-8 주인 없는 장바구니 → ERROR 나야 정상'
SAVEPOINT s8;
INSERT INTO carts (user_id, session_key) VALUES (NULL, NULL);
ROLLBACK TO SAVEPOINT s8;

ROLLBACK;

\echo ''
\echo '=== 6. 최종 상태 (테스트 데이터가 남지 않았는지) ==='
SELECT count(*) AS "orders 행 수(0이어야 함)" FROM orders;
SELECT count(*) AS "products 행 수(0이어야 함)" FROM products;
SELECT count(*) AS "public 테이블 수(14여야 함)" FROM information_schema.tables
  WHERE table_schema='public' AND table_type='BASE TABLE';

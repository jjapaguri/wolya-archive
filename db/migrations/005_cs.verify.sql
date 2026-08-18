-- 005_cs.verify.sql
-- 적용 후 확인용. 모든 테스트 데이터는 롤백되므로 실제 데이터는 남지 않는다.
--
-- 적용: psql "$DATABASE_URL" -f db/migrations/005_cs.verify.sql

\echo '=== 1. CS 테이블 7개 생성 확인 ==='
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('reviews','review_images','inquiries','inquiry_answers',
                     'faqs','order_returns','order_return_items')
ORDER BY table_name;

\echo ''
\echo '=== 2. 구매 인증 장치 확인 (order_item_id 가 NOT NULL + UNIQUE 여야 함) ==='
SELECT column_name, is_nullable FROM information_schema.columns
WHERE table_schema='public' AND table_name='reviews' AND column_name='order_item_id';
SELECT conname FROM pg_constraint
WHERE conrelid='reviews'::regclass AND contype='u';

\echo ''
\echo '=== 3. 동작 테스트 ==='
\echo '   3-1 ~ 3-4 는 성공, 3-5 ~ 3-10 은 전부 ERROR 가 나야 정상이다.'
BEGIN;
\set ON_ERROR_STOP off

-- 미결제 주문
INSERT INTO orders (order_no, orderer_name, orderer_phone, recipient, recipient_phone,
                    postcode, address1, items_amount, total_amount)
VALUES ('20260818-CSPEND', '미결제', '010-0000-0001', '미결제', '010-0000-0001',
        '06234', '서울', 10000, 10000);
INSERT INTO order_items (order_id, product_name, unit_price, quantity, line_amount)
VALUES ((SELECT id FROM orders WHERE order_no='20260818-CSPEND'), '미결제상품', 10000, 1, 10000);

-- 결제완료 주문 (수량 2)
INSERT INTO orders (order_no, orderer_name, orderer_phone, recipient, recipient_phone,
                    postcode, address1, items_amount, total_amount, status, paid_at)
VALUES ('20260818-CSPAID', '결제', '010-0000-0002', '결제', '010-0000-0002',
        '06234', '서울', 20000, 20000, 'paid', now());
INSERT INTO order_items (order_id, product_name, unit_price, quantity, line_amount)
VALUES ((SELECT id FROM orders WHERE order_no='20260818-CSPAID'), '결제상품', 10000, 2, 20000);

\echo ''
\echo '-- 3-1 결제완료 주문에 리뷰 작성 → 성공해야 함'
SAVEPOINT s1;
INSERT INTO reviews (order_item_id, rating, content)
VALUES ((SELECT oi.id FROM order_items oi JOIN orders o ON o.id=oi.order_id
         WHERE o.order_no='20260818-CSPAID'), 5, '원단이 정말 좋습니다');
RELEASE SAVEPOINT s1;

\echo ''
\echo '-- 3-2 비회원 문의 (이름+연락처) → 성공해야 함'
SAVEPOINT s2;
INSERT INTO inquiries (guest_name, guest_phone, type, title, content)
VALUES ('비회원', '010-1111-2222', 'product', '사이즈 문의', 'L 사이즈 실측이 궁금합니다');
RELEASE SAVEPOINT s2;

\echo ''
\echo '-- 3-3 답변 등록 → 문의 상태가 answered 로 자동 변경돼야 함'
SAVEPOINT s3;
INSERT INTO inquiry_answers (inquiry_id, content)
VALUES ((SELECT id FROM inquiries WHERE title='사이즈 문의'), '어깨 48cm 입니다');
SELECT status AS "문의 상태(answered여야 정상)" FROM inquiries WHERE title='사이즈 문의';
RELEASE SAVEPOINT s3;

\echo ''
\echo '-- 3-4 하자 반품 (판매자 배송비 부담) → 성공해야 함'
SAVEPOINT s4;
INSERT INTO order_returns (return_no, order_id, type, reason_code, shipping_fee_bearer)
VALUES ('20260818-RTN001', (SELECT id FROM orders WHERE order_no='20260818-CSPAID'),
        'return', 'defect', 'shop');
INSERT INTO order_return_items (return_id, order_item_id, quantity)
VALUES ((SELECT id FROM order_returns WHERE return_no='20260818-RTN001'),
        (SELECT oi.id FROM order_items oi JOIN orders o ON o.id=oi.order_id
         WHERE o.order_no='20260818-CSPAID'), 1);
RELEASE SAVEPOINT s4;

\echo ''
\echo '-- 3-5 미결제 주문에 리뷰 작성 → ERROR 나야 정상 (가짜 리뷰 차단)'
SAVEPOINT s5;
INSERT INTO reviews (order_item_id, rating, content)
VALUES ((SELECT oi.id FROM order_items oi JOIN orders o ON o.id=oi.order_id
         WHERE o.order_no='20260818-CSPEND'), 5, '좋아요 정말로');
ROLLBACK TO SAVEPOINT s5;

\echo ''
\echo '-- 3-6 같은 주문 항목에 리뷰 두 번 → ERROR 나야 정상'
SAVEPOINT s6;
INSERT INTO reviews (order_item_id, rating, content)
VALUES ((SELECT oi.id FROM order_items oi JOIN orders o ON o.id=oi.order_id
         WHERE o.order_no='20260818-CSPAID'), 4, '두 번째 리뷰입니다');
ROLLBACK TO SAVEPOINT s6;

\echo ''
\echo '-- 3-7 연락처 없는 비회원 문의 → ERROR 나야 정상'
SAVEPOINT s7;
INSERT INTO inquiries (type, title, content) VALUES ('etc', '익명 문의', '답변 받을 방법 없음');
ROLLBACK TO SAVEPOINT s7;

\echo ''
\echo '-- 3-8 하자 반품인데 고객에게 배송비 전가 → ERROR 나야 정상'
SAVEPOINT s8;
INSERT INTO order_returns (return_no, order_id, type, reason_code, shipping_fee_bearer)
VALUES ('20260818-RTN002', (SELECT id FROM orders WHERE order_no='20260818-CSPAID'),
        'return', 'defect', 'customer');
ROLLBACK TO SAVEPOINT s8;

\echo ''
\echo '-- 3-9 주문 수량(2)보다 많이 반품(5) → ERROR 나야 정상'
SAVEPOINT s9;
INSERT INTO order_returns (return_no, order_id, type, reason_code)
VALUES ('20260818-RTN003', (SELECT id FROM orders WHERE order_no='20260818-CSPAID'),
        'return', 'change_of_mind');
INSERT INTO order_return_items (return_id, order_item_id, quantity)
VALUES ((SELECT id FROM order_returns WHERE return_no='20260818-RTN003'),
        (SELECT oi.id FROM order_items oi JOIN orders o ON o.id=oi.order_id
         WHERE o.order_no='20260818-CSPAID'), 5);
ROLLBACK TO SAVEPOINT s9;

\echo ''
\echo '-- 3-10 다른 주문의 항목을 이 반품에 붙이기 → ERROR 나야 정상'
SAVEPOINT s10;
INSERT INTO order_returns (return_no, order_id, type, reason_code)
VALUES ('20260818-RTN004', (SELECT id FROM orders WHERE order_no='20260818-CSPAID'),
        'return', 'change_of_mind');
INSERT INTO order_return_items (return_id, order_item_id, quantity)
VALUES ((SELECT id FROM order_returns WHERE return_no='20260818-RTN004'),
        (SELECT oi.id FROM order_items oi JOIN orders o ON o.id=oi.order_id
         WHERE o.order_no='20260818-CSPEND'), 1);
ROLLBACK TO SAVEPOINT s10;

ROLLBACK;

\echo ''
\echo '=== 4. 최종 상태 (테스트 데이터가 남지 않았는지) ==='
SELECT count(*) AS "orders(0이어야 함)" FROM orders;
SELECT count(*) AS "reviews(0이어야 함)" FROM reviews;
SELECT count(*) AS "order_returns(0이어야 함)" FROM order_returns;
SELECT count(*) AS "public 테이블 수(24여야 함)" FROM information_schema.tables
  WHERE table_schema='public' AND table_type='BASE TABLE';

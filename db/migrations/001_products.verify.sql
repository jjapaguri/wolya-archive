-- 001_products.verify.sql
-- 적용 후 확인용. 읽기 전용이며 데이터를 바꾸지 않는다.
--
-- 적용: psql "$DATABASE_URL" -f db/migrations/001_products.verify.sql

\echo '=== 1. 테이블 7개 생성 확인 ==='
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

\echo ''
\echo '=== 2. 소유자 확인 (전부 wolya_app 이어야 함) ==='
SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

\echo ''
\echo '=== 3. 금액 컬럼 타입 확인 (전부 integer 여야 함) ==='
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('base_price', 'sale_price', 'additional_price', 'stock_quantity')
ORDER BY table_name, column_name;

\echo ''
\echo '=== 4. 시각 컬럼이 전부 timestamptz 인지 (timestamp 가 있으면 안 됨) ==='
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND data_type = 'timestamp without time zone';

\echo ''
\echo '=== 5. 핵심 제약 확인 ==='
SELECT conrelid::regclass AS "table", conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND conname IN (
    'product_variants_unique_option',
    'product_variants_stock_quantity_check',
    'products_sale_price_lte_base',
    'products_published_needs_time'
  )
ORDER BY conname;

\echo ''
\echo '=== 6. 인덱스 확인 ==='
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

\echo ''
\echo '=== 7. 재고 음수 방어 동작 테스트 (실패해야 정상) ==='
-- 롤백되므로 데이터는 남지 않는다.
BEGIN;
INSERT INTO products (slug, name, base_price, status) VALUES ('__verify__', '검증용', 10000, 'draft');
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
  VALUES ((SELECT id FROM products WHERE slug = '__verify__'), '__VERIFY__', 'L', 'BLACK', 1);

\echo '-- 아래에서 CHECK 위반 오류가 나면 정상입니다 --'
UPDATE product_variants SET stock_quantity = stock_quantity - 5 WHERE sku = '__VERIFY__';
ROLLBACK;

\echo ''
\echo '=== 8. 최종 상태 (테이블 수 / 남은 검증 데이터) ==='
SELECT count(*) AS "public 테이블 수" FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
SELECT count(*) AS "검증용 잔재(0이어야 함)" FROM products WHERE slug = '__verify__';

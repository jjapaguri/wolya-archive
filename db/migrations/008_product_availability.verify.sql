-- 008_product_availability.verify.sql
-- 적용 후 확인용. 읽기 전용이며 데이터를 바꾸지 않는다.
--
-- 적용: psql "$DATABASE_URL" -f db/migrations/008_product_availability.verify.sql

\echo '=== 1. 추가된 컬럼 3개 ==='
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('availability', 'source_url', 'note', 'kind', 'short_measure')
ORDER BY column_name;

\echo ''
\echo '=== 2. availability CHECK 제약 ==='
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'products'::regclass AND conname = 'products_availability_check';

\echo ''
\echo '=== 3. 매입 상태 분포 (기존 상품은 전부 available 이어야 함) ==='
SELECT availability, count(*)
FROM products WHERE deleted_at IS NULL
GROUP BY availability ORDER BY availability;

\echo ''
\echo '=== 4. products.status(노출)와 availability(매입)가 별개 축인지 확인 ==='
SELECT status AS 노출상태, availability AS 매입상태, count(*)
FROM products WHERE deleted_at IS NULL
GROUP BY status, availability ORDER BY 1, 2;

\echo ''
\echo '=== 4b. kind 분포 (가방·신발은 NULL 이어야 함) ==='
SELECT coalesce(kind, '(NULL)') AS kind, count(*)
FROM products WHERE deleted_at IS NULL GROUP BY kind ORDER BY 1;

\echo ''
\echo '=== 5. 예약주문 부분 인덱스 존재 확인 ==='
SELECT indexname FROM pg_indexes
WHERE tablename = 'products' AND indexname = 'products_preorder_idx';

-- 006_product_presentation.verify.sql
-- 적용 후 확인용. 읽기 전용이며 데이터를 바꾸지 않는다.
--
-- 적용: psql "$DATABASE_URL" -f db/migrations/006_product_presentation.verify.sql

\echo '=== 1. 추가된 컬럼 11개가 전부 있고 nullable 인지 ==='
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('tag_label','condition_note','hook','fabric','fit','measurements',
                      'stock_note','recommended_for','hashtags','source_price')
ORDER BY column_name;

\echo ''
\echo '=== 2. source_price 음수 방지 CHECK 존재 확인 ==='
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'products'::regclass AND conname = 'products_source_price_check';

\echo ''
\echo '=== 3. 기존 컬럼이 그대로인지 (추가형 마이그레이션이므로 변화 없어야 함) ==='
SELECT count(*) AS 기존_핵심컬럼_수
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('id','slug','brand_id','category_id','name','base_price',
                      'sale_price','condition','status','published_at','deleted_at');

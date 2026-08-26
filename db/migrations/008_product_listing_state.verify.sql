-- 008_product_listing_state.verify.sql
-- 적용 후 확인용. 읽기 전용이며 데이터를 바꾸지 않는다.
--
-- 적용: psql "$DATABASE_URL" -f db/migrations/008_product_listing_state.verify.sql

\echo '=== 1. 추가된 컬럼 3개 확인 (is_preorder 만 NOT NULL + DEFAULT false) ==='
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('short_measure', 'seller_note', 'is_preorder')
ORDER BY column_name;

\echo ''
\echo '=== 2. 기존 행에 is_preorder 가 NULL 없이 채워졌는지 (DEFAULT 가 먹었는지) ==='
SELECT count(*) AS is_preorder_널인_행
FROM products
WHERE is_preorder IS NULL;

\echo ''
\echo '=== 3. 노출 상태 분포 — A1 이 화면에 그리는 세 갈래가 DB 에서 어떻게 갈리는지 ==='
\echo '    preorder = is_preorder / sold = status sold_out 또는 재고 0 / 나머지 available'
SELECT
  CASE
    WHEN p.is_preorder THEN 'preorder'
    WHEN p.status = 'sold_out' OR COALESCE(v.qty, 0) = 0 THEN 'sold'
    ELSE 'available'
  END AS 화면_상태,
  count(*) AS 건수
FROM products p
LEFT JOIN LATERAL (
  SELECT sum(pv.stock_quantity) AS qty FROM product_variants pv WHERE pv.product_id = p.id
) v ON TRUE
WHERE p.deleted_at IS NULL
GROUP BY 1
ORDER BY 1;

\echo ''
\echo '=== 4. 대표 이미지가 없는 published 상품 (있으면 카드가 빈칸으로 뜬다) ==='
SELECT p.slug
FROM products p
WHERE p.deleted_at IS NULL
  AND p.status IN ('published', 'sold_out')
  AND NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)
ORDER BY p.slug;

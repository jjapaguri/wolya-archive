-- 009_seed_all_products.verify.sql
-- 적용 후 확인용. 읽기 전용이며 데이터를 바꾸지 않는다.
--
-- 적용: psql "$DATABASE_URL" -f db/migrations/009_seed_all_products.verify.sql
--
-- 기대값 (2026-08-25 원장 기준):
--   상품 37 · 브랜드 15 · 옵션 37 · 이미지 40
--   화면 상태 available 3 / preorder 27 / sold 7

\echo '=== 1. 건수 요약 ==='
SELECT 'products' AS 대상, count(*) AS 건수 FROM products WHERE deleted_at IS NULL
UNION ALL SELECT 'brands',   count(*) FROM brands
UNION ALL SELECT 'variants', count(*) FROM product_variants
UNION ALL SELECT 'images',   count(*) FROM product_images;

\echo ''
\echo '=== 2. 화면 상태 분포 (A1 이 그리는 세 갈래) ==='
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
GROUP BY 1 ORDER BY 1;

\echo ''
\echo '=== 3. published 인데 published_at 이 비어 있는 행 (0건이어야 함) ==='
SELECT count(*) AS 위반 FROM products WHERE status = 'published' AND published_at IS NULL;

\echo ''
\echo '=== 4. 대표 이미지가 2장 이상이거나 0장인 상품 (0건이어야 함) ==='
SELECT p.slug, count(*) FILTER (WHERE pi.is_primary) AS 대표
FROM products p LEFT JOIN product_images pi ON pi.product_id = p.id
WHERE p.deleted_at IS NULL
GROUP BY p.slug
HAVING count(*) FILTER (WHERE pi.is_primary) <> 1
ORDER BY p.slug;

\echo ''
\echo '=== 5. 008 컬럼이 안 채워진 행 (short_measure 는 0건이어야 함) ==='
SELECT count(*) FILTER (WHERE short_measure IS NULL) AS short_measure_빈행,
       count(*) FILTER (WHERE seller_note IS NOT NULL) AS 판매자고지_있는행
FROM products WHERE deleted_at IS NULL;

\echo ''
\echo '=== 6. 브랜드가 두 표기로 갈라지지 않았는지 (같은 slug 가 2행이면 위반) ==='
SELECT slug, count(*) FROM brands GROUP BY slug HAVING count(*) > 1;

\echo ''
\echo '=== 7. 아카이브 번호 순 전량 (화면 정렬과 같은 순서) ==='
SELECT p.tag_label, p.slug, p.status, p.is_preorder, v.qty AS 재고, b.name AS brand
FROM products p
LEFT JOIN brands b ON b.id = p.brand_id
LEFT JOIN LATERAL (
  SELECT sum(pv.stock_quantity) AS qty FROM product_variants pv WHERE pv.product_id = p.id
) v ON TRUE
WHERE p.deleted_at IS NULL
ORDER BY p.tag_label;

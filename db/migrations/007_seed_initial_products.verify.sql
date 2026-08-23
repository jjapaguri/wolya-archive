-- 007_seed_initial_products.verify.sql
-- 적용 후 확인용. 읽기 전용이며 데이터를 바꾸지 않는다.
--
-- 적용: psql "$DATABASE_URL" -f db/migrations/007_seed_initial_products.verify.sql

\echo '=== 1. 상품 3건이 published 로 들어왔는지 ==='
SELECT p.slug, p.status, p.base_price, p.condition, b.name AS brand, c.slug AS category
FROM products p
LEFT JOIN brands b ON b.id = p.brand_id
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.deleted_at IS NULL
ORDER BY p.tag_label;

\echo ''
\echo '=== 2. published 인데 published_at 이 비어 있는 행 (0건이어야 함) ==='
SELECT count(*) AS 위반 FROM products WHERE status = 'published' AND published_at IS NULL;

\echo ''
\echo '=== 3. 대표 이미지가 상품당 정확히 1장인지 (전부 1이어야 함) ==='
SELECT p.slug, count(*) FILTER (WHERE pi.is_primary) AS 대표, count(*) AS 전체
FROM products p JOIN product_images pi ON pi.product_id = p.id
GROUP BY p.slug ORDER BY p.slug;

\echo ''
\echo '=== 4. 재고 (단벌이므로 전부 1) ==='
SELECT p.slug, v.sku, v.size, v.stock_quantity
FROM products p JOIN product_variants v ON v.product_id = p.id
ORDER BY v.sku;

\echo ''
\echo '=== 5. 카테고리 4분류 ==='
SELECT slug, name, sort_order FROM categories ORDER BY sort_order;

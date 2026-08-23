-- 007_seed_initial_products.down.sql
-- 007_seed_initial_products.up.sql 되돌리기.
--
-- ⚠️ 시드한 상품 3건과 그 옵션·이미지만 정확히 지운다.
--    테이블을 DROP 하지 않는다. 브랜드·카테고리는 다른 상품이 참조할 수 있으므로 남긴다.
--    실행 전 백업: ~/app/scripts/pg_backup.sh
--
-- 적용: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/007_seed_initial_products.down.sql

BEGIN;

DELETE FROM product_images
WHERE product_id IN (SELECT id FROM products WHERE slug IN (
  'yiyae-washed-denim-trucker',
  'twiyo-shell-button-fur-bag',
  'hysteric-glamour-field-jacket-black'
));

DELETE FROM product_variants
WHERE product_id IN (SELECT id FROM products WHERE slug IN (
  'yiyae-washed-denim-trucker',
  'twiyo-shell-button-fur-bag',
  'hysteric-glamour-field-jacket-black'
));

DELETE FROM products WHERE slug IN (
  'yiyae-washed-denim-trucker',
  'twiyo-shell-button-fur-bag',
  'hysteric-glamour-field-jacket-black'
);

COMMIT;

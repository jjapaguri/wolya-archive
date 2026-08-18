-- 001_products.down.sql
-- 001_products.up.sql 되돌리기.
--
-- ⚠️ 이 스크립트는 상품·재고·이미지 데이터를 전부 지운다.
--    실행 전 반드시 백업할 것:  ~/app/scripts/pg_backup.sh
--
-- 적용: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/001_products.down.sql

BEGIN;

DROP TABLE IF EXISTS product_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS product_variants;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS brands;

DROP FUNCTION IF EXISTS categories_enforce_two_levels();
DROP FUNCTION IF EXISTS set_updated_at();

COMMIT;

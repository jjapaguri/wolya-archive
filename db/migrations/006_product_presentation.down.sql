-- 006_product_presentation.down.sql
-- 006_product_presentation.up.sql 되돌리기.
--
-- ⚠️ 이 스크립트는 상품 상세 서술(후킹문·소재·핏·실측 등)과 매입가를 지운다.
--    되돌리기 전 반드시 백업할 것:  ~/app/scripts/pg_backup.sh
--
-- 적용: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/006_product_presentation.down.sql

BEGIN;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_source_price_check;

ALTER TABLE products DROP COLUMN IF EXISTS source_price;
ALTER TABLE products DROP COLUMN IF EXISTS hashtags;
ALTER TABLE products DROP COLUMN IF EXISTS recommended_for;
ALTER TABLE products DROP COLUMN IF EXISTS stock_note;
ALTER TABLE products DROP COLUMN IF EXISTS measurements;
ALTER TABLE products DROP COLUMN IF EXISTS fit;
ALTER TABLE products DROP COLUMN IF EXISTS fabric;
ALTER TABLE products DROP COLUMN IF EXISTS hook;
ALTER TABLE products DROP COLUMN IF EXISTS condition_note;
ALTER TABLE products DROP COLUMN IF EXISTS tag_label;

COMMIT;

-- 008_product_availability.down.sql
-- 008_product_availability.up.sql 되돌리기.
--
-- ⚠️ 매입 상태(보유/예약주문)·원본 매물 링크·판매자 고지를 전부 지운다.
--    되돌리기 전 백업: ~/app/scripts/pg_backup.sh
--
-- 적용: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/008_product_availability.down.sql

BEGIN;

DROP INDEX IF EXISTS products_preorder_idx;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_availability_check;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_kind_check;

ALTER TABLE products DROP COLUMN IF EXISTS short_measure;
ALTER TABLE products DROP COLUMN IF EXISTS kind;

ALTER TABLE products DROP COLUMN IF EXISTS note;
ALTER TABLE products DROP COLUMN IF EXISTS source_url;
ALTER TABLE products DROP COLUMN IF EXISTS availability;

COMMIT;

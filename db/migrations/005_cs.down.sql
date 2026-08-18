-- 005_cs.down.sql
-- 005_cs.up.sql 되돌리기.
--
-- ⚠️ 리뷰·문의·반품 기록이 전부 사라진다. 반품 기록은 분쟁 증빙이므로
--    실행 전 반드시 백업할 것: ~/app/scripts/pg_backup.sh
--
-- 적용: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/005_cs.down.sql

BEGIN;

DROP TABLE IF EXISTS order_return_items;
DROP TABLE IF EXISTS order_returns;
DROP TABLE IF EXISTS faqs;
DROP TABLE IF EXISTS inquiry_answers;
DROP TABLE IF EXISTS inquiries;
DROP TABLE IF EXISTS review_images;
DROP TABLE IF EXISTS reviews;

DROP FUNCTION IF EXISTS order_return_items_check_quantity();
DROP FUNCTION IF EXISTS inquiries_mark_answered();
DROP FUNCTION IF EXISTS reviews_require_paid_order();

COMMIT;

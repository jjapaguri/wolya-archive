-- 008_product_listing_state.down.sql
-- 되돌리기 — 008 이 더한 컬럼 3개를 뗀다.
--
-- ⚠️ 이건 파괴적이다. 세 컬럼에 들어 있던 값이 같이 사라진다.
--    되돌리기 전에 백업할 것: ~/app/scripts/pg_backup.sh
--    AGENTS.md 4절에 따라 운영 DB 에서는 **사람 승인 없이 실행 금지.**
--
-- 앱이 이 컬럼들을 이미 읽고 있으면(A1 이후) 먼저 앱을 되돌린 뒤 이걸 돌린다.
-- 순서를 뒤집으면 조회가 "column does not exist" 로 죽는다.

BEGIN;

ALTER TABLE products DROP COLUMN IF EXISTS is_preorder;
ALTER TABLE products DROP COLUMN IF EXISTS seller_note;
ALTER TABLE products DROP COLUMN IF EXISTS short_measure;

COMMIT;

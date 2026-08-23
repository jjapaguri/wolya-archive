-- 009_backfill_availability_fields.down.sql
-- 009 되돌리기 — 008 이 추가한 컬럼의 값을 비운다.
--
-- ⚠️ 매입 상태·코디 분류·짧은 실측·원본 링크·고지가 전부 비워진다.
--    availability 는 NOT NULL 이라 기본값 'available' 로 되돌린다.
--    되돌리기 전 백업: ~/app/scripts/pg_backup.sh
--
-- 적용: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/009_backfill_availability_fields.down.sql

BEGIN;

UPDATE products SET
  availability  = 'available',
  kind          = NULL,
  short_measure = NULL,
  source_url    = NULL,
  note          = NULL;

COMMIT;

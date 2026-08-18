-- 002_users.down.sql
-- 002_users.up.sql 되돌리기.
--
-- ⚠️ 회원 정보가 전부 사라진다. 실행 전 반드시 백업할 것: ~/app/scripts/pg_backup.sh
-- ⚠️ 3단계(주문) 이후를 적용한 상태라면 주문 테이블이 users 를 참조하므로 먼저 그쪽을 되돌려야 한다.
--
-- 적용: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/002_users.down.sql

BEGIN;

DROP TABLE IF EXISTS user_addresses;
DROP TABLE IF EXISTS user_social_accounts;
DROP TABLE IF EXISTS users;

-- set_updated_at() 은 001 소유이므로 여기서 지우지 않는다.

COMMIT;

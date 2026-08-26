-- 011_auth_sessions.down.sql
-- 되돌리기: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/011_auth_sessions.down.sql
--
-- 주의: user_sessions 를 지우면 로그인해 있던 사람들이 전부 로그아웃된다.
-- auth_login_attempts 를 지우면 속도 제한 카운트가 초기화된다. 둘 다 복구할 값이 아니다.
--
-- **password_hash CHECK 를 002 의 좁은 형태로 되돌린다.** scrypt 해시가 이미 저장된
-- 계정이 있으면 이 되돌리기는 실패한다 — 의도된 것이다. 조용히 넘어가면 앱이
-- 로그인시킬 수 없는 계정이 DB 에 남는다. 그런 계정이 있는 상태로 되돌려야 한다면
-- 사람이 판단해서 해당 password_hash 를 NULL 로 만든 뒤(= 소셜 전용 계정으로 강등)
-- 다시 실행한다.

BEGIN;

DROP TABLE IF EXISTS auth_login_attempts;
DROP TABLE IF EXISTS user_sessions;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_password_is_hash;
ALTER TABLE users ADD CONSTRAINT users_password_is_hash
  CHECK (password_hash IS NULL OR password_hash ~ '^\$(2[aby]|argon2(id|i|d))\$');

COMMIT;

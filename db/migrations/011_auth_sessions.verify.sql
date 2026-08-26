-- 011_auth_sessions.verify.sql — 읽기 전용 확인
-- 실행: psql "$DATABASE_URL" -f db/migrations/011_auth_sessions.verify.sql

\echo '== 1) 테이블이 생겼나 (user_sessions, auth_login_attempts 두 줄이어야 한다) =='
SELECT table_name
  FROM information_schema.tables
 WHERE table_schema = 'public'
   AND table_name IN ('user_sessions', 'auth_login_attempts')
 ORDER BY table_name;

\echo '== 2) password_hash CHECK 가 scrypt 를 받나 (정의에 scrypt 가 보여야 한다) =='
SELECT pg_get_constraintdef(oid) AS users_password_is_hash
  FROM pg_constraint
 WHERE conrelid = 'users'::regclass
   AND conname = 'users_password_is_hash';

\echo '== 3) scrypt 형식이 실제로 통과하나 / 평문은 여전히 거부되나 =='
-- 아무것도 남기지 않는다 (ROLLBACK). t / f 가 아니라 예외가 나는 것이 정상 동작이다.
DO $$
DECLARE
  ok boolean;
BEGIN
  BEGIN
    INSERT INTO users (email, password_hash, name)
    VALUES ('verify-011@example.com', '$scrypt$N=16384,r=8,p=1$c2FsdA$a2V5', '확인용');
    ok := true;
  EXCEPTION WHEN check_violation THEN
    ok := false;
  END;
  RAISE NOTICE 'scrypt 해시 허용됨(true 여야 한다): %', ok;

  BEGIN
    INSERT INTO users (email, password_hash, name)
    VALUES ('verify-011-plain@example.com', 'hunter2', '확인용');
    ok := true;
  EXCEPTION WHEN check_violation THEN
    ok := false;
  END;
  RAISE NOTICE '평문 거부됨(false 여야 한다): %', ok;

  RAISE EXCEPTION '확인 끝 — 일부러 롤백한다 (확인용 행을 남기지 않는다)';
EXCEPTION WHEN raise_exception THEN
  RAISE NOTICE '%', SQLERRM;
END;
$$;

\echo '== 4) 확인용 행이 남지 않았나 (0 이어야 한다) =='
SELECT count(*) AS leftover FROM users WHERE email LIKE 'verify-011%';

\echo '== 5) 세션 토큰 해시 인덱스·제약 =='
SELECT indexname FROM pg_indexes
 WHERE schemaname = 'public' AND tablename IN ('user_sessions', 'auth_login_attempts')
 ORDER BY tablename, indexname;

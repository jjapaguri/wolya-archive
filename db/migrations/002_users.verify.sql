-- 002_users.verify.sql
-- 적용 후 확인용. 모든 테스트 데이터는 롤백되므로 실제 데이터는 남지 않는다.
--
-- 적용: psql "$DATABASE_URL" -f db/migrations/002_users.verify.sql

\echo '=== 1. 회원 테이블 3개 생성 확인 ==='
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'user_social_accounts', 'user_addresses')
ORDER BY table_name;

\echo ''
\echo '=== 2. 수집하지 않아야 할 개인정보 컬럼이 없는지 (결과 0건이어야 정상) ==='
SELECT table_name, column_name FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('birth_date', 'birthday', 'gender', 'ssn', 'resident_number');

\echo ''
\echo '=== 3. 동의 항목이 시각(timestamptz)으로 저장되는지 ==='
SELECT column_name, data_type, is_nullable FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
  AND column_name IN ('terms_agreed_at', 'privacy_agreed_at', 'marketing_agreed_at')
ORDER BY column_name;

\echo ''
\echo '=== 4. 핵심 제약 목록 ==='
SELECT conrelid::regclass AS "table", conname
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND conname IN (
    'users_password_is_hash', 'users_email_lowercase', 'users_email_shape',
    'users_withdrawn_needs_time',
    'user_social_unique_provider_account', 'user_social_unique_per_user'
  )
ORDER BY conname;

\echo ''
\echo '=== 5. 동작 테스트 ==='
\echo '   5-1 만 성공하고, 5-2 ~ 5-7 은 전부 ERROR 가 나야 정상이다.'
\echo '   각 테스트는 SAVEPOINT 로 격리되어 있어 하나가 실패해도 다음이 계속 실행된다.'
BEGIN;
\set ON_ERROR_STOP off

\echo ''
\echo '-- 5-1 정상 가입 → 성공해야 함'
SAVEPOINT s1;
INSERT INTO users (email, password_hash, name)
VALUES ('test@example.com', '$2b$12$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV', '테스트');

\echo ''
\echo '-- 5-2 평문 비밀번호 → ERROR 나야 정상'
SAVEPOINT s2;
INSERT INTO users (email, password_hash, name) VALUES ('plain@example.com', 'password1234', '평문');
ROLLBACK TO SAVEPOINT s2;

\echo ''
\echo '-- 5-3 대문자 이메일 → ERROR 나야 정상'
SAVEPOINT s3;
INSERT INTO users (email, name) VALUES ('UPPER@example.com', '대문자');
ROLLBACK TO SAVEPOINT s3;

\echo ''
\echo '-- 5-4 이메일 중복 → ERROR 나야 정상'
SAVEPOINT s4;
INSERT INTO users (email, name) VALUES ('test@example.com', '중복');
ROLLBACK TO SAVEPOINT s4;

\echo ''
\echo '-- 5-5 탈퇴 상태인데 deleted_at 없음 → ERROR 나야 정상'
SAVEPOINT s5;
INSERT INTO users (email, name, status) VALUES ('gone@example.com', '탈퇴', 'withdrawn');
ROLLBACK TO SAVEPOINT s5;

\echo ''
\echo '-- 5-6 같은 소셜 계정을 두 회원에게 연결 → 두 번째가 ERROR 나야 정상'
SAVEPOINT s6;
INSERT INTO users (email, name) VALUES ('social1@example.com', '소셜1');
INSERT INTO users (email, name) VALUES ('social2@example.com', '소셜2');
INSERT INTO user_social_accounts (user_id, provider, provider_user_id)
  VALUES ((SELECT id FROM users WHERE email = 'social1@example.com'), 'kakao', 'KAKAO-123');
INSERT INTO user_social_accounts (user_id, provider, provider_user_id)
  VALUES ((SELECT id FROM users WHERE email = 'social2@example.com'), 'kakao', 'KAKAO-123');
ROLLBACK TO SAVEPOINT s6;

\echo ''
\echo '-- 5-7 기본 배송지 2개 → 두 번째가 ERROR 나야 정상'
SAVEPOINT s7;
INSERT INTO user_addresses (user_id, recipient, phone, postcode, address1, is_default)
  VALUES ((SELECT id FROM users WHERE email = 'test@example.com'), '수령인', '010-0000-0000', '06234', '서울시 강남구', true);
INSERT INTO user_addresses (user_id, recipient, phone, postcode, address1, is_default)
  VALUES ((SELECT id FROM users WHERE email = 'test@example.com'), '수령인2', '010-0000-0001', '06235', '서울시 서초구', true);
ROLLBACK TO SAVEPOINT s7;

ROLLBACK;

\echo ''
\echo '=== 6. 최종 상태 (테스트 데이터가 남지 않았는지) ==='
SELECT count(*) AS "users 행 수(0이어야 함)" FROM users;
SELECT count(*) AS "public 테이블 수(10이어야 함)" FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

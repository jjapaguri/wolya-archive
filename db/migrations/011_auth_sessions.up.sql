-- 011_auth_sessions.up.sql
-- WOLYA ARCHIVE 스키마 11단계 — 로그인(인증) 지원
--
-- 적용:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/011_auth_sessions.up.sql
-- 확인:  psql "$DATABASE_URL" -f db/migrations/011_auth_sessions.verify.sql
-- 되돌리기: db/migrations/011_auth_sessions.down.sql
--
-- 전제: 002_users 가 먼저 적용되어 있어야 한다.
--
-- 이 마이그레이션이 하는 일은 셋이다.
--  1) users.password_hash 형식 CHECK 를 scrypt 까지 받도록 넓힌다
--  2) 서버 쪽 세션 원장 user_sessions 를 만든다 (로그아웃이 실제로 무효화하려면 필요)
--  3) 로그인 시도 기록 auth_login_attempts 를 만든다 (속도 제한 근거)
--
-- **파괴적 구문 없음.** DROP TABLE / DELETE / TRUNCATE / 컬럼 삭제를 쓰지 않는다.
-- 유일하게 기존 객체를 건드리는 것은 (1) 의 CHECK 제약 교체인데, 이는 **받는 값의
-- 범위를 넓히기만** 한다. 기존 행은 새 CHECK 도 그대로 통과하므로 데이터가 사라지지 않는다.
--
-- **멱등하다.** 두 번 돌려도 같은 결과다 (IF NOT EXISTS / DROP CONSTRAINT IF EXISTS).

BEGIN;

-- 002 가 없으면 여기서 멈춘다
DO $$
BEGIN
  IF to_regclass('public.users') IS NULL THEN
    RAISE EXCEPTION '002_users 를 먼저 적용해야 합니다 (users 테이블 없음)';
  END IF;
  IF to_regprocedure('set_updated_at()') IS NULL THEN
    RAISE EXCEPTION '001_products 를 먼저 적용해야 합니다 (set_updated_at 함수 없음)';
  END IF;
END;
$$;

-- ── 1) 비밀번호 해시 형식 — scrypt 를 받는다 ──────────────────────
--
-- 002 의 CHECK 는 bcrypt(`$2a$`…) 와 argon2(`$argon2id$`…) 만 통과시킨다.
-- 앱은 **Node 내장 crypto 의 scrypt** 를 쓴다 (새 라이브러리 설치 금지 제약).
-- 저장 형식은 자체 정의한 modular-crypt 꼴이다:
--
--   $scrypt$N=16384,r=8,p=1$<salt(base64url)>$<derived key(base64url)>
--
-- 평문을 막는다는 CHECK 의 원래 목적은 그대로다 — 여전히 `$알고리즘$` 으로 시작해야 한다.
-- bcrypt/argon2 도 계속 통과시킨다(나중에 옮겨 갈 여지를 남긴다).
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_password_is_hash;
ALTER TABLE users ADD CONSTRAINT users_password_is_hash
  CHECK (password_hash IS NULL OR password_hash ~ '^\$(2[aby]|argon2(id|i|d)|scrypt)\$');

COMMENT ON CONSTRAINT users_password_is_hash ON users IS
  '평문 비밀번호가 들어오는 것을 DB 가 막는 마지막 방어선. 앱이 쓰는 형식은 $scrypt$N=..,r=..,p=..$salt$key.';

-- ── 2) user_sessions — 로그인 세션 원장 ────────────────────────────
--
-- **토큰 원문을 저장하지 않는다.** 쿠키에 들어가는 난수의 SHA-256 만 넣는다.
-- DB 백업이 새더라도 그것만으로 남의 세션에 올라탈 수 없다 (역산 불가).
-- 조회는 앱이 같은 방식으로 해시해서 token_hash 로 찾는다.
CREATE TABLE IF NOT EXISTS user_sessions (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- SHA-256 hex 64자. 원문 토큰은 어디에도 저장하지 않는다
  token_hash   CHAR(64) NOT NULL UNIQUE,

  expires_at   TIMESTAMPTZ NOT NULL,
  -- 로그아웃이 채운다. 채워지면 그 세션은 죽는다 (행을 지우지 않는 이유는 감사 흔적)
  revoked_at   TIMESTAMPTZ,

  -- 개인정보 최소 수집: 기기 식별에 쓸 수 있는 값은 넣지 않는다.
  -- "언제 마지막으로 썼나" 만 남긴다 (휴면 판정·이상 로그인 확인용)
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT user_sessions_token_hash_shape CHECK (token_hash ~ '^[0-9a-f]{64}$')
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
-- 만료 세션 청소용
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

COMMENT ON TABLE user_sessions IS '로그인 세션. 쿠키 토큰의 SHA-256 만 보관한다 — 원문은 저장하지 않는다.';
COMMENT ON COLUMN user_sessions.revoked_at IS '로그아웃 시각. NULL 이 아니면 죽은 세션. 행을 지우지 않는 것은 감사 흔적을 남기기 위해서다.';

-- ── 3) auth_login_attempts — 로그인 시도 기록 ──────────────────────
--
-- 속도 제한의 근거 데이터. 인메모리로 세면 PM2 재시작·다중 프로세스에서 초기화되므로
-- DB 에 남긴다. 로그인은 어차피 DB 가 있어야 되는 기능이라 의존성이 늘지 않는다.
--
-- **비밀번호는 평문이든 해시든 여기에 들어가지 않는다.** 이메일과 접속 IP 뿐이다.
CREATE TABLE IF NOT EXISTS auth_login_attempts (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- 소문자 이메일. 존재하지 않는 계정에 대한 시도도 기록한다(계정 탐색 차단)
  email        VARCHAR(255),
  -- IPv6 까지 들어갈 수 있어 넉넉히. 프록시 뒤라 X-Forwarded-For 의 첫 값
  ip           VARCHAR(64),
  succeeded    BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_login_attempts_email
  ON auth_login_attempts(email, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_login_attempts_ip
  ON auth_login_attempts(ip, attempted_at DESC);

COMMENT ON TABLE auth_login_attempts IS '로그인 시도 기록(속도 제한 근거). 비밀번호는 평문·해시 모두 저장하지 않는다. 앱이 하루 지난 행을 정리한다.';

COMMIT;

-- 002_users.up.sql
-- WOLYA ARCHIVE 스키마 2단계 — 회원 정보
-- users, user_social_accounts, user_addresses
--
-- 적용:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/002_users.up.sql
-- 되돌리기: db/migrations/002_users.down.sql
--
-- 전제: 001_products 가 먼저 적용되어 있어야 한다 (set_updated_at() 함수 공용).
--
-- 개인정보 원칙
--  - 안 쓰는 항목은 아예 만들지 않는다 (생년월일·성별 컬럼 없음)
--  - 동의는 boolean 이 아니라 **동의 시각**으로 남긴다 (분쟁 시 증빙)
--  - 비밀번호는 해시만 저장. 평문 저장을 DB가 거부하도록 형식 CHECK 를 건다

BEGIN;

-- 001 에서 만든 set_updated_at() 이 없으면 여기서 멈춘다
DO $$
BEGIN
  IF to_regprocedure('set_updated_at()') IS NULL THEN
    RAISE EXCEPTION '001_products 를 먼저 적용해야 합니다 (set_updated_at 함수 없음)';
  END IF;
END;
$$;

-- ── users ──────────────────────────────────────────────────────
CREATE TABLE users (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- 소셜 로그인 제공자가 이메일을 안 주는 경우가 있어 NULL 허용.
  -- 값이 있으면 유일해야 하고, 항상 소문자로 저장한다(대소문자 다른 중복가입 방지).
  email               VARCHAR(255) UNIQUE,

  -- 소셜 전용 계정은 NULL. 값이 있으면 bcrypt/argon2 해시 형식이어야 한다.
  password_hash       VARCHAR(255),

  name                VARCHAR(80) NOT NULL,
  phone               VARCHAR(20),

  role                VARCHAR(20) NOT NULL DEFAULT 'customer'
                      CHECK (role IN ('customer', 'admin')),
  status              VARCHAR(20) NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'dormant', 'suspended', 'withdrawn')),

  email_verified_at   TIMESTAMPTZ,
  -- 필수 약관은 가입 시점에 반드시 기록된다
  terms_agreed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  privacy_agreed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 선택 동의. NULL = 미동의. 철회하면 다시 NULL 로 되돌린다
  marketing_agreed_at TIMESTAMPTZ,

  last_login_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ,

  CONSTRAINT users_email_lowercase CHECK (email IS NULL OR email = lower(email)),
  CONSTRAINT users_email_shape CHECK (email IS NULL OR email LIKE '%_@_%._%'),
  -- 평문 비밀번호가 들어오면 DB 가 거부한다 (마지막 방어선)
  CONSTRAINT users_password_is_hash
    CHECK (password_hash IS NULL OR password_hash ~ '^\$(2[aby]|argon2(id|i|d))\$'),
  -- 탈퇴 처리는 status 와 deleted_at 이 항상 함께 움직여야 한다
  CONSTRAINT users_withdrawn_needs_time
    CHECK ((status = 'withdrawn') = (deleted_at IS NOT NULL))
);

CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created ON users(created_at DESC);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON COLUMN users.password_hash IS '소셜 전용 계정은 NULL. 로그인 수단이 최소 1개(비밀번호 또는 소셜 연결)는 있어야 한다 — 애플리케이션에서 보장할 것.';
COMMENT ON COLUMN users.marketing_agreed_at IS '마케팅 수신 동의 시각. NULL = 미동의/철회. boolean 으로 바꾸지 말 것.';

-- ── user_social_accounts ───────────────────────────────────────
CREATE TABLE user_social_accounts (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider         VARCHAR(20) NOT NULL
                   CHECK (provider IN ('kakao', 'naver', 'google')),
  provider_user_id VARCHAR(191) NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 같은 소셜 계정이 두 명의 회원에게 붙는 것을 막는다 (계정 탈취 경로)
  CONSTRAINT user_social_unique_provider_account UNIQUE (provider, provider_user_id),
  -- 한 회원이 같은 제공자를 두 번 연결할 수 없다
  CONSTRAINT user_social_unique_per_user UNIQUE (user_id, provider)
);

CREATE INDEX idx_user_social_user ON user_social_accounts(user_id);

CREATE TRIGGER trg_user_social_accounts_updated_at
  BEFORE UPDATE ON user_social_accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── user_addresses ─────────────────────────────────────────────
CREATE TABLE user_addresses (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label      VARCHAR(40),
  recipient  VARCHAR(80) NOT NULL,
  phone      VARCHAR(20) NOT NULL,
  postcode   VARCHAR(10) NOT NULL,
  address1   VARCHAR(255) NOT NULL,
  address2   VARCHAR(255),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_addresses_user ON user_addresses(user_id);

-- 기본 배송지는 회원당 최대 1개
CREATE UNIQUE INDEX uq_user_addresses_default
  ON user_addresses(user_id) WHERE is_default;

CREATE TRIGGER trg_user_addresses_updated_at
  BEFORE UPDATE ON user_addresses FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE user_addresses IS '배송지 원본. 주문서는 이 값을 참조하지 않고 값으로 복사(스냅샷)한다.';

COMMIT;

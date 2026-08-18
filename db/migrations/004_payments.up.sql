-- 004_payments.up.sql
-- WOLYA ARCHIVE 스키마 4단계 — 결제·배송
-- payments, shipments, order_status_histories
--
-- 적용:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/004_payments.up.sql
-- 되돌리기: db/migrations/004_payments.down.sql
--
-- 전제: 003_orders 까지 적용되어 있어야 한다.
--
-- 이 단계의 핵심 원칙
--   1. PG 웹훅은 같은 건이 여러 번 온다 → 거래 ID UNIQUE 로 DB가 중복을 막는다
--   2. 결제 금액은 주문 총액과 반드시 일치한다 → 커밋 시점에 DB가 대조한다
--   3. 주문 상태 변경 이력은 빠뜨릴 수 없다 → 트리거가 자동으로 남긴다

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.orders') IS NULL THEN
    RAISE EXCEPTION '003_orders 를 먼저 적용해야 합니다';
  END IF;
END;
$$;

-- ── payments ───────────────────────────────────────────────────
CREATE TABLE payments (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- 결제 기록은 주문과 함께 지워지면 안 된다 (정산·분쟁 증빙)
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,

  pg_provider VARCHAR(20) NOT NULL
              CHECK (pg_provider IN ('toss', 'portone', 'kakaopay', 'naverpay', 'manual')),

  -- PG사 거래 ID. 승인 전에는 NULL. **웹훅 중복 처리를 막는 핵심 컬럼.**
  pg_transaction_id VARCHAR(191) UNIQUE,

  method VARCHAR(20) NOT NULL
         CHECK (method IN ('card', 'transfer', 'vbank', 'easy_pay', 'phone')),
  status VARCHAR(20) NOT NULL DEFAULT 'ready'
         CHECK (status IN ('ready', 'paid', 'failed', 'cancelled',
                           'partial_refunded', 'refunded')),

  amount          INTEGER NOT NULL CHECK (amount >= 0),
  refunded_amount INTEGER NOT NULL DEFAULT 0 CHECK (refunded_amount >= 0),

  paid_at      TIMESTAMPTZ,
  failed_at    TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  receipt_url  TEXT,

  -- PG 응답 원본. 분쟁 시 근거가 된다.
  raw_response JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 환불액이 결제액을 넘을 수 없다
  CONSTRAINT payments_refund_within_amount CHECK (refunded_amount <= amount),
  -- 결제 완료인데 거래 ID나 결제 시각이 없을 수 없다
  CONSTRAINT payments_paid_needs_proof
    CHECK (status <> 'paid' OR (pg_transaction_id IS NOT NULL AND paid_at IS NOT NULL)),
  -- 전액 환불이면 환불액 = 결제액
  CONSTRAINT payments_full_refund_amount
    CHECK (status <> 'refunded' OR refunded_amount = amount),
  -- 부분 환불이면 0 < 환불액 < 결제액
  CONSTRAINT payments_partial_refund_amount
    CHECK (status <> 'partial_refunded' OR (refunded_amount > 0 AND refunded_amount < amount))
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status, created_at DESC);

-- 한 주문에 결제 완료 기록은 하나뿐이다 (이중 청구 기록 방지)
CREATE UNIQUE INDEX uq_payments_paid_per_order
  ON payments(order_id) WHERE status IN ('paid', 'partial_refunded', 'refunded');

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON COLUMN payments.pg_transaction_id IS
  '웹훅 멱등성의 핵심. 같은 웹훅이 2번 이상 오므로 이 UNIQUE 충돌은 에러가 아니라 "이미 처리됨"으로 200 응답할 것.';
COMMENT ON COLUMN payments.raw_response IS
  '카드번호·CVC·생년월일 등 민감정보는 저장 전에 반드시 제거할 것. PG 응답을 그대로 넣지 말 것.';

-- 결제 금액이 주문 총액과 다르면 커밋을 거부한다.
-- (5만원짜리 주문에 100원 결제 승인이 기록되는 것을 막는다)
CREATE OR REPLACE FUNCTION payments_check_amount_matches_order() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  order_total INTEGER;
BEGIN
  IF NEW.status NOT IN ('paid', 'partial_refunded', 'refunded') THEN
    RETURN NULL;
  END IF;

  SELECT total_amount INTO order_total FROM orders WHERE id = NEW.order_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF NEW.amount <> order_total THEN
    RAISE EXCEPTION '결제 금액 불일치: payments.amount=% 인데 주문 총액=% (order_id=%)',
      NEW.amount, order_total, NEW.order_id;
  END IF;

  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER trg_payments_amount_matches_order
  AFTER INSERT OR UPDATE ON payments
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION payments_check_amount_matches_order();

-- ── shipments ──────────────────────────────────────────────────
CREATE TABLE shipments (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  carrier     VARCHAR(40) NOT NULL,
  tracking_no VARCHAR(64),

  status VARCHAR(20) NOT NULL DEFAULT 'ready'
         CHECK (status IN ('ready', 'shipped', 'in_transit', 'delivered', 'returned')),

  shipped_at   TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 발송했다면 송장번호와 발송 시각이 반드시 있다
  CONSTRAINT shipments_shipped_needs_tracking
    CHECK (status NOT IN ('shipped', 'in_transit', 'delivered')
           OR (tracking_no IS NOT NULL AND shipped_at IS NOT NULL)),
  -- 배송완료와 완료 시각은 함께 움직인다
  CONSTRAINT shipments_delivered_needs_time
    CHECK ((status = 'delivered') = (delivered_at IS NOT NULL))
);

CREATE INDEX idx_shipments_order ON shipments(order_id);
CREATE INDEX idx_shipments_status ON shipments(status);

-- 같은 송장번호를 두 주문에 입력하는 실수를 막는다 (가장 흔한 운영 사고)
CREATE UNIQUE INDEX uq_shipments_tracking
  ON shipments(carrier, tracking_no) WHERE tracking_no IS NOT NULL;

CREATE TRIGGER trg_shipments_updated_at
  BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── order_status_histories ─────────────────────────────────────
CREATE TABLE order_status_histories (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  from_status VARCHAR(20),
  to_status   VARCHAR(20) NOT NULL,

  changed_by VARCHAR(20) NOT NULL DEFAULT 'system'
             CHECK (changed_by IN ('system', 'admin', 'customer', 'pg_webhook')),
  actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reason        VARCHAR(255),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_status_histories_order
  ON order_status_histories(order_id, created_at DESC);

COMMENT ON TABLE order_status_histories IS
  '주문 상태가 바뀌면 트리거가 자동으로 기록한다. 앱에서 따로 INSERT 하지 않아도 되며, 기록을 빠뜨릴 수 없다.';

-- 주문 상태가 바뀌면 이력을 자동으로 남긴다.
-- 앱이 기록을 깜빡해도 이력에 구멍이 생기지 않는다.
CREATE OR REPLACE FUNCTION orders_log_status_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO order_status_histories (order_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status,
            COALESCE(current_setting('wolya.actor', true), 'system'));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_log_status_change
  AFTER UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION orders_log_status_change();

-- 주문 생성 시점의 최초 상태도 기록한다
CREATE OR REPLACE FUNCTION orders_log_initial_status() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO order_status_histories (order_id, from_status, to_status, changed_by)
  VALUES (NEW.id, NULL, NEW.status,
          COALESCE(current_setting('wolya.actor', true), 'system'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_log_initial_status
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION orders_log_initial_status();

COMMENT ON FUNCTION orders_log_status_change() IS
  '누가 바꿨는지 남기려면 트랜잭션 안에서 SET LOCAL wolya.actor = ''admin'' 을 먼저 실행할 것. 미지정 시 system.';

COMMIT;

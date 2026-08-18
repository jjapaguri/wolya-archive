-- 003_orders.up.sql
-- WOLYA ARCHIVE 스키마 3단계 — 주문 내역
-- carts, cart_items, orders, order_items
--
-- 적용:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/003_orders.up.sql
-- 되돌리기: db/migrations/003_orders.down.sql
--
-- 전제: 001_products, 002_users 가 먼저 적용되어 있어야 한다.
--
-- 이 단계의 핵심 결정 (사용자 확정 2026-08-18)
--   **비회원 주문 허용.** 장바구니는 session_key 로, 주문 조회는 주문번호+휴대폰으로.
--
-- 이 단계의 핵심 원칙
--   1. 주문서는 스냅샷 — 상품명·단가·배송지를 참조가 아니라 값으로 복사한다.
--      상품 가격이나 회원 주소가 나중에 바뀌어도 과거 주문서는 그대로여야 한다.
--   2. 금액은 DB가 검산한다 — 합계가 안 맞는 주문은 저장 자체가 안 된다.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.users') IS NULL OR to_regclass('public.product_variants') IS NULL THEN
    RAISE EXCEPTION '001_products 와 002_users 를 먼저 적용해야 합니다';
  END IF;
END;
$$;

-- ── carts ──────────────────────────────────────────────────────
-- 회원 장바구니는 user_id, 비회원 장바구니는 session_key 로 식별한다.
CREATE TABLE carts (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
  session_key VARCHAR(64),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 주인 없는 장바구니는 만들 수 없다
  CONSTRAINT carts_needs_owner CHECK (user_id IS NOT NULL OR session_key IS NOT NULL),
  -- 회원 장바구니가 session_key 를 함께 들고 있으면 병합 로직이 꼬인다
  CONSTRAINT carts_owner_is_exclusive
    CHECK ((user_id IS NULL) <> (session_key IS NULL))
);

-- 회원당 장바구니 1개, 세션당 장바구니 1개
CREATE UNIQUE INDEX uq_carts_user ON carts(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX uq_carts_session ON carts(session_key) WHERE session_key IS NOT NULL;

CREATE TRIGGER trg_carts_updated_at
  BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE carts IS '비회원이 로그인하면 session_key 장바구니의 항목을 회원 장바구니로 옮기고 비회원 장바구니는 삭제한다.';

-- ── cart_items ─────────────────────────────────────────────────
-- 장바구니에는 가격을 저장하지 않는다. 결제 시점의 상품 가격이 진짜다.
CREATE TABLE cart_items (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cart_id    BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 같은 옵션을 두 줄로 담지 않는다 (수량만 올린다)
  CONSTRAINT cart_items_unique_variant UNIQUE (cart_id, variant_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── orders ─────────────────────────────────────────────────────
CREATE TABLE orders (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- 외부 노출 식별자. 순번만 쓰면 남의 주문번호를 유추할 수 있으므로
  -- 날짜 + 무작위 문자열 형태를 강제한다. 예: 20260818-K7M2QP
  order_no VARCHAR(24) NOT NULL UNIQUE,

  -- 비회원 주문은 NULL. 회원이 탈퇴해도 주문 기록은 남아야 하므로 SET NULL.
  user_id  BIGINT REFERENCES users(id) ON DELETE SET NULL,

  -- ── 주문자 스냅샷 ──
  orderer_name  VARCHAR(80) NOT NULL,
  orderer_phone VARCHAR(20) NOT NULL,
  orderer_email VARCHAR(255),

  -- ── 배송지 스냅샷 (user_addresses 를 참조하지 않는다) ──
  recipient       VARCHAR(80) NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  postcode        VARCHAR(10) NOT NULL,
  address1        VARCHAR(255) NOT NULL,
  address2        VARCHAR(255),
  delivery_memo   VARCHAR(255),

  -- ── 금액 (원 단위 정수) ──
  items_amount    INTEGER NOT NULL CHECK (items_amount >= 0),
  shipping_fee    INTEGER NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount    INTEGER NOT NULL CHECK (total_amount >= 0),

  status VARCHAR(20) NOT NULL DEFAULT 'pending'
         CHECK (status IN ('pending', 'paid', 'preparing', 'shipped', 'delivered',
                           'cancelled', 'refunded')),

  paid_at      TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 주문번호 형식: 날짜8자리 - 대문자/숫자 6자 이상
  CONSTRAINT orders_no_format CHECK (order_no ~ '^[0-9]{8}-[A-Z0-9]{6,}$'),
  -- 합계가 안 맞는 주문은 저장할 수 없다
  CONSTRAINT orders_total_matches
    CHECK (total_amount = items_amount + shipping_fee - discount_amount),
  -- 할인이 상품 금액보다 클 수 없다
  CONSTRAINT orders_discount_within_items CHECK (discount_amount <= items_amount),
  -- 결제 이후 상태인데 결제 시각이 없을 수 없다
  CONSTRAINT orders_paid_needs_time
    CHECK (status NOT IN ('paid', 'preparing', 'shipped', 'delivered', 'refunded')
           OR paid_at IS NOT NULL),
  -- 취소 상태와 취소 시각은 함께 움직인다
  CONSTRAINT orders_cancelled_needs_time
    CHECK ((status = 'cancelled') = (cancelled_at IS NOT NULL))
);

CREATE INDEX idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders(status, created_at DESC);
-- 비회원 주문 조회: 주문번호 + 휴대폰
CREATE INDEX idx_orders_guest_lookup ON orders(orderer_phone) WHERE user_id IS NULL;

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON COLUMN orders.order_no IS '무작위 성분을 반드시 포함할 것. 순번 방식이면 주문번호+휴대폰 조합을 유추당한다.';
COMMENT ON COLUMN orders.user_id IS 'NULL = 비회원 주문. 회원 탈퇴 시에도 NULL 이 되며 주문 기록 자체는 보존된다.';

-- ── order_items ────────────────────────────────────────────────
-- 상품이 삭제·수정되어도 주문서 내용은 그대로여야 하므로 이름·단가를 값으로 복사한다.
CREATE TABLE order_items (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- 통계·재입고 문의용 참조. 상품이 지워지면 NULL 이 되지만 아래 스냅샷은 남는다.
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  variant_id BIGINT REFERENCES product_variants(id) ON DELETE SET NULL,

  -- ── 스냅샷 ──
  product_name  VARCHAR(200) NOT NULL,
  variant_label VARCHAR(120),
  unit_price    INTEGER NOT NULL CHECK (unit_price >= 0),
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  line_amount   INTEGER NOT NULL CHECK (line_amount >= 0),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT order_items_line_matches CHECK (line_amount = unit_price * quantity)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

CREATE TRIGGER trg_order_items_updated_at
  BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 주문 금액 검산 (커밋 시점) ─────────────────────────────────
-- orders.items_amount 가 order_items 합계와 다르면 커밋을 거부한다.
-- 주문 헤더와 항목이 여러 INSERT 로 나뉘어 들어오므로 DEFERRED 로 둔다.
CREATE OR REPLACE FUNCTION orders_check_items_total() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  target_order BIGINT;
  header_amount INTEGER;
  items_sum INTEGER;
BEGIN
  target_order := COALESCE(NEW.order_id, OLD.order_id);

  SELECT items_amount INTO header_amount FROM orders WHERE id = target_order;
  IF NOT FOUND THEN
    RETURN NULL;  -- 주문이 함께 삭제된 경우
  END IF;

  SELECT COALESCE(sum(line_amount), 0) INTO items_sum
  FROM order_items WHERE order_id = target_order;

  IF header_amount <> items_sum THEN
    RAISE EXCEPTION '주문 금액 불일치: orders.items_amount=% 인데 order_items 합계=% (order_id=%)',
      header_amount, items_sum, target_order;
  END IF;

  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER trg_order_items_total_matches
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION orders_check_items_total();

COMMIT;

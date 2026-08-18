-- 005_cs.up.sql
-- WOLYA ARCHIVE 스키마 5단계 — 리뷰·FAQ·반품/교환
-- reviews, review_images, inquiries, inquiry_answers, faqs,
-- order_returns, order_return_items
--
-- 적용:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/005_cs.up.sql
-- 되돌리기: db/migrations/005_cs.down.sql
--
-- 전제: 004_payments 까지 적용되어 있어야 한다.
--
-- 이 단계의 핵심 결정 (사용자 확정 2026-08-18)
--   **반품/교환은 주문 상태가 아니라 별도 테이블로 관리한다.**
--   사유·수거송장·부분반품·배송비 부담 주체를 남겨야 매입 판단과 분쟁 대응에 쓸 수 있다.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.payments') IS NULL THEN
    RAISE EXCEPTION '004_payments 를 먼저 적용해야 합니다';
  END IF;
END;
$$;

-- ── reviews ────────────────────────────────────────────────────
-- order_item_id UNIQUE = 산 사람만, 산 것에 대해, 한 번만 쓸 수 있다.
CREATE TABLE reviews (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_item_id BIGINT NOT NULL UNIQUE REFERENCES order_items(id) ON DELETE CASCADE,

  -- 비회원도 주문할 수 있으므로 NULL 허용. 회원 탈퇴 시에도 리뷰는 남는다.
  user_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,

  rating  SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT NOT NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'visible'
         CHECK (status IN ('visible', 'hidden', 'reported')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  -- 한 글자짜리 도배 리뷰 방지
  CONSTRAINT reviews_content_length CHECK (char_length(btrim(content)) >= 5)
);

CREATE INDEX idx_reviews_product ON reviews(product_id, created_at DESC)
  WHERE deleted_at IS NULL AND status = 'visible';
CREATE INDEX idx_reviews_user ON reviews(user_id);

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 결제되지 않은 주문에는 리뷰를 쓸 수 없다 (가짜 리뷰 차단)
CREATE OR REPLACE FUNCTION reviews_require_paid_order() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  order_status VARCHAR(20);
BEGIN
  SELECT o.status INTO order_status
  FROM order_items oi JOIN orders o ON o.id = oi.order_id
  WHERE oi.id = NEW.order_item_id;

  IF order_status IS NULL THEN
    RAISE EXCEPTION '존재하지 않는 주문 항목입니다 (order_item_id=%)', NEW.order_item_id;
  END IF;

  IF order_status NOT IN ('paid', 'preparing', 'shipped', 'delivered') THEN
    RAISE EXCEPTION '결제 완료된 주문만 리뷰를 쓸 수 있습니다 (현재 주문 상태=%)', order_status;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reviews_require_paid_order
  BEFORE INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION reviews_require_paid_order();

COMMENT ON COLUMN reviews.order_item_id IS
  'UNIQUE 이자 NOT NULL. 구매 인증과 "1주문항목 1리뷰"를 동시에 강제한다. 이 컬럼을 nullable 로 바꾸면 리뷰 조작이 열린다.';

-- ── review_images ──────────────────────────────────────────────
CREATE TABLE review_images (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  review_id  BIGINT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_images_review ON review_images(review_id, sort_order);

-- ── inquiries ──────────────────────────────────────────────────
CREATE TABLE inquiries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  user_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
  order_id   BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,

  -- 비회원 문의용 연락처
  guest_name  VARCHAR(80),
  guest_phone VARCHAR(20),

  type VARCHAR(20) NOT NULL
       CHECK (type IN ('product', 'order', 'delivery', 'return', 'etc')),

  title   VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,

  -- 기본은 비공개. 공개 문의는 명시적으로 false 로 바꿔야 한다.
  is_private BOOLEAN NOT NULL DEFAULT true,

  status VARCHAR(20) NOT NULL DEFAULT 'open'
         CHECK (status IN ('open', 'answered', 'closed')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  -- 답변을 보낼 방법이 없는 문의는 받지 않는다
  CONSTRAINT inquiries_needs_contact
    CHECK (user_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_phone IS NOT NULL))
);

CREATE INDEX idx_inquiries_status ON inquiries(status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_inquiries_user ON inquiries(user_id);
CREATE INDEX idx_inquiries_product ON inquiries(product_id);

CREATE TRIGGER trg_inquiries_updated_at
  BEFORE UPDATE ON inquiries FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── inquiry_answers ────────────────────────────────────────────
CREATE TABLE inquiry_answers (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  inquiry_id    BIGINT NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  admin_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inquiry_answers_inquiry ON inquiry_answers(inquiry_id, created_at);

CREATE TRIGGER trg_inquiry_answers_updated_at
  BEFORE UPDATE ON inquiry_answers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 답변이 달리면 문의 상태를 자동으로 answered 로 바꾼다.
-- "미답변 문의 수" 집계가 앱의 실수로 틀어지는 것을 막는다.
CREATE OR REPLACE FUNCTION inquiries_mark_answered() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE inquiries SET status = 'answered'
  WHERE id = NEW.inquiry_id AND status = 'open';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_inquiry_answers_mark_answered
  AFTER INSERT ON inquiry_answers
  FOR EACH ROW EXECUTE FUNCTION inquiries_mark_answered();

-- ── faqs ───────────────────────────────────────────────────────
CREATE TABLE faqs (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category     VARCHAR(40) NOT NULL,
  question     VARCHAR(300) NOT NULL,
  answer       TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_faqs_published ON faqs(category, sort_order) WHERE is_published;

CREATE TRIGGER trg_faqs_updated_at
  BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── order_returns (반품/교환 — 별도 관리) ──────────────────────
CREATE TABLE order_returns (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- 주문번호와 같은 형식 규칙 (무작위 성분 필수)
  return_no VARCHAR(24) NOT NULL UNIQUE,

  -- 반품 기록은 주문과 함께 지워지면 안 된다
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,

  type VARCHAR(20) NOT NULL CHECK (type IN ('return', 'exchange')),

  reason_code VARCHAR(30) NOT NULL
    CHECK (reason_code IN ('change_of_mind', 'defect', 'wrong_item',
                           'size_mismatch', 'delayed', 'etc')),
  reason_detail TEXT,

  status VARCHAR(20) NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'approved', 'rejected',
                      'picked_up', 'completed', 'cancelled')),

  -- 전자상거래법: 하자·오배송은 판매자 부담, 단순 변심은 소비자 부담
  shipping_fee_bearer VARCHAR(10) NOT NULL DEFAULT 'customer'
    CHECK (shipping_fee_bearer IN ('customer', 'shop')),

  refund_amount      INTEGER CHECK (refund_amount >= 0),
  pickup_carrier     VARCHAR(40),
  pickup_tracking_no VARCHAR(64),

  requested_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at     TIMESTAMPTZ,
  rejected_at     TIMESTAMPTZ,
  rejected_reason VARCHAR(255),
  completed_at    TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT order_returns_no_format CHECK (return_no ~ '^[0-9]{8}-[A-Z0-9]{6,}$'),
  -- 하자·오배송의 왕복 배송비를 고객에게 물릴 수 없다
  CONSTRAINT order_returns_defect_shop_pays
    CHECK (reason_code NOT IN ('defect', 'wrong_item') OR shipping_fee_bearer = 'shop'),
  -- 거절했다면 사유와 시각이 반드시 있다
  CONSTRAINT order_returns_rejected_needs_reason
    CHECK ((status = 'rejected') = (rejected_at IS NOT NULL AND rejected_reason IS NOT NULL)),
  -- 완료 상태와 완료 시각은 함께 움직인다
  CONSTRAINT order_returns_completed_needs_time
    CHECK ((status = 'completed') = (completed_at IS NOT NULL)),
  -- 수거 이후 단계면 수거 송장이 있어야 한다
  CONSTRAINT order_returns_pickup_needs_tracking
    CHECK (status NOT IN ('picked_up', 'completed') OR pickup_tracking_no IS NOT NULL)
);

CREATE INDEX idx_order_returns_order ON order_returns(order_id);
CREATE INDEX idx_order_returns_status ON order_returns(status, requested_at DESC);

CREATE TRIGGER trg_order_returns_updated_at
  BEFORE UPDATE ON order_returns FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE order_returns IS
  '반품/교환은 주문 상태로만 처리하지 않는다. 사유·부담주체·수거송장을 남겨야 분쟁 대응과 매입 판단(어떤 옷이 왜 반품되는가)에 쓸 수 있다.';

-- ── order_return_items (부분 반품) ─────────────────────────────
CREATE TABLE order_return_items (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  return_id     BIGINT NOT NULL REFERENCES order_returns(id) ON DELETE CASCADE,
  order_item_id BIGINT NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT order_return_items_unique UNIQUE (return_id, order_item_id)
);

CREATE INDEX idx_order_return_items_return ON order_return_items(return_id);

-- 주문한 수량보다 많이 반품할 수 없다
CREATE OR REPLACE FUNCTION order_return_items_check_quantity() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  ordered_qty INTEGER;
  return_order BIGINT;
  item_order BIGINT;
BEGIN
  SELECT quantity, order_id INTO ordered_qty, item_order
  FROM order_items WHERE id = NEW.order_item_id;

  IF NEW.quantity > ordered_qty THEN
    RAISE EXCEPTION '반품 수량(%)이 주문 수량(%)을 초과합니다', NEW.quantity, ordered_qty;
  END IF;

  -- 다른 주문의 항목을 이 반품에 붙일 수 없다
  SELECT order_id INTO return_order FROM order_returns WHERE id = NEW.return_id;
  IF return_order IS DISTINCT FROM item_order THEN
    RAISE EXCEPTION '반품 대상 주문(%)과 항목이 속한 주문(%)이 다릅니다', return_order, item_order;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_return_items_check_quantity
  BEFORE INSERT OR UPDATE ON order_return_items
  FOR EACH ROW EXECUTE FUNCTION order_return_items_check_quantity();

COMMIT;

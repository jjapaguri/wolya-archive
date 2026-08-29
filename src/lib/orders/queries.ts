/**
 * 주문·장바구니 SQL 모음.
 *
 * **이 파일은 `pg` 를 import 하지 않는다.** `src/lib/product-queries.ts` 와 같은 이유다 —
 * 드라이버 없이 SQL 만 따로 읽고 검증할 수 있어야 한다. 커넥션을 쓰는 쪽은
 * `cart.ts` · `checkout.ts` · `lookup.ts`.
 *
 * **전부 파라미터 바인딩이다.** 문자열 결합으로 SQL 을 만들지 않는다 (불변규칙 6).
 * 목록 조건이 필요하면 `= ANY($1)` 을 쓴다 — IN 절을 문자열로 만들지 않는다.
 */

// ── 장바구니 ────────────────────────────────────────────────────

/**
 * 세션 장바구니를 찾거나 만든다.
 *
 * `uq_carts_session` 은 `WHERE session_key IS NOT NULL` 부분 유니크 인덱스라
 * ON CONFLICT 추론에도 같은 WHERE 를 적어 줘야 인덱스가 잡힌다.
 * DO NOTHING 이 아니라 DO UPDATE 인 이유: DO NOTHING 은 충돌 시 RETURNING 이 비어
 * 한 번 더 SELECT 해야 한다.
 */
export const SQL_UPSERT_SESSION_CART = `
  INSERT INTO carts (session_key)
  VALUES ($1)
  ON CONFLICT (session_key) WHERE session_key IS NOT NULL
  DO UPDATE SET updated_at = now()
  RETURNING id
`;

export const SQL_FIND_SESSION_CART = `
  SELECT id FROM carts WHERE session_key = $1
`;

/**
 * slug 로 주문 가능한 옵션(변형)을 전부 가져온다.
 *
 * 가격은 **DB 가 정본**이다 — 클라이언트가 보낸 금액은 어디에서도 쓰지 않는다(불변규칙 2).
 * 단가 = COALESCE(sale_price, base_price) + variants.additional_price.
 */
export const SQL_VARIANTS_BY_SLUG = `
  SELECT
    v.id                                   AS variant_id,
    v.size,
    v.color,
    v.stock_quantity,
    p.id                                   AS product_id,
    p.slug,
    p.name,
    p.status                               AS product_status,
    p.is_preorder,
    COALESCE(p.sale_price, p.base_price) + v.additional_price AS unit_price,
    b.name                                 AS brand
  FROM products p
  JOIN product_variants v ON v.product_id = p.id
  LEFT JOIN brands b ON b.id = p.brand_id
  WHERE p.slug = $1
    AND p.deleted_at IS NULL
    AND p.status IN ('published', 'sold_out')
  ORDER BY v.id
`;

/**
 * 장바구니에 담기. 같은 옵션을 두 줄로 만들지 않고 수량만 올린다
 * (`cart_items_unique_variant`). 상한($3)은 **서버가 재고·정책으로 계산한 값**이다.
 */
export const SQL_UPSERT_CART_ITEM = `
  INSERT INTO cart_items (cart_id, variant_id, quantity)
  VALUES ($1, $2, LEAST($3::int, $4::int))
  ON CONFLICT (cart_id, variant_id)
  DO UPDATE SET quantity = LEAST(cart_items.quantity + $3::int, $4::int), updated_at = now()
  RETURNING id, quantity
`;

/**
 * 장바구니 줄 — **가격은 담을 때가 아니라 지금 값**이다 (003 주석: 장바구니에 가격을 저장하지 않는다).
 * 담아둔 사이 팔렸거나 내려간 항목도 같이 가져온다. 거르는 판단은 앱이 한다
 * (화면에 "품절되었습니다" 로 보여줘야 하므로 쿼리에서 지우면 안 된다).
 */
export const SQL_CART_LINES = `
  SELECT
    ci.id,
    ci.variant_id,
    ci.quantity,
    v.size,
    v.color,
    v.stock_quantity,
    p.id                                   AS product_id,
    p.slug,
    p.name,
    p.status                               AS product_status,
    p.deleted_at,
    p.is_preorder,
    COALESCE(p.sale_price, p.base_price) + v.additional_price AS unit_price,
    b.name                                 AS brand,
    img.url                                AS image
  FROM cart_items ci
  JOIN product_variants v ON v.id = ci.variant_id
  JOIN products p         ON p.id = v.product_id
  LEFT JOIN brands b      ON b.id = p.brand_id
  LEFT JOIN LATERAL (
    SELECT pi.url
    FROM product_images pi
    WHERE pi.product_id = p.id
    ORDER BY pi.is_primary DESC, pi.sort_order, pi.id
    LIMIT 1
  ) img ON TRUE
  WHERE ci.cart_id = $1
  ORDER BY ci.id
`;

/** 수량 변경. `cart_id` 를 함께 걸어 남의 장바구니 줄을 건드릴 수 없게 한다. */
export const SQL_UPDATE_CART_ITEM_QTY = `
  UPDATE cart_items SET quantity = $3, updated_at = now()
  WHERE id = $1 AND cart_id = $2
`;

/** 줄 삭제. 위와 같은 이유로 `cart_id` 를 함께 건다. */
export const SQL_DELETE_CART_ITEM = `
  DELETE FROM cart_items WHERE id = $1 AND cart_id = $2
`;

export const SQL_CLEAR_CART = `
  DELETE FROM cart_items WHERE cart_id = $1
`;

/** 회원 장바구니를 찾거나 만든다. 로그인 병합 경로에서만 쓴다 (`SQL_UPSERT_SESSION_CART` 와 짝). */
export const SQL_UPSERT_USER_CART = `
  INSERT INTO carts (user_id)
  VALUES ($1)
  ON CONFLICT (user_id) WHERE user_id IS NOT NULL
  DO UPDATE SET updated_at = now()
  RETURNING id
`;

/**
 * 세션 장바구니 줄을 회원 장바구니로 옮긴다. 겹치는 옵션은 수량을 더하되 상한을 넘지 않는다.
 * 재고 상한은 여기서 다시 계산하지 않는다 — 결제 시점에 DB 가 다시 검증한다 (불변규칙 2).
 */
export const SQL_MERGE_CART_ITEMS = `
  INSERT INTO cart_items (cart_id, variant_id, quantity)
  SELECT $2, variant_id, LEAST(quantity, $3::int)
  FROM cart_items
  WHERE cart_id = $1
  ON CONFLICT (cart_id, variant_id)
  DO UPDATE SET quantity = LEAST(cart_items.quantity + excluded.quantity, $3::int), updated_at = now()
`;

/** 병합 후 빈 세션 장바구니를 지운다. `cart_items` 는 FK CASCADE 로 같이 지워진다. */
export const SQL_DELETE_CART = `
  DELETE FROM carts WHERE id = $1
`;

// ── 주문 ────────────────────────────────────────────────────────

/**
 * **재고 차감 — 조건부 UPDATE 한 방** (AGENTS.md 불변규칙 3).
 *
 * 조회해서 계산한 뒤 덮어쓰면 동시 주문에서 재고가 음수가 된다.
 * 영향 행이 0이면 그 사이 팔린 것이므로 주문 전체를 롤백한다.
 */
export const SQL_DEDUCT_STOCK = `
  UPDATE product_variants
     SET stock_quantity = stock_quantity - $2
   WHERE id = $1 AND stock_quantity >= $2
`;

/**
 * 예약주문 중복 예약 확인.
 *
 * 예약주문 상품은 재고가 0이라 조건부 UPDATE 로 자리를 잡을 수 없다. 그런데 단벌이라
 * 사입에 성공해도 하나뿐이다. 그래서 "살아 있는 주문이 이미 이 옵션을 예약했는가" 를 본다.
 * 이 SELECT 만으로는 동시 요청을 못 막으므로 **호출 쪽이 먼저 `pg_advisory_xact_lock`
 * 을 잡는다** (`checkout.ts`).
 */
export const SQL_PREORDER_ALREADY_RESERVED = `
  SELECT oi.variant_id
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE oi.is_preorder
    AND oi.variant_id = ANY($1::bigint[])
    AND o.status NOT IN ('cancelled', 'refunded')
  GROUP BY oi.variant_id
`;

export const SQL_INSERT_ORDER = `
  INSERT INTO orders (
    order_no, user_id,
    orderer_name, orderer_phone, orderer_email,
    recipient, recipient_phone, postcode, address1, address2, delivery_memo,
    items_amount, shipping_fee, discount_amount, total_amount,
    status, terms_agreed_at, privacy_agreed_at
  ) VALUES (
    $1, NULL,
    $2, $3, $4,
    $5, $6, $7, $8, $9, $10,
    $11, $12, $13, $14,
    'pending', now(), now()
  )
  RETURNING id, created_at
`;

/** 주문 항목 — 전부 스냅샷이다. 상품이 바뀌어도 주문서는 그대로여야 한다 (불변규칙 4). */
export const SQL_INSERT_ORDER_ITEM = `
  INSERT INTO order_items (
    order_id, product_id, variant_id,
    product_name, variant_label, unit_price, quantity, line_amount, is_preorder
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
`;

export const SQL_INSERT_PAYMENT = `
  INSERT INTO payments (
    order_id, pg_provider, pg_transaction_id, method, status, amount,
    deposit_name, deposit_due_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
`;

// ── 주문 조회 ───────────────────────────────────────────────────

/**
 * 비회원 주문 조회 — **주문번호 + 휴대폰번호** 두 개가 모두 맞아야 한다.
 *
 * 휴대폰은 저장 형태가 제각각일 수 있어 양쪽에서 숫자만 남겨 비교한다.
 * 주문자 번호와 수령인 번호 중 하나만 맞아도 통과시키지 않는다 —
 * 조회 기준은 **주문자**다.
 */
export const SQL_ORDER_BY_NO_AND_PHONE = `
  SELECT
    o.id, o.order_no, o.status, o.created_at,
    o.orderer_name, o.orderer_phone, o.orderer_email,
    o.recipient, o.recipient_phone, o.postcode, o.address1, o.address2, o.delivery_memo,
    o.items_amount, o.shipping_fee, o.discount_amount, o.total_amount
  FROM orders o
  WHERE o.order_no = $1
    AND regexp_replace(o.orderer_phone, '[^0-9]', '', 'g') = $2
  LIMIT 1
`;

/**
 * 주문번호만으로 한 건. **이것만으로 화면에 그리지 않는다.**
 * 주문 완료 직후 화면이 쿠키에 담아 둔 휴대폰 해시와 대조하는 용도라,
 * 호출 쪽이 반드시 본인 확인을 한 뒤에 쓴다 (`lookup.ts`).
 */
export const SQL_ORDER_BY_NO = `
  SELECT
    o.id, o.order_no, o.status, o.created_at,
    o.orderer_name, o.orderer_phone, o.orderer_email,
    o.recipient, o.recipient_phone, o.postcode, o.address1, o.address2, o.delivery_memo,
    o.items_amount, o.shipping_fee, o.discount_amount, o.total_amount
  FROM orders o
  WHERE o.order_no = $1
  LIMIT 1
`;

export const SQL_ORDER_ITEMS = `
  SELECT
    oi.product_name, oi.variant_label, oi.unit_price, oi.quantity, oi.line_amount,
    oi.is_preorder, p.slug
  FROM order_items oi
  LEFT JOIN products p ON p.id = oi.product_id AND p.deleted_at IS NULL
  WHERE oi.order_id = $1
  ORDER BY oi.id
`;

/** 결제 기록. 무통장은 주문당 1건이라 최신 1건만 본다. */
export const SQL_ORDER_PAYMENT = `
  SELECT pg_provider, method, status, amount, deposit_name, deposit_due_at
  FROM payments
  WHERE order_id = $1
  ORDER BY id DESC
  LIMIT 1
`;

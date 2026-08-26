/**
 * 장바구니 — 비회원 세션 키로 도는 서버 전용 계층.
 *
 * **서버 전용이다.** `@/lib/db` 를 거쳐 `pg` 를 끌어오므로 "use client" 컴포넌트에서
 * import 하면 빌드가 깨진다. 화면은 서버 컴포넌트가 `await` 한 결과를 props 로 받는다.
 * (`src/lib/products.ts` 와 같은 규칙)
 *
 * ── DB 가 없을 때 ─────────────────────────────────────────────────
 * 상품 조회 계층에는 원장 폴백이 있지만 **장바구니에는 폴백이 없다.** 장바구니 줄은
 * `product_variants.id` 를 가리키는데 원장에는 그런 것이 없기 때문이다.
 * 그래서 `DATABASE_URL` 이 없거나 조회가 실패하면 `unavailable: true` 인 빈 장바구니를
 * 돌려주고, 화면은 "지금은 장바구니를 쓸 수 없다" 를 그린다. **던지지 않는다** —
 * DB 없이도 빌드가 통과해야 하고, 운영에서 DB 가 잠깐 흔들려도 500 대신 안내가 떠야 한다.
 */
import { isDatabaseConfigured, query } from "@/lib/db";
import {
  SQL_CART_LINES,
  SQL_DELETE_CART_ITEM,
  SQL_FIND_SESSION_CART,
  SQL_UPDATE_CART_ITEM_QTY,
  SQL_UPSERT_CART_ITEM,
  SQL_UPSERT_SESSION_CART,
  SQL_VARIANTS_BY_SLUG,
} from "@/lib/orders/queries";
import {
  EMPTY_CART,
  MAX_LINE_QUANTITY,
  calcShippingFee,
  type CartLine,
  type CartSummary,
  type PurchaseOption,
} from "@/lib/orders/shared";
import { readSessionKey } from "@/lib/orders/session";

/** 숫자 컬럼을 드라이버가 문자열로 줄 수 있다 (bigint·numeric). 넓게 받고 좁혀 쓴다. */
type Num = number | string;

export type CartLineRow = {
  id: Num;
  variant_id: Num;
  quantity: Num;
  size: string | null;
  color: string | null;
  stock_quantity: Num;
  product_id: Num;
  slug: string;
  name: string;
  product_status: string;
  deleted_at: Date | null;
  is_preorder: boolean | null;
  unit_price: Num;
  brand: string | null;
  image: string | null;
};

export type VariantRow = {
  variant_id: Num;
  size: string | null;
  color: string | null;
  stock_quantity: Num;
  product_id: Num;
  slug: string;
  name: string;
  product_status: string;
  is_preorder: boolean | null;
  unit_price: Num;
  brand: string | null;
};

function n(value: Num | null | undefined): number {
  return Number(value ?? 0);
}

/**
 * 사이즈·색상을 한 줄로. 단벌이라 대개 사이즈만 의미가 있다.
 *
 * 시드는 색상이 없는 상품에 `-` 를 넣어 두었다(`color` 는 NOT NULL 이다).
 * 그대로 이으면 "L / -" 이 되어 주문서 스냅샷에까지 남으므로 자리표시자는 버린다.
 */
const PLACEHOLDER_OPTION = /^[-–—]*$/;

export function variantLabel(size: string | null, color: string | null): string {
  const parts = [size?.trim(), color?.trim()].filter(
    (value): value is string => Boolean(value) && !PLACEHOLDER_OPTION.test(value as string)
  );
  return parts.join(" / ");
}

/**
 * 행 → 장바구니 줄. **checkout.ts 도 이 함수를 쓴다.**
 * 매퍼가 두 벌이 되면 화면에 보이던 금액과 주문에 기록되는 금액이 언젠가 갈라진다.
 */
export function toCartLine(row: CartLineRow): CartLine {
  const isPreorder = row.is_preorder === true;
  const stock = n(row.stock_quantity);
  const quantity = n(row.quantity);
  const unitPrice = n(row.unit_price);

  // 담아둔 사이 상품이 내려갔거나(삭제·비공개) 팔린 경우를 여기서 판정한다.
  // 예약주문은 재고 0 이 정상이라 재고로 막지 않는다.
  let unavailableReason: CartLine["unavailableReason"] = null;
  if (row.deleted_at || !["published", "sold_out"].includes(row.product_status)) {
    unavailableReason = "unpublished";
  } else if (row.product_status === "sold_out" || (!isPreorder && stock < quantity)) {
    unavailableReason = "sold_out";
  }

  return {
    id: n(row.id),
    variantId: n(row.variant_id),
    productId: n(row.product_id),
    slug: row.slug,
    name: row.name,
    brand: row.brand ?? "",
    variantLabel: variantLabel(row.size, row.color),
    image: row.image ?? "",
    unitPrice,
    quantity,
    lineAmount: unitPrice * quantity,
    isPreorder,
    stockQuantity: stock,
    unavailableReason,
  };
}

/**
 * 줄 목록 → 요약. **금액은 주문 가능한 줄만 더한다.**
 * 품절된 줄까지 합계에 넣으면 화면 금액과 실제 결제 금액이 달라진다.
 */
export function summarize(lines: CartLine[]): CartSummary {
  const orderable = lines.filter((line) => line.unavailableReason === null);
  const itemsAmount = orderable.reduce((sum, line) => sum + line.lineAmount, 0);
  const shippingFee = calcShippingFee(itemsAmount);
  return {
    lines,
    itemsAmount,
    shippingFee,
    totalAmount: itemsAmount + shippingFee,
    hasBlockedLine: lines.some((line) => line.unavailableReason !== null),
    hasPreorder: orderable.some((line) => line.isPreorder),
    unavailable: false,
  };
}

/** 세션 장바구니 id. 없으면 null — **만들지 않는다**(읽기 경로에서 행을 만들지 않기 위해). */
async function findCartId(sessionKey: string): Promise<number | null> {
  const rows = await query<{ id: Num }>(SQL_FIND_SESSION_CART, [sessionKey]);
  return rows.length > 0 ? n(rows[0].id) : null;
}

/** 세션 장바구니를 찾거나 만든다. 담기 경로에서만 쓴다. */
export async function ensureCartId(sessionKey: string): Promise<number> {
  const rows = await query<{ id: Num }>(SQL_UPSERT_SESSION_CART, [sessionKey]);
  return n(rows[0].id);
}

export async function readCartLines(cartId: number): Promise<CartLine[]> {
  const rows = await query<CartLineRow>(SQL_CART_LINES, [cartId]);
  return rows.map(toCartLine);
}

/**
 * 지금 요청의 장바구니. 쿠키가 없으면 빈 장바구니다.
 * 어떤 이유로도 던지지 않는다 — 위 "DB 가 없을 때" 참고.
 */
export async function getCartSummary(): Promise<CartSummary> {
  if (!isDatabaseConfigured()) return { ...EMPTY_CART, unavailable: true };

  const sessionKey = await readSessionKey();
  if (!sessionKey) return EMPTY_CART;

  try {
    const cartId = await findCartId(sessionKey);
    if (cartId === null) return EMPTY_CART;
    return summarize(await readCartLines(cartId));
  } catch (error) {
    // DATABASE_URL 값이 섞여 나가지 않도록 메시지만 찍는다 (불변규칙 6).
    console.error(
      "[cart] 장바구니 조회 실패:",
      error instanceof Error ? error.message : String(error)
    );
    return { ...EMPTY_CART, unavailable: true };
  }
}

/**
 * 상세페이지가 그릴 옵션 목록.
 *
 * `null` = 장바구니를 쓸 수 없는 상태(DB 없음·조회 실패·DB 에 그 상품이 없음).
 * 그때 상세페이지는 **지금까지와 똑같이** 카카오톡 구매 문의만 그린다.
 * (원장 폴백으로 화면이 도는 동안에는 담을 수 있는 재고 행 자체가 없다)
 */
export async function listPurchaseOptions(slug: string): Promise<PurchaseOption[] | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const rows = await query<VariantRow>(SQL_VARIANTS_BY_SLUG, [slug]);
    if (rows.length === 0) return null;
    return rows.map((row) => {
      const isPreorder = row.is_preorder === true;
      const stock = n(row.stock_quantity);
      return {
        variantId: n(row.variant_id),
        label: variantLabel(row.size, row.color),
        stockQuantity: stock,
        isPreorder,
        orderable: row.product_status === "published" && (isPreorder || stock > 0),
      };
    });
  } catch (error) {
    console.error(
      "[cart] 옵션 조회 실패:",
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

export type AddToCartResult =
  | { ok: true; summary: CartSummary }
  | { ok: false; reason: "not_found" | "sold_out" | "needs_option" | "unavailable" };

/**
 * 장바구니에 담기.
 *
 * **클라이언트가 보낸 것은 slug · variantId · 수량뿐이다.** 가격·재고·예약주문 여부는
 * 전부 여기서 DB 를 다시 읽어 판단한다 (불변규칙 2).
 * variantId 가 와도 그 slug 의 옵션인지 대조한다 — 남의 상품 옵션을 끼워 넣지 못한다.
 */
export async function addToCart(
  sessionKey: string,
  slug: string,
  variantId: number | null,
  quantity: number
): Promise<AddToCartResult> {
  if (!isDatabaseConfigured()) return { ok: false, reason: "unavailable" };

  const wanted = Math.min(Math.max(Math.trunc(quantity) || 1, 1), MAX_LINE_QUANTITY);

  const rows = await query<VariantRow>(SQL_VARIANTS_BY_SLUG, [slug]);
  if (rows.length === 0) return { ok: false, reason: "not_found" };

  const variant =
    variantId === null
      ? rows.length === 1
        ? rows[0]
        : null
      : (rows.find((row) => n(row.variant_id) === variantId) ?? null);

  // 옵션이 여럿인데 무엇을 담을지 안 왔다 — 화면이 고르게 해야 한다.
  if (!variant) return { ok: false, reason: variantId === null ? "needs_option" : "not_found" };

  const isPreorder = variant.is_preorder === true;
  const stock = n(variant.stock_quantity);
  if (variant.product_status !== "published") return { ok: false, reason: "sold_out" };
  if (!isPreorder && stock <= 0) return { ok: false, reason: "sold_out" };

  // 예약주문은 아직 물건이 없으므로 1개까지만. 나머지는 재고를 넘겨 담지 못한다.
  const maxQuantity = isPreorder ? 1 : Math.min(stock, MAX_LINE_QUANTITY);

  const cartId = await ensureCartId(sessionKey);
  await query(SQL_UPSERT_CART_ITEM, [cartId, n(variant.variant_id), wanted, maxQuantity]);

  return { ok: true, summary: summarize(await readCartLines(cartId)) };
}

/** 수량 변경. 0 이하면 줄을 지운다. */
export async function updateCartQuantity(
  sessionKey: string,
  itemId: number,
  quantity: number
): Promise<CartSummary | null> {
  if (!isDatabaseConfigured()) return null;
  const cartId = await findCartId(sessionKey);
  if (cartId === null) return null;

  const lines = await readCartLines(cartId);
  const line = lines.find((item) => item.id === itemId);
  if (!line) return summarize(lines);

  const next = Math.trunc(quantity);
  if (next <= 0) {
    await query(SQL_DELETE_CART_ITEM, [itemId, cartId]);
  } else {
    // 재고·예약주문 상한은 여기서도 서버가 정한다. 화면이 보낸 수량을 그대로 믿지 않는다.
    const max = line.isPreorder ? 1 : Math.min(line.stockQuantity, MAX_LINE_QUANTITY);
    await query(SQL_UPDATE_CART_ITEM_QTY, [itemId, cartId, Math.max(1, Math.min(next, max))]);
  }
  return summarize(await readCartLines(cartId));
}

export async function removeCartItem(
  sessionKey: string,
  itemId: number
): Promise<CartSummary | null> {
  if (!isDatabaseConfigured()) return null;
  const cartId = await findCartId(sessionKey);
  if (cartId === null) return null;
  await query(SQL_DELETE_CART_ITEM, [itemId, cartId]);
  return summarize(await readCartLines(cartId));
}

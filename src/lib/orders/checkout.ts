/**
 * 주문 생성 — 이 파일이 이번 작업의 심장이다.
 *
 * 한 트랜잭션 안에서 다섯 가지가 **전부 성공하거나 전부 없어야** 한다:
 *   1. 금액 재계산 (DB 가격 기준)
 *   2. 예약주문 자리 확보 (자문 잠금)
 *   3. 재고 차감 (조건부 UPDATE 한 방)
 *   4. 주문서 + 주문항목 기록 (전부 스냅샷)
 *   5. 결제 기록 생성 (결제 수단 추상화가 만든 값)
 * 그리고 장바구니를 비운다.
 *
 * ── 지켜야 하는 것 (AGENTS.md 2절) ────────────────────────────────
 * - **금액은 서버가 다시 계산한다.** 클라이언트가 보낸 금액은 `expectedTotal` 로만 받아
 *   "화면에 보이던 값과 지금 값이 다른가" 를 판정하는 데 쓰고, 저장하지 않는다.
 *   다르면 주문을 세우지 않고 되돌려 보낸다 — 가격이 바뀐 걸 모르고 결제하는 일이 없도록.
 * - **재고 차감은 조건부 UPDATE 한 방.** 조회 후 덮어쓰기는 동시 주문에서 음수를 만든다.
 *   영향 행 0 = 그 사이 팔림 → 트랜잭션 전체를 롤백한다.
 * - **주문서는 스냅샷.** 상품명·옵션·단가·배송지를 값으로 복사한다.
 * - **동의는 시각.** `terms_agreed_at` / `privacy_agreed_at` 을 서버 시각으로 넣는다.
 * - **SQL 은 파라미터 바인딩만.**
 *
 * ── 예약주문(무재고) 처리 ─────────────────────────────────────────
 * 지금 카탈로그는 선주문 후 사입이라 예약주문 상품의 `stock_quantity` 가 0이다.
 * 재고 0을 무조건 품절로 막으면 팔 물건이 3개밖에 남지 않는다. 그래서 예약주문 항목은
 * **재고 차감을 건너뛴다.** 대신 단벌이라 둘이 동시에 예약하면 하나는 반드시 취소되므로,
 * `pg_advisory_xact_lock` 으로 옵션별 자리를 잡고 살아 있는 주문이 이미 예약했는지 본다.
 * 조건부 UPDATE 가 재고에 대해 하는 일을, 재고가 없는 항목에 대해 잠금으로 하는 셈이다.
 */
import { isDatabaseConfigured, withTransaction } from "@/lib/db";
import {
  SQL_CART_LINES,
  SQL_CLEAR_CART,
  SQL_DEDUCT_STOCK,
  SQL_FIND_SESSION_CART,
  SQL_INSERT_ORDER,
  SQL_INSERT_ORDER_ITEM,
  SQL_INSERT_PAYMENT,
  SQL_PREORDER_ALREADY_RESERVED,
} from "@/lib/orders/queries";
import { summarize, toCartLine, type CartLineRow } from "@/lib/orders/cart";
import { newOrderNo } from "@/lib/orders/order-no";
import {
  calcShippingFee,
  hasErrors,
  normalizePhone,
  validateCheckout,
  type CheckoutErrors,
  type CheckoutInput,
} from "@/lib/orders/shared";
import { getPaymentProvider, type PaymentProviderId } from "@/lib/payment/provider";

/**
 * 예약주문 자리 잠금의 네임스페이스.
 *
 * `pg_advisory_xact_lock(int, int)` 은 (네임스페이스, 키) 두 정수로 잠근다.
 * 다른 기능이 우연히 같은 키를 잡지 않도록 이 상수를 고정해 둔다.
 * 트랜잭션이 끝나면(커밋이든 롤백이든) 자동으로 풀린다.
 */
const PREORDER_LOCK_NAMESPACE = 20260826;

export type CheckoutFailure =
  | { ok: false; reason: "unavailable" }
  | { ok: false; reason: "empty_cart" }
  | { ok: false; reason: "invalid"; errors: CheckoutErrors }
  | { ok: false; reason: "amount_changed"; totalAmount: number }
  | { ok: false; reason: "sold_out"; names: string[] }
  | { ok: false; reason: "preorder_taken"; names: string[] };

export type CheckoutSuccess = {
  ok: true;
  orderNo: string;
  /** 주문 조회 쿠키를 세우는 데 쓴다. 화면에 그리지 않는다 */
  phoneDigits: string;
};

export type CheckoutResult = CheckoutSuccess | CheckoutFailure;

type Num = number | string;

/**
 * 무통장 주문 생성.
 *
 * @param sessionKey 비회원 세션 키 (장바구니의 주인)
 * @param input 주문서 입력. **서버가 다시 검증한다**
 * @param expectedTotal 화면에 보이던 총액. 대조용이며 저장하지 않는다
 * @param providerId 결제 수단. 지금은 'manual' 뿐이고, PG 가 붙으면 여기만 늘어난다
 */
export async function createOrder(
  sessionKey: string,
  input: CheckoutInput,
  expectedTotal: number | null,
  providerId: PaymentProviderId = "manual"
): Promise<CheckoutResult> {
  if (!isDatabaseConfigured()) return { ok: false, reason: "unavailable" };

  // 1) 입력 검증 — 클라이언트가 이미 돌렸더라도 여기가 진짜 방어선이다.
  const errors = validateCheckout(input);
  if (hasErrors(errors)) return { ok: false, reason: "invalid", errors };

  const provider = getPaymentProvider(providerId);

  return withTransaction<CheckoutResult>(async (client) => {
    // 2) 장바구니 — 트랜잭션 안에서 다시 읽는다. 화면이 보낸 항목 목록은 받지 않는다.
    const cartRows = await client.query<{ id: Num }>(SQL_FIND_SESSION_CART, [sessionKey]);
    if (cartRows.rowCount === 0) return { ok: false, reason: "empty_cart" } as const;
    const cartId = Number(cartRows.rows[0].id);

    // 화면(cart.ts)과 **같은 SQL·같은 매퍼**를 쓴다. 매퍼가 두 벌이 되면
    // 언젠가 화면 금액과 주문 금액이 갈라진다.
    const raw = await client.query<CartLineRow>(SQL_CART_LINES, [cartId]);
    const summary = summarize(raw.rows.map(toCartLine));

    const lines = summary.lines.filter((line) => line.unavailableReason === null);
    if (lines.length === 0) {
      const blocked = summary.lines.map((line) => line.name);
      return blocked.length > 0
        ? ({ ok: false, reason: "sold_out", names: blocked } as const)
        : ({ ok: false, reason: "empty_cart" } as const);
    }
    if (summary.hasBlockedLine) {
      return {
        ok: false,
        reason: "sold_out",
        names: summary.lines
          .filter((line) => line.unavailableReason !== null)
          .map((line) => line.name),
      } as const;
    }

    // 3) 금액 재계산 — DB 가격만 쓴다 (불변규칙 2).
    const itemsAmount = lines.reduce((sum, line) => sum + line.lineAmount, 0);
    const shippingFee = calcShippingFee(itemsAmount);
    const discountAmount = 0; // 쿠폰·할인 기능은 아직 없다. 생기면 여기서 서버가 계산한다
    const totalAmount = itemsAmount + shippingFee - discountAmount;

    if (expectedTotal !== null && expectedTotal !== totalAmount) {
      // 화면에 보이던 금액과 다르다 — 담아둔 사이 가격이 바뀌었다. 사람이 다시 확인해야 한다.
      return { ok: false, reason: "amount_changed", totalAmount } as const;
    }

    // 4) 예약주문 자리 확보. 재고가 없어 조건부 UPDATE 를 태울 수 없는 항목들이다.
    const preorderLines = lines.filter((line) => line.isPreorder);
    if (preorderLines.length > 0) {
      // 잠금은 항상 variant_id 오름차순으로 — 두 주문이 서로를 기다리는 교착을 막는다.
      const variantIds = [...new Set(preorderLines.map((line) => line.variantId))].sort(
        (a, b) => a - b
      );
      for (const variantId of variantIds) {
        await client.query("SELECT pg_advisory_xact_lock($1::int, $2::int)", [
          PREORDER_LOCK_NAMESPACE,
          variantId,
        ]);
      }
      const taken = await client.query<{ variant_id: Num }>(SQL_PREORDER_ALREADY_RESERVED, [
        variantIds,
      ]);
      if (taken.rowCount && taken.rowCount > 0) {
        const takenIds = new Set(taken.rows.map((row) => Number(row.variant_id)));
        return {
          ok: false,
          reason: "preorder_taken",
          names: preorderLines.filter((l) => takenIds.has(l.variantId)).map((l) => l.name),
        } as const;
      }
    }

    // 5) 재고 차감 — **조건부 UPDATE 한 방**(불변규칙 3). 예약주문은 건너뛴다.
    //    여기도 variant_id 오름차순으로 돌아 교착을 피한다.
    const stockLines = lines
      .filter((line) => !line.isPreorder)
      .sort((a, b) => a.variantId - b.variantId);
    for (const line of stockLines) {
      const result = await client.query(SQL_DEDUCT_STOCK, [line.variantId, line.quantity]);
      if (result.rowCount === 0) {
        // 영향 행 0 = 그 사이 팔렸다. 여기서 던지지 않고 되돌려 보내면
        // 트랜잭션은 withTransaction 이 커밋해 버리므로, 반드시 롤백되도록 예외로 올린다.
        throw new SoldOutDuringCheckout(line.name);
      }
    }

    // 6) 주문서 — 전부 스냅샷 (불변규칙 4). 동의는 시각으로 (불변규칙 7, SQL 의 now()).
    const orderNo = newOrderNo();
    const ordererPhone = normalizePhone(input.ordererPhone);
    const orderRows = await client.query<{ id: Num }>(SQL_INSERT_ORDER, [
      orderNo,
      input.ordererName.trim(),
      ordererPhone,
      input.ordererEmail.trim().toLowerCase() || null,
      input.recipient.trim(),
      normalizePhone(input.recipientPhone),
      input.postcode.trim(),
      input.address1.trim(),
      input.address2.trim() || null,
      input.deliveryMemo.trim() || null,
      itemsAmount,
      shippingFee,
      discountAmount,
      totalAmount,
    ]);
    const orderId = Number(orderRows.rows[0].id);

    for (const line of lines) {
      await client.query(SQL_INSERT_ORDER_ITEM, [
        orderId,
        line.productId,
        line.variantId,
        line.name,
        line.variantLabel || null,
        line.unitPrice,
        line.quantity,
        line.lineAmount,
        line.isPreorder,
      ]);
    }

    // 7) 결제 기록 — 값은 결제 수단 추상화가 만든다. PG 가 붙어도 이 아래는 그대로다.
    const draft = await provider.prepare({
      orderNo,
      amount: totalAmount,
      ordererName: input.ordererName.trim(),
      depositName: input.depositName.trim(),
    });
    await client.query(SQL_INSERT_PAYMENT, [
      orderId,
      draft.provider,
      draft.pgTransactionId,
      draft.method,
      draft.status,
      draft.amount,
      draft.depositName,
      draft.depositDueAt,
    ]);

    // 8) 장바구니 비우기. 주문이 롤백되면 이것도 같이 되돌아간다.
    await client.query(SQL_CLEAR_CART, [cartId]);

    return { ok: true, orderNo, phoneDigits: ordererPhone } as const;
  }, "customer").catch((error: unknown) => {
    if (error instanceof SoldOutDuringCheckout) {
      return { ok: false, reason: "sold_out", names: [error.productName] } as const;
    }
    console.error(
      "[checkout] 주문 생성 실패:",
      error instanceof Error ? error.message : String(error)
    );
    return { ok: false, reason: "unavailable" } as const;
  });
}

/** 조건부 UPDATE 가 0행을 돌려줬을 때 트랜잭션을 확실히 롤백시키기 위한 예외. */
class SoldOutDuringCheckout extends Error {
  constructor(readonly productName: string) {
    super("재고 차감 실패");
    this.name = "SoldOutDuringCheckout";
  }
}


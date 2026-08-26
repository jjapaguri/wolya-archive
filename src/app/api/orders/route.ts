/**
 * 주문 생성 API — 데스크톱(`/checkout`)과 모바일(`/m/checkout`) 폼이 같이 쓴다.
 *
 * 하는 일은 얇다. 검증·금액 재계산·재고 차감·주문 기록은 전부
 * `src/lib/orders/checkout.ts` 안의 **한 트랜잭션**에서 일어난다.
 * 여기서는 입력을 좁히고, 결과를 화면이 읽을 모양으로 바꾸고,
 * 성공하면 주문 조회용 쿠키를 세운다.
 *
 * **클라이언트가 보낸 금액(`expectedTotal`)은 저장하지 않는다.** 화면에 보이던 값과
 * 지금 값이 다른지 대조하는 데만 쓴다 (AGENTS.md 불변규칙 2).
 */
import { createOrder } from "@/lib/orders/checkout";
import { currentAccessEntries, grantOrderAccess } from "@/lib/orders/lookup";
import { readSessionKey } from "@/lib/orders/session";
import { toCheckoutInput } from "@/lib/orders/shared";

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

export async function POST(request: Request): Promise<Response> {
  const sessionKey = await readSessionKey();
  if (!sessionKey) {
    return json({ ok: false, reason: "empty_cart", message: "장바구니가 비어 있습니다." }, 400);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ ok: false, reason: "invalid", message: "잘못된 요청입니다." }, 400);
  }

  const body = (raw ?? {}) as Record<string, unknown>;
  const input = toCheckoutInput(body);
  const expectedTotalRaw = Number(body.expectedTotal);
  const expectedTotal = Number.isFinite(expectedTotalRaw) ? Math.trunc(expectedTotalRaw) : null;

  // 결제 수단은 지금 무통장뿐이다. 화면이 다른 값을 보내도 받지 않는다 —
  // PG 가 붙으면 여기서 허용 목록(ENABLED_PROVIDER_IDS)을 보고 넓힌다.
  const result = await createOrder(sessionKey, input, expectedTotal, "manual");

  if (result.ok) {
    const response = json({ ok: true, orderNo: result.orderNo });
    // 주문 완료 화면이 휴대폰번호를 다시 묻지 않도록 본인 확인을 쿠키에 남긴다.
    // (원본이 아니라 해시가 들어간다 — lookup.ts 주석 참고)
    grantOrderAccess(response, result.orderNo, result.phoneDigits, await currentAccessEntries());
    return response;
  }

  switch (result.reason) {
    case "invalid":
      return json({ ok: false, reason: "invalid", errors: result.errors }, 400);
    case "empty_cart":
      return json(
        { ok: false, reason: result.reason, message: "장바구니가 비어 있습니다." },
        400
      );
    case "amount_changed":
      return json(
        {
          ok: false,
          reason: result.reason,
          totalAmount: result.totalAmount,
          message: "주문 금액이 변경되었습니다. 장바구니를 다시 확인해 주세요.",
        },
        409
      );
    case "sold_out":
      return json(
        {
          ok: false,
          reason: result.reason,
          names: result.names,
          message: `방금 품절되었습니다: ${result.names.join(", ")}`,
        },
        409
      );
    case "preorder_taken":
      return json(
        {
          ok: false,
          reason: result.reason,
          names: result.names,
          message: `이미 다른 분이 예약한 상품입니다: ${result.names.join(", ")}`,
        },
        409
      );
    default:
      return json(
        {
          ok: false,
          reason: "unavailable",
          message: "지금은 주문을 받을 수 없습니다. 카카오톡 채널로 문의해 주세요.",
        },
        503
      );
  }
}

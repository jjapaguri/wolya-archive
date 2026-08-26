/**
 * 장바구니 API — 데스크톱(`/`)과 모바일(`/m`) **양쪽이 같이 쓴다.**
 *
 * 화면은 둘로 갈라져 있지만 데이터는 하나다. `src/proxy.ts` 의 matcher 가
 * `/api` 를 제외하고 있어 이 경로는 기기 판별 리다이렉트를 타지 않는다.
 *
 * 쿠키를 세워야 해서 라우트 핸들러다 — 서버 컴포넌트 렌더 중에는 쿠키를 세울 수 없다
 * (Next 16 `cookies()` 문서).
 *
 * 클라이언트가 보내는 것은 **무엇을 몇 개** 뿐이다. 가격·재고·주문 가능 여부는
 * 전부 서버가 DB 를 다시 읽어 판단한다 (AGENTS.md 불변규칙 2).
 */
import { addToCart, getCartSummary, removeCartItem, updateCartQuantity } from "@/lib/orders/cart";
import {
  newSessionKey,
  readSessionKey,
  setSessionCookie,
} from "@/lib/orders/session";
import { MAX_LINE_QUANTITY } from "@/lib/orders/shared";

/** 담기 실패 사유 → 사람이 읽는 문장. 화면 두 벌이 같은 문구를 쓰도록 여기 한 곳에 둔다. */
const FAILURE_MESSAGES: Record<string, string> = {
  not_found: "지금은 담을 수 없는 상품입니다.",
  sold_out: "방금 품절되었습니다.",
  needs_option: "옵션을 선택해 주세요.",
  unavailable: "장바구니를 잠시 사용할 수 없습니다. 카카오톡 채널로 문의해 주세요.",
};

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const parsed: unknown = await request.json();
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function toInt(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

/** 현재 장바구니. 화면이 새로고침 없이 상태를 맞출 때 쓴다. */
export async function GET(): Promise<Response> {
  return json({ ok: true, cart: await getCartSummary() });
}

/** 담기 — 세션 쿠키가 없으면 여기서 만든다. */
export async function POST(request: Request): Promise<Response> {
  const body = await readBody(request);
  const slug = typeof body.slug === "string" ? body.slug : "";
  if (!slug) return json({ ok: false, message: FAILURE_MESSAGES.not_found }, 400);

  const variantId = body.variantId === undefined ? null : toInt(body.variantId, 0) || null;
  const quantity = Math.min(Math.max(toInt(body.quantity, 1), 1), MAX_LINE_QUANTITY);

  const existingKey = await readSessionKey();
  const sessionKey = existingKey ?? newSessionKey();

  try {
    const result = await addToCart(sessionKey, slug, variantId, quantity);
    if (!result.ok) {
      return json(
        { ok: false, reason: result.reason, message: FAILURE_MESSAGES[result.reason] },
        result.reason === "unavailable" ? 503 : 409
      );
    }

    const response = json({ ok: true, cart: result.summary });
    // 새로 만든 키만 내려보낸다. 이미 있으면 만료만 갱신할 이유가 없다.
    if (!existingKey) setSessionCookie(response, sessionKey);
    return response;
  } catch (error) {
    console.error(
      "[api/cart] 담기 실패:",
      error instanceof Error ? error.message : String(error)
    );
    return json({ ok: false, message: FAILURE_MESSAGES.unavailable }, 503);
  }
}

/** 수량 변경. 0 이하면 줄이 사라진다. */
export async function PATCH(request: Request): Promise<Response> {
  const sessionKey = await readSessionKey();
  if (!sessionKey) return json({ ok: false, message: "장바구니가 비어 있습니다." }, 400);

  const body = await readBody(request);
  const itemId = toInt(body.itemId, 0);
  if (!itemId) return json({ ok: false, message: "잘못된 요청입니다." }, 400);

  try {
    const cart = await updateCartQuantity(sessionKey, itemId, toInt(body.quantity, 1));
    if (!cart) return json({ ok: false, message: FAILURE_MESSAGES.unavailable }, 503);
    return json({ ok: true, cart });
  } catch (error) {
    console.error(
      "[api/cart] 수량 변경 실패:",
      error instanceof Error ? error.message : String(error)
    );
    return json({ ok: false, message: FAILURE_MESSAGES.unavailable }, 503);
  }
}

/** 줄 삭제. */
export async function DELETE(request: Request): Promise<Response> {
  const sessionKey = await readSessionKey();
  if (!sessionKey) return json({ ok: false, message: "장바구니가 비어 있습니다." }, 400);

  const body = await readBody(request);
  const itemId = toInt(body.itemId, 0);
  if (!itemId) return json({ ok: false, message: "잘못된 요청입니다." }, 400);

  try {
    const cart = await removeCartItem(sessionKey, itemId);
    if (!cart) return json({ ok: false, message: FAILURE_MESSAGES.unavailable }, 503);
    return json({ ok: true, cart });
  } catch (error) {
    console.error(
      "[api/cart] 삭제 실패:",
      error instanceof Error ? error.message : String(error)
    );
    return json({ ok: false, message: FAILURE_MESSAGES.unavailable }, 503);
  }
}

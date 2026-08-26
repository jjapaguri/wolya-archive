/**
 * 비회원 주문 조회 API — 주문번호 + 휴대폰번호.
 *
 * 성공하면 본인 확인 쿠키를 세우고 주문 상세 경로를 돌려준다. 화면은 그 경로로 이동한다.
 * (데스크톱은 `/order/…`, 모바일은 `/m/order/…` — 어느 쪽으로 갈지는 화면이 정한다)
 *
 * ── 무차별 대입 ───────────────────────────────────────────────────
 * 이 API 는 로그인 없이 주문서를 여는 유일한 문이다. 주문번호에 40비트 난수가 들어 있어
 * 맞히기는 어렵지만, **시도 자체를 싸게 두지 않는다.** IP 당 10분에 10회로 막는다.
 *
 * 저장소는 프로세스 메모리다. PM2 단일 프로세스 기준이라 지금은 이걸로 충분하고,
 * 인스턴스가 늘면 공용 저장소로 옮겨야 한다 — 그때 여기 한 곳만 고치면 된다.
 */
import { currentAccessEntries, findOrderByNoAndPhone, grantOrderAccess } from "@/lib/orders/lookup";
import { isValidOrderNo, isValidPhone, normalizePhone } from "@/lib/orders/shared";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

declare global {
  var __wolyaLookupAttempts: Map<string, { count: number; resetAt: number }> | undefined;
}

function attempts(): Map<string, { count: number; resetAt: number }> {
  // dev 의 HMR 이 모듈을 다시 평가해도 카운터가 초기화되지 않도록 globalThis 에 매단다.
  globalThis.__wolyaLookupAttempts ??= new Map();
  return globalThis.__wolyaLookupAttempts;
}

/** 넘겼으면 true. 창이 지났으면 카운터를 리셋한다. */
function rateLimited(key: string): boolean {
  const now = Date.now();
  const store = attempts();

  // 지난 창의 찌꺼기를 같이 치운다 — 맵이 무한정 커지지 않도록.
  if (store.size > 500) {
    for (const [k, v] of store) if (v.resetAt <= now) store.delete(k);
  }

  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

/** Nginx 뒤에 있으므로 X-Forwarded-For 가 진짜 클라이언트 IP 다. */
function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

export async function POST(request: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ ok: false, message: "잘못된 요청입니다." }, 400);
  }

  const body = (raw ?? {}) as Record<string, unknown>;
  const orderNo = typeof body.orderNo === "string" ? body.orderNo.trim().toUpperCase() : "";
  const phone = typeof body.phone === "string" ? body.phone : "";
  const mobile = body.mobile === true;

  if (!isValidOrderNo(orderNo) || !isValidPhone(phone)) {
    return json({ ok: false, message: "주문번호와 휴대폰번호를 확인해 주세요." }, 400);
  }

  if (rateLimited(clientKey(request))) {
    return json(
      { ok: false, message: "조회 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      429
    );
  }

  const order = await findOrderByNoAndPhone(orderNo, phone);
  if (!order) {
    // 있는 주문인지 없는 주문인지 구분해 주지 않는다 — 주문번호 존재 여부가 새면
    // 무차별 대입의 절반이 공짜가 된다.
    return json({ ok: false, message: "일치하는 주문을 찾을 수 없습니다." }, 404);
  }

  const path = `${mobile ? "/m" : ""}/order/${encodeURIComponent(order.orderNo)}`;
  const response = json({ ok: true, orderNo: order.orderNo, path });
  grantOrderAccess(
    response,
    order.orderNo,
    normalizePhone(phone),
    await currentAccessEntries()
  );
  return response;
}

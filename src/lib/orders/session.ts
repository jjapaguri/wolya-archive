/**
 * 비회원 세션 키 — 로그인 없이 장바구니를 이어 붙이는 유일한 실.
 *
 * 회원 장바구니는 `carts.user_id`, 비회원 장바구니는 `carts.session_key` 다(003).
 * 이 파일은 그 `session_key` 를 쿠키로 들고 다니는 부분만 맡는다.
 *
 * ── 규칙 ──────────────────────────────────────────────────────────
 * - **httpOnly.** 자바스크립트가 읽을 이유가 없다. 읽히면 XSS 한 방에 장바구니가 넘어간다.
 * - **추측 불가.** `crypto.randomUUID` 가 아니라 128비트 난수를 hex 로 쓴다.
 * - **쓰기는 라우트 핸들러에서만.** 서버 컴포넌트 렌더 중에는 쿠키를 세울 수 없다
 *   (Next 16 `cookies()` 문서). 그래서 페이지는 "읽기" 만 하고, 장바구니에 담는
 *   `POST /api/cart` 가 없으면 그때 만든다.
 * - **로그인이 붙으면** 이 키의 장바구니를 회원 장바구니로 옮기고 세션 장바구니를 지운다
 *   (003 주석의 병합 로직). 그 코드는 로그인 작업이 들어올 때 붙인다 — 여기서는 건드리지 않는다.
 */
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export const CART_SESSION_COOKIE = "wolya_cart";

/** 30일. 단벌 재고라 이보다 오래 담아둔 장바구니는 어차피 대부분 품절이다. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** carts.session_key 는 VARCHAR(64) — 32자 hex 는 넉넉히 들어간다. */
export function newSessionKey(): string {
  return randomBytes(16).toString("hex");
}

/** 형식이 맞는 키만 받아들인다. 쿠키는 사용자가 고칠 수 있는 값이다. */
export function isValidSessionKey(value: string | undefined): value is string {
  return typeof value === "string" && /^[0-9a-f]{32}$/.test(value);
}

/** 지금 요청의 세션 키. 없거나 형식이 틀리면 null. **만들지 않는다.** */
export async function readSessionKey(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(CART_SESSION_COOKIE)?.value;
  return isValidSessionKey(value) ? value : null;
}

/** 응답에 세션 키 쿠키를 싣는다. 라우트 핸들러에서만 호출된다. */
export function setSessionCookie(response: Response, sessionKey: string): void {
  const parts = [
    `${CART_SESSION_COOKIE}=${sessionKey}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${MAX_AGE_SECONDS}`,
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  response.headers.append("Set-Cookie", parts.join("; "));
}

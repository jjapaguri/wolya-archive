/**
 * 로그인 세션 — 쿠키와 `user_sessions` 원장.
 *
 * **서버 전용이다.** `@/lib/db` 를 거쳐 `pg` 를 끌어오므로 "use client" 파일에서
 * import 하면 브라우저 번들에 `pg` 가 들어가려다 빌드가 깨진다
 * (`src/lib/products.ts` 상단 주석과 같은 이유).
 *
 * ── 설계 ────────────────────────────────────────────────────────
 *  - 쿠키에는 **32바이트 난수**만 들어간다. 회원 id·이메일 같은 것을 담지 않는다.
 *    JWT 도 쓰지 않는다 — 서명 토큰은 서버가 즉시 무효화할 수 없어서
 *    "로그아웃이 서버 쪽 세션도 실제로 무효화한다" 는 요구를 만족시키지 못한다.
 *  - DB 에는 그 토큰의 **SHA-256 만** 저장한다. DB 백업이 새도 세션을 탈취당하지 않는다.
 *  - 쿠키는 httpOnly + sameSite=lax + (운영에서) secure.
 *    strict 가 아니라 lax 인 이유: 소셜 로그인 콜백처럼 외부 사이트에서 돌아오는
 *    최상위 이동에서 쿠키가 실려야 하고, 외부 링크로 들어온 사람이 로그아웃 상태로
 *    보이는 것도 막아야 한다. lax 는 POST 크로스사이트는 여전히 막는다.
 *
 * ── 하지 않는 것 ────────────────────────────────────────────────
 * 로그인은 **편의 기능이지 관문이 아니다.** 이 모듈은 어떤 구매 경로도 막지 않는다.
 * 비회원 주문(`orders.user_id IS NULL`)은 이 코드와 무관하게 그대로 동작한다.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

export const SESSION_COOKIE = "wolya_session";

/** 30일. 재로그인 주기를 이보다 짧게 잡을 이유가 지금은 없다. */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** `last_used_at` 을 매 요청마다 쓰지 않는다 — 이 간격보다 오래됐을 때만 갱신한다. */
const LAST_USED_REFRESH_SECONDS = 60 * 60;

export type SessionUser = {
  id: string;
  email: string | null;
  name: string;
  phone: string | null;
  role: "customer" | "admin";
  marketingAgreedAt: Date | null;
  createdAt: Date;
  /** 비밀번호가 걸린 계정인가 (소셜 전용이면 false) */
  hasPassword: boolean;
};

type SessionRow = {
  session_id: string;
  user_id: string;
  email: string | null;
  name: string;
  phone: string | null;
  role: "customer" | "admin";
  marketing_agreed_at: Date | null;
  created_at: Date;
  has_password: boolean;
  last_used_at: Date;
};

/** 쿠키에 넣을 토큰 원문. 예측 불가능해야 한다 — 순번·시각 기반 금지. */
function newToken(): string {
  return randomBytes(32).toString("base64url");
}

/** DB 에 넣을 값. 원문은 저장하지 않는다. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    // 로컬 개발은 http 라 secure 를 켜면 쿠키가 아예 저장되지 않는다.
    // 운영(archive-wolya.com)은 https 라 항상 켜진다.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export type SessionCookie = {
  name: string;
  value: string;
  options: ReturnType<typeof cookieOptions>;
};

/**
 * 세션 행을 만들고 **심을 쿠키를 돌려준다** (심지는 않는다).
 *
 * Route Handler 가 `NextResponse.redirect()` 를 직접 만들어 돌려줄 때는
 * 그 응답 객체에 쿠키를 붙여야 확실히 나간다. 그래서 "만들기" 와 "심기" 를 나눠 둔다.
 */
export async function issueSession(userId: string): Promise<SessionCookie> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await query(
    `INSERT INTO user_sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, hashToken(token), expiresAt]
  );

  return {
    name: SESSION_COOKIE,
    value: token,
    options: cookieOptions(SESSION_MAX_AGE_SECONDS),
  };
}

/**
 * 세션을 만들고 쿠키를 심는다.
 * **Server Action 또는 Route Handler 에서만** 부를 수 있다 (쿠키 쓰기 제약).
 */
export async function createSession(userId: string): Promise<void> {
  const cookie = await issueSession(userId);
  const store = await cookies();
  store.set(cookie.name, cookie.value, cookie.options);
}

/**
 * 지금 요청의 로그인 사용자. 없으면 null.
 *
 * 서버 컴포넌트에서 불러도 된다 (쿠키를 읽기만 한다).
 * DB 가 없거나 접속이 실패하면 **로그아웃으로 취급한다** — 던지지 않는다.
 * 로그인은 편의 기능이라, 인증 계층이 죽었다고 사이트가 5xx 를 뱉으면 안 된다.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!process.env.DATABASE_URL) return null;

  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const rows = await query<SessionRow>(
      `SELECT s.id            AS session_id,
              s.last_used_at  AS last_used_at,
              u.id            AS user_id,
              u.email,
              u.name,
              u.phone,
              u.role,
              u.marketing_agreed_at,
              u.created_at,
              (u.password_hash IS NOT NULL) AS has_password
         FROM user_sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = $1
          AND s.revoked_at IS NULL
          AND s.expires_at > now()
          AND u.deleted_at IS NULL
          AND u.status = 'active'
        LIMIT 1`,
      [hashToken(token)]
    );

    const row = rows[0];
    if (!row) return null;

    // 마지막 사용 시각 갱신 — 매 요청마다 쓰지 않는다
    const staleMs = Date.now() - new Date(row.last_used_at).getTime();
    if (staleMs > LAST_USED_REFRESH_SECONDS * 1000) {
      await query(`UPDATE user_sessions SET last_used_at = now() WHERE id = $1`, [
        row.session_id,
      ]).catch(() => {});
    }

    return {
      id: row.user_id,
      email: row.email,
      name: row.name,
      phone: row.phone,
      role: row.role,
      marketingAgreedAt: row.marketing_agreed_at,
      createdAt: row.created_at,
      hasPassword: row.has_password,
    };
  } catch {
    // 접속 실패·스키마 미적용(010 미적용) 등. 값을 로그에 찍지 않는다
    return null;
  }
}

/**
 * 로그아웃. **서버 쪽 세션을 실제로 죽인다** — 쿠키만 지우면 토큰을 복사해 둔 쪽이
 * 계속 로그인 상태다.
 */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token && process.env.DATABASE_URL) {
    await query(
      `UPDATE user_sessions
          SET revoked_at = now()
        WHERE token_hash = $1
          AND revoked_at IS NULL`,
      [hashToken(token)]
    ).catch(() => {});
  }

  store.delete(SESSION_COOKIE);
}

/** 비밀번호가 바뀌었을 때처럼, 한 회원의 모든 세션을 끊는다. */
export async function revokeAllSessions(userId: string): Promise<void> {
  await query(
    `UPDATE user_sessions SET revoked_at = now()
      WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
}

/**
 * 소셜 로그인 CSRF 방어용 state 값 비교.
 * 길이가 다르면 `timingSafeEqual` 이 던지므로 먼저 확인한다.
 */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** 소셜 state 처럼 짧게 쓰고 버리는 난수. */
export function randomState(): string {
  return randomBytes(24).toString("base64url");
}

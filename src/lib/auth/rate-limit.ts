/**
 * 로그인 시도 속도 제한.
 *
 * **서버 전용이다.**
 *
 * 인메모리 카운터를 쓰지 않는 이유: PM2 재시작이나 프로세스가 둘 이상이면 카운트가
 * 리셋되거나 프로세스 수만큼 곱해진다. 로그인은 어차피 DB 없이는 되지 않는 기능이라
 * `auth_login_attempts` 테이블에 남기는 편이 의존성을 늘리지 않으면서 정확하다.
 *
 * 두 축으로 센다.
 *  - **이메일별**: 한 계정을 노린 대입. 계정이 실제로 있든 없든 똑같이 센다
 *    (없는 계정은 빨리 통과시켜 주면 그것 자체가 가입 여부 신호가 된다).
 *  - **IP별**: 여러 계정을 훑는 살포형 대입.
 *
 * 성공하면 그 이메일의 실패 기록은 더 이상 막지 않는다(성공 시각 이후만 센다).
 */
import { query } from "@/lib/db";

/** 이메일 하나당 창 안에서 허용하는 실패 횟수. */
const EMAIL_MAX_FAILURES = 5;
/** IP 하나당 허용하는 실패 횟수. 가족·회사처럼 IP 를 공유하는 경우를 감안해 넉넉히. */
const IP_MAX_FAILURES = 20;
/** 세는 창(분). */
const WINDOW_MINUTES = 15;

/** 기록을 남길 수 없을 때 며칠씩 쌓이지 않도록 정리하는 기준. */
const PRUNE_AFTER_DAYS = 1;

export type RateLimitVerdict =
  | { blocked: false }
  | { blocked: true; retryAfterSeconds: number };

/**
 * 지금 이 로그인 시도를 받아도 되나.
 *
 * DB 를 못 읽으면 **막지 않는다**(fail-open). 속도 제한 때문에 정상 로그인이
 * 통째로 불가능해지는 쪽이 더 나쁘다. 어차피 그 상태면 로그인 자체가 DB 를 못 읽어 실패한다.
 */
export async function checkLoginRateLimit(
  email: string | null,
  ip: string | null
): Promise<RateLimitVerdict> {
  try {
    // 두 축을 **따로** 센다. 한 쿼리에 섞으면 어느 한쪽의 성공 기록이 다른 축의
    // 카운트까지 리셋해 버린다 (자기 계정으로 한 번 로그인해 IP 제한을 푸는 우회).
    const rows = await query<{
      email_failures: string;
      ip_failures: string;
      email_oldest: Date | null;
      ip_oldest: Date | null;
    }>(
      `WITH recent AS (
         SELECT email, ip, attempted_at
           FROM auth_login_attempts
          WHERE succeeded = false
            AND attempted_at > now() - make_interval(mins => $3::int)
       ),
       last_success AS (
         SELECT max(attempted_at) AS at
           FROM auth_login_attempts
          WHERE succeeded = true
            AND $1::varchar IS NOT NULL
            AND email = $1
       )
       SELECT
         (SELECT count(*) FROM recent, last_success
           WHERE $1::varchar IS NOT NULL AND recent.email = $1
             AND recent.attempted_at > COALESCE(last_success.at, '-infinity'::timestamptz))
           AS email_failures,
         (SELECT count(*) FROM recent
           WHERE $2::varchar IS NOT NULL AND recent.ip = $2) AS ip_failures,
         (SELECT min(recent.attempted_at) FROM recent, last_success
           WHERE $1::varchar IS NOT NULL AND recent.email = $1
             AND recent.attempted_at > COALESCE(last_success.at, '-infinity'::timestamptz))
           AS email_oldest,
         (SELECT min(attempted_at) FROM recent
           WHERE $2::varchar IS NOT NULL AND recent.ip = $2) AS ip_oldest`,
      [email, ip, WINDOW_MINUTES]
    );

    const row = rows[0];
    if (!row) return { blocked: false };

    const emailBlocked = Number(row.email_failures) >= EMAIL_MAX_FAILURES;
    const ipBlocked = Number(row.ip_failures) >= IP_MAX_FAILURES;
    if (!emailBlocked && !ipBlocked) return { blocked: false };

    // 막힌 축에서 가장 오래된 실패가 창을 벗어나는 시각이 곧 재시도 가능 시각이다
    const candidates = [
      emailBlocked ? row.email_oldest : null,
      ipBlocked ? row.ip_oldest : null,
    ].filter((value): value is Date => value != null);

    const oldest = candidates.length
      ? Math.min(...candidates.map((value) => new Date(value).getTime()))
      : Date.now();
    const retryAt = oldest + WINDOW_MINUTES * 60 * 1000;
    const retryAfterSeconds = Math.max(30, Math.ceil((retryAt - Date.now()) / 1000));
    return { blocked: true, retryAfterSeconds };
  } catch {
    return { blocked: false };
  }
}

/**
 * 시도 결과를 남긴다. **비밀번호는 평문도 해시도 넘기지 않는다.**
 * 기록 실패가 로그인 흐름을 막지 않도록 조용히 삼킨다.
 */
export async function recordLoginAttempt(
  email: string | null,
  ip: string | null,
  succeeded: boolean
): Promise<void> {
  try {
    await query(
      `INSERT INTO auth_login_attempts (email, ip, succeeded) VALUES ($1, $2, $3)`,
      [email, ip, succeeded]
    );

    // 성공했을 때만 청소한다 — 실패마다 DELETE 를 돌리면 대입 공격이 곧 부하가 된다
    if (succeeded) {
      await query(
        `DELETE FROM auth_login_attempts
          WHERE attempted_at < now() - make_interval(days => $1::int)`,
        [PRUNE_AFTER_DAYS]
      );
    }
  } catch {
    // 무시 — 010 미적용 등
  }
}

/**
 * 요청의 접속 IP. Nginx 뒤라 `X-Forwarded-For` 의 **첫 값**이 실제 클라이언트다.
 * 신뢰할 수 없는 값이지만(위조 가능) 속도 제한의 보조 축으로만 쓴다 —
 * 인증 판단에는 쓰지 않는다.
 */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = headers.get("x-real-ip");
  return real ? real.trim().slice(0, 64) : null;
}

/**
 * 소셜 로그인 콜백 — 제공자가 사람을 여기로 돌려보낸다.
 *
 * `GET /api/auth/social/kakao/callback?code=...&state=...`
 *
 * **이 주소가 각 플랫폼 콘솔에 등록돼 있어야 한다.** 등록값과 한 글자라도 다르면
 * 제공자가 리다이렉트를 거부한다. 등록해야 할 목록은 PR 본문의 인수인계에 있다.
 *
 * 여기서 하는 확인은 셋이다.
 *  1. `state` 가 시작 때 심어 둔 쿠키의 값과 같은가 (CSRF — 남이 만든 로그인 왕복을
 *     내 브라우저에 이어 붙이는 공격을 막는다). 비교는 `timingSafeEqual`.
 *  2. 쿠키에 적힌 provider 와 지금 경로의 provider 가 같은가.
 *  3. 제공자가 실제로 프로필을 주는가.
 *
 * 실패는 전부 로그인 화면으로 되돌린다. **왜 실패했는지 자세히 알려주지 않는다.**
 */
import { NextResponse, type NextRequest } from "next/server";
import { issueSession, safeEqual } from "@/lib/auth/session";
import { findOrCreateSocialUser, updateLastLogin } from "@/lib/auth/queries";
import {
  baseUrl,
  callbackUrl,
  isSocialProvider,
  OAUTH_STATE_COOKIE,
  resolveSocialProfile,
  socialConfig,
} from "@/lib/auth/social";
import { safeNextPath } from "@/lib/auth/validation";

export const dynamic = "force-dynamic";

type StateCookie = { state?: string; provider?: string; next?: string };

function parseStateCookie(raw: string | undefined): StateCookie | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as StateCookie;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/auth/social/[provider]/callback">
) {
  const { provider } = await ctx.params;
  const url = new URL(request.url);
  // `request.url` 이 아니라 헤더에서 유추한 원본 주소를 쓴다 (start/route.ts 와 같은 이유)
  const site = baseUrl(url, request.headers);

  const saved = parseStateCookie(request.cookies.get(OAUTH_STATE_COOKIE)?.value);
  const back = safeNextPath(saved?.next ?? null, "/account");
  const loginPath = back.startsWith("/m") ? "/m/login" : "/login";

  const failure = (reason: string) => {
    const response = NextResponse.redirect(`${site}${loginPath}?error=${reason}`);
    // 한 번 쓴 state 는 성공이든 실패든 버린다 (재사용 차단)
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  };

  if (!isSocialProvider(provider)) return failure("social");

  const config = socialConfig(provider);
  if (!config) return failure("social_off");

  // 사람이 동의 화면에서 취소한 경우도 여기로 온다
  if (url.searchParams.get("error")) return failure("social_cancel");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return failure("social");

  if (!saved?.state || saved.provider !== provider || !safeEqual(saved.state, state)) {
    return failure("social_state");
  }

  const redirectUri = callbackUrl(provider, url, request.headers);

  let userId: string;
  try {
    const profile = await resolveSocialProfile(config, code, redirectUri, state);
    if (!profile) return failure("social");

    // 이메일을 안 주는 제공자가 있다. 이름도 없으면 사람이 내 정보에서 고칠 수 있게 임시값
    userId = await findOrCreateSocialUser(provider, profile, "회원");
  } catch {
    // 원문 오류를 화면·URL 에 흘리지 않는다 (토큰·DB 정보가 샌다)
    return failure("social");
  }

  let cookie;
  try {
    cookie = await issueSession(userId);
  } catch {
    return failure("social");
  }
  await updateLastLogin(userId);

  const response = NextResponse.redirect(`${site}${back}`);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}

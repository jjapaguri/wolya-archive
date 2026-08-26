/**
 * 소셜 로그인 시작 — 제공자의 동의 화면으로 보낸다.
 *
 * `GET /api/auth/social/kakao/start?next=/account`
 *
 * `/api` 는 `src/proxy.ts` 의 matcher 에서 제외돼 있다 — 데스크톱·모바일 어느 쪽에서
 * 눌러도 이 라우트 하나로 온다. 돌아갈 곳(`next`)만 화면이 알려준다.
 *
 * 키가 없으면 여기까지 올 일이 없지만(버튼 자체가 안 보인다), 주소를 직접 치는 경우가
 * 있으므로 다시 확인하고 로그인 화면으로 돌려보낸다.
 */
import { NextResponse, type NextRequest } from "next/server";
import { randomState } from "@/lib/auth/session";
import {
  authorizeUrl,
  baseUrl,
  callbackUrl,
  isSocialProvider,
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_MAX_AGE_SECONDS,
  socialConfig,
} from "@/lib/auth/social";
import { safeNextPath } from "@/lib/auth/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, ctx: RouteContext<"/api/auth/social/[provider]/start">) {
  const { provider } = await ctx.params;
  const url = new URL(request.url);

  // 되돌려 보낼 주소는 **요청 헤더에서 유추한 원본 주소**로 만든다.
  // `request.url` 은 Nginx 뒤에서 내부 호스트(localhost:3000)로 잡혀서, 그걸 그대로
  // Location 에 넣으면 브라우저가 내부 주소로 가려다 실패한다.
  const site = baseUrl(url, request.headers);

  // 실패는 전부 로그인 화면으로 되돌린다. 어느 쪽 화면에서 왔는지는 next 가 안다
  const back = safeNextPath(url.searchParams.get("next"), "/account");
  const loginPath = back.startsWith("/m") ? "/m/login" : "/login";

  if (!isSocialProvider(provider)) {
    return NextResponse.redirect(`${site}${loginPath}?error=social`);
  }

  const config = socialConfig(provider);
  if (!config) {
    // 앱 키가 아직 서버 .env.local 에 없다
    return NextResponse.redirect(`${site}${loginPath}?error=social_off`);
  }

  const state = randomState();
  const redirectUri = callbackUrl(provider, url, request.headers);
  const response = NextResponse.redirect(authorizeUrl(config, redirectUri, state));

  // CSRF 방어: 돌아왔을 때 이 값과 대조한다. 쿠키는 httpOnly 라 스크립트가 못 읽는다.
  // `next` 를 여기 같이 넣는 이유는 콜백 URL 에 붙이면 제공자 콘솔 등록값과 어긋나기 때문이다.
  response.cookies.set(
    OAUTH_STATE_COOKIE,
    JSON.stringify({ state, provider, next: back }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // 제공자 사이트에서 돌아오는 최상위 이동에 쿠키가 실려야 한다
      sameSite: "lax",
      path: "/",
      maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
    }
  );

  return response;
}

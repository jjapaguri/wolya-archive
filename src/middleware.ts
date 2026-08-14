import { NextResponse, type NextRequest } from "next/server";

/**
 * 데스크톱(`/`)과 모바일(`/m`)은 같은 데이터를 쓰되 화면만 다른 별도 라우트다.
 * 이 미들웨어가 접속 기기를 보고 알맞은 쪽으로 보낸다.
 *
 * - 휴대폰으로 `/` 접속  → `/m` 으로 이동
 * - `?view=desktop` / `?view=mobile` 이 붙으면 그 선택을 쿠키로 30일 기억
 *   (모바일 화면 하단의 "데스크톱 버전으로 보기" 링크가 이걸 쓴다)
 * - 데스크톱에서 `/m` 을 직접 열면 그대로 둔다 (개발·확인용)
 */

const VIEW_COOKIE = "wolya-view";
const VIEW_MAX_AGE = 60 * 60 * 24 * 30; // 30일

// 태블릿(iPad 등)은 데스크톱 레이아웃이 더 낫기 때문에 모바일로 치지 않는다.
const MOBILE_UA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;
const TABLET_UA = /iPad|Tablet|Silk|PlayBook/i;

function isMobilePath(pathname: string) {
  return pathname === "/m" || pathname.startsWith("/m/");
}

function toMobilePath(pathname: string) {
  return pathname === "/" ? "/m" : `/m${pathname}`;
}

function toDesktopPath(pathname: string) {
  const stripped = pathname.replace(/^\/m/, "");
  return stripped === "" ? "/" : stripped;
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;
  const onMobilePath = isMobilePath(pathname);

  // 1) ?view= 파라미터로 명시적 전환 — 쿠키에 저장하고 파라미터는 지운다
  const requestedView = url.searchParams.get("view");
  if (requestedView === "desktop" || requestedView === "mobile") {
    url.searchParams.delete("view");
    url.pathname =
      requestedView === "mobile" ? toMobilePath(pathname) : toDesktopPath(pathname);

    const response = NextResponse.redirect(url);
    response.cookies.set(VIEW_COOKIE, requestedView, {
      path: "/",
      maxAge: VIEW_MAX_AGE,
      sameSite: "lax",
    });
    return response;
  }

  // 2) 저장된 선택이 있으면 그것을 따른다
  const savedView = request.cookies.get(VIEW_COOKIE)?.value;
  if (savedView === "desktop" && onMobilePath) {
    url.pathname = toDesktopPath(pathname);
    return NextResponse.redirect(url);
  }
  if (savedView === "mobile" && !onMobilePath) {
    url.pathname = toMobilePath(pathname);
    return NextResponse.redirect(url);
  }
  if (savedView) return NextResponse.next();

  // 3) 선택이 없으면 기기로 판단 — 휴대폰이면 모바일 화면으로
  const userAgent = request.headers.get("user-agent") ?? "";
  const isPhone = MOBILE_UA.test(userAgent) && !TABLET_UA.test(userAgent);

  if (isPhone && !onMobilePath) {
    url.pathname = toMobilePath(pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // API·정적 파일·이미지 최적화 경로는 건드리지 않는다.
  matcher: ["/((?!api|_next/static|_next/image|fonts|favicon.ico|.*\\.[\\w]+$).*)"],
};

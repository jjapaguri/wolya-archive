import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import SiteFooter from "@/components/SiteFooter";
import LoginForm from "@/components/LoginForm";
import SocialLoginButtons from "@/components/SocialLoginButtons";
import { getSessionUser } from "@/lib/auth/session";
import { enabledSocialProviders } from "@/lib/auth/social";
import { safeNextPath } from "@/lib/auth/validation";

export const metadata: Metadata = {
  title: "로그인 | WOLYA ARCHIVE",
  description: "WOLYA ARCHIVE 회원 로그인.",
  // 로그인 화면이 검색 결과에 뜰 이유가 없다
  robots: { index: false, follow: false },
};

/**
 * 요청마다 렌더한다. 이유가 둘이다.
 *  1. 로그인 여부(쿠키)를 봐야 한다.
 *  2. **소셜 버튼 노출이 런타임 환경변수에 달려 있다.** 빌드 때 굳히면 사람이 서버
 *     `.env.local` 에 키를 넣어도 다음 배포까지 버튼이 안 나온다.
 */
export const dynamic = "force-dynamic";

/** 콜백에서 돌아올 때 붙는 사유 → 사람이 읽을 문구. 자세히 알려주지 않는다. */
const SOCIAL_ERRORS: Record<string, string> = {
  social: "소셜 로그인에 실패했습니다. 다시 시도해 주세요.",
  social_off: "지금은 그 소셜 로그인을 쓸 수 없습니다.",
  social_state: "로그인 요청이 만료됐습니다. 다시 시도해 주세요.",
  social_cancel: "소셜 로그인을 취소했습니다.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const rawNext = typeof params.next === "string" ? params.next : null;
  const next = safeNextPath(rawNext, "/account");

  // 이미 로그인해 있으면 로그인 화면을 보여줄 이유가 없다
  const user = await getSessionUser();
  if (user) redirect(next);

  const rawError = typeof params.error === "string" ? params.error : null;
  const socialError = rawError ? (SOCIAL_ERRORS[rawError] ?? SOCIAL_ERRORS.social) : null;

  const providers = enabledSocialProviders();

  return (
    <>
      <GrainOverlay />
      <main className="relative z-10 mx-auto max-w-[480px] px-6 pt-16 pb-24 lg:pt-24">
        <Link
          href="/"
          className="mb-10 inline-block font-sans text-[10px] tracking-[0.2em] text-fg/50 uppercase transition-colors hover:text-accent"
        >
          ← 홈으로
        </Link>

        <h1 className="word-keep-all mb-3 font-maruburi text-2xl leading-relaxed font-semibold lg:text-3xl">
          로그인
        </h1>

        {/* 로그인은 편의 기능이지 관문이 아니다. 이 문장을 지우지 말 것 */}
        <p className="word-keep-all mb-10 font-kr text-[13px] leading-[1.8] font-light text-fg/60">
          회원이 아니어도 주문할 수 있습니다. 로그인은 배송지를 저장해 두고
          주문 내역을 한곳에서 보기 위한 편의 기능입니다.
        </p>

        {socialError && (
          <p
            role="alert"
            className="word-keep-all mb-6 border border-accent/50 bg-accent-dim/40 px-4 py-3 font-kr text-[13px] leading-[1.7] text-fg/90"
          >
            {socialError}
          </p>
        )}

        <LoginForm next={next} />

        <div className="mt-8">
          <SocialLoginButtons providers={providers} next={next} />
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 font-kr text-[13px] text-fg/60">
          <p>
            처음이신가요?{" "}
            <Link
              href={`/signup?next=${encodeURIComponent(next)}`}
              className="text-fg underline underline-offset-4 transition-colors hover:text-accent"
            >
              회원가입
            </Link>
          </p>
          {/* 비밀번호 재설정은 이메일 발송 경로가 아직 없다 — docs/BACKLOG.md 참고 */}
          <p className="text-fg/40">
            비밀번호를 잊으셨다면 카카오톡 채널 아카이브_월야로 문의해 주세요.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

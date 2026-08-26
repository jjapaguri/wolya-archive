import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileFooter from "@/components/mobile/MobileFooter";
import MobileLoginForm from "@/components/mobile/MobileLoginForm";
import MobileSocialLoginButtons from "@/components/mobile/MobileSocialLoginButtons";
import { getSessionUser } from "@/lib/auth/session";
import { enabledSocialProviders } from "@/lib/auth/social";
import { safeNextPath } from "@/lib/auth/validation";

export const metadata: Metadata = {
  title: "로그인 | WOLYA ARCHIVE",
  description: "WOLYA ARCHIVE 회원 로그인.",
  robots: { index: false, follow: false },
};

/** 로그인 여부(쿠키)와 소셜 키 설정(환경변수)을 런타임에 본다 — `/login` 과 같은 이유. */
export const dynamic = "force-dynamic";

const SOCIAL_ERRORS: Record<string, string> = {
  social: "소셜 로그인에 실패했습니다. 다시 시도해 주세요.",
  social_off: "지금은 그 소셜 로그인을 쓸 수 없습니다.",
  social_state: "로그인 요청이 만료됐습니다. 다시 시도해 주세요.",
  social_cancel: "소셜 로그인을 취소했습니다.",
};

export default async function MobileLoginPage({ searchParams }: PageProps<"/m/login">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null, "/m/account");

  const user = await getSessionUser();
  if (user) redirect(next);

  const rawError = typeof params.error === "string" ? params.error : null;
  const socialError = rawError ? (SOCIAL_ERRORS[rawError] ?? SOCIAL_ERRORS.social) : null;

  return (
    <>
      <GrainOverlay alpha={15} frameIntervalMs={50} />
      <MobileHeader />

      <main className="w-full px-6 pt-[92px] pb-16">
        <Link href="/m" className="mb-6 inline-block text-[10px] tracking-[0.2em] text-fg/50 uppercase">
          ← 홈으로
        </Link>

        <h1 className="word-keep-all mb-3 font-kr text-xl font-medium">로그인</h1>

        {/* 로그인은 편의 기능이지 관문이 아니다. 이 문장을 지우지 말 것 */}
        <p className="word-keep-all mb-8 font-kr text-[13px] leading-[1.8] font-light text-fg/60">
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

        <MobileLoginForm next={next} />

        <div className="mt-7">
          <MobileSocialLoginButtons providers={enabledSocialProviders()} next={next} />
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-fg/10 pt-5 font-kr text-[13px] text-fg/60">
          <p>
            처음이신가요?{" "}
            <Link
              href={`/m/signup?next=${encodeURIComponent(next)}`}
              className="text-fg underline underline-offset-4"
            >
              회원가입
            </Link>
          </p>
          <p className="text-fg/40">
            비밀번호를 잊으셨다면 카카오톡 채널 아카이브_월야로 문의해 주세요.
          </p>
        </div>
      </main>

      <MobileFooter />
    </>
  );
}

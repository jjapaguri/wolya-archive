import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import SiteFooter from "@/components/SiteFooter";
import SignupForm from "@/components/SignupForm";
import SocialLoginButtons from "@/components/SocialLoginButtons";
import { getSessionUser } from "@/lib/auth/session";
import { enabledSocialProviders } from "@/lib/auth/social";
import { safeNextPath } from "@/lib/auth/validation";

export const metadata: Metadata = {
  title: "회원가입 | WOLYA ARCHIVE",
  description: "WOLYA ARCHIVE 회원가입.",
  robots: { index: false, follow: false },
};

/** 로그인 여부와 소셜 키 설정을 런타임에 본다 — `/login` 과 같은 이유. */
export const dynamic = "force-dynamic";

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null, "/account");

  const user = await getSessionUser();
  if (user) redirect(next);

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
          회원가입
        </h1>

        <p className="word-keep-all mb-10 font-kr text-[13px] leading-[1.8] font-light text-fg/60">
          가입하지 않아도 주문할 수 있습니다. 배송지를 저장해 두고 주문 내역을
          한곳에서 보시려면 가입해 주세요.
        </p>

        <SignupForm next={next} />

        <div className="mt-8">
          <SocialLoginButtons providers={enabledSocialProviders()} next={next} />
        </div>

        <p className="mt-10 border-t border-border pt-6 font-kr text-[13px] text-fg/60">
          이미 회원이신가요?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="text-fg underline underline-offset-4 transition-colors hover:text-accent"
          >
            로그인
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}

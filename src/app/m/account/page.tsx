import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileFooter from "@/components/mobile/MobileFooter";
import MobileAccountProfileForm from "@/components/mobile/MobileAccountProfileForm";
import MobileAccountAddressBook from "@/components/mobile/MobileAccountAddressBook";
import { logoutAction } from "@/lib/auth/actions";
import { listAddresses, listLinkedProviders } from "@/lib/auth/queries";
import { getSessionUser } from "@/lib/auth/session";
import { SOCIAL_LABELS } from "@/lib/auth/social";
import type { AccountAddress } from "@/lib/auth/types";

export const metadata: Metadata = {
  title: "내 정보 | WOLYA ARCHIVE",
  description: "WOLYA ARCHIVE 회원 정보와 배송지.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function MobileAccountPage() {
  const user = await getSessionUser();
  // 로그인한 사람만 볼 것이 있는 화면이다. **구매 경로에는 이런 벽이 없다.**
  if (!user) redirect("/m/login?next=%2Fm%2Faccount");

  let addresses: AccountAddress[] = [];
  let providers: string[] = [];
  try {
    [addresses, providers] = await Promise.all([
      listAddresses(user.id),
      listLinkedProviders(user.id),
    ]);
  } catch {
    addresses = [];
    providers = [];
  }

  const methods = [
    ...(user.hasPassword ? ["이메일"] : []),
    ...providers.map((provider) => SOCIAL_LABELS[provider as keyof typeof SOCIAL_LABELS]),
  ];

  return (
    <>
      <GrainOverlay alpha={15} frameIntervalMs={50} />
      <MobileHeader />

      <main className="w-full px-6 pt-[92px] pb-16">
        <Link href="/m" className="mb-6 inline-block text-[10px] tracking-[0.2em] text-fg/50 uppercase">
          ← 홈으로
        </Link>

        <h1 className="word-keep-all mb-1 font-kr text-xl font-medium">{user.name} 님</h1>
        <p className="mb-8 font-kr text-[12px] text-fg/50">
          {user.email ?? "이메일 미등록"}
          {methods.length > 0 && ` · ${methods.join(" / ")} 로그인`}
        </p>

        <section className="mb-12">
          <h2 className="mb-5 border-b border-fg/10 pb-2 text-[10px] font-medium tracking-[0.15em] text-accent uppercase">
            내 정보
          </h2>
          <MobileAccountProfileForm
            name={user.name}
            phone={user.phone}
            marketingAgreed={user.marketingAgreedAt !== null}
          />
        </section>

        <section className="mb-12">
          <h2 className="mb-5 border-b border-fg/10 pb-2 text-[10px] font-medium tracking-[0.15em] text-accent uppercase">
            배송지
          </h2>
          <MobileAccountAddressBook addresses={addresses} />
        </section>

        {/* 로그아웃은 서버 쪽 세션도 실제로 무효화한다 (user_sessions.revoked_at) */}
        <form action={logoutAction}>
          <input type="hidden" name="next" value="/m" />
          <button
            type="submit"
            className="w-full border border-fg/15 px-6 py-4 text-xs tracking-[0.2em] text-fg/60 uppercase active:opacity-50"
          >
            로그아웃
          </button>
        </form>
      </main>

      <MobileFooter />
    </>
  );
}

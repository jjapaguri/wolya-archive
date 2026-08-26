import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import SiteFooter from "@/components/SiteFooter";
import AccountProfileForm from "@/components/AccountProfileForm";
import AccountAddressBook from "@/components/AccountAddressBook";
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

export default async function AccountPage() {
  const user = await getSessionUser();
  // 여기는 로그인한 사람만 볼 것이 있는 화면이다. **구매 경로에는 이런 벽이 없다.**
  if (!user) redirect("/login?next=%2Faccount");

  // DB 가 흔들려도 화면이 5xx 로 죽지 않게 한다 — 목록만 비워서 보여준다
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
      <GrainOverlay />
      <main className="relative z-10 mx-auto max-w-[720px] px-6 pt-16 pb-24 lg:pt-24">
        <Link
          href="/"
          className="mb-10 inline-block font-sans text-[10px] tracking-[0.2em] text-fg/50 uppercase transition-colors hover:text-accent"
        >
          ← 홈으로
        </Link>

        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="word-keep-all font-maruburi text-2xl leading-relaxed font-semibold lg:text-3xl">
              {user.name} 님
            </h1>
            <p className="mt-2 font-kr text-[13px] text-fg/50">
              {user.email ?? "이메일 미등록"}
              {methods.length > 0 && ` · ${methods.join(" / ")} 로그인`}
            </p>
          </div>

          {/* 로그아웃은 서버 쪽 세션도 실제로 무효화한다 (user_sessions.revoked_at) */}
          <form action={logoutAction}>
            <input type="hidden" name="next" value="/" />
            <button
              type="submit"
              className="border border-border px-6 py-3 font-sans text-[10px] tracking-[0.2em] text-fg/60 uppercase transition-colors hover:border-fg hover:text-fg"
            >
              로그아웃
            </button>
          </form>
        </div>

        <section className="mb-16">
          <h2 className="mb-6 border-b border-border pb-3 font-sans text-[11px] tracking-[0.2em] text-accent uppercase">
            내 정보
          </h2>
          <AccountProfileForm
            name={user.name}
            phone={user.phone}
            marketingAgreed={user.marketingAgreedAt !== null}
          />
        </section>

        <section>
          <h2 className="mb-6 border-b border-border pb-3 font-sans text-[11px] tracking-[0.2em] text-accent uppercase">
            배송지
          </h2>
          <AccountAddressBook addresses={addresses} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

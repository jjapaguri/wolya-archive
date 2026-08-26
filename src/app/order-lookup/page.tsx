import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import SiteFooter from "@/components/SiteFooter";
import OrderLookupForm from "@/components/OrderLookupForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "주문 조회 | WOLYA ARCHIVE",
  description: "주문번호와 휴대폰번호로 주문 내역을 확인합니다.",
  robots: { index: false, follow: false },
};

export default function OrderLookupPage() {
  return (
    <>
      <GrainOverlay />
      <main className="relative z-10 mx-auto max-w-[720px] px-6 pt-16 pb-24 lg:px-20 lg:pt-24">
        <Link
          href="/"
          className="mb-10 inline-block font-sans text-[10px] tracking-[0.2em] text-fg/50 uppercase transition-colors hover:text-accent"
        >
          ← 홈으로
        </Link>

        <h1 className="word-keep-all mb-8 font-maruburi text-2xl leading-relaxed font-semibold lg:text-3xl">
          주문 조회
        </h1>

        <p className="word-keep-all mb-10 font-kr text-sm leading-[1.8] font-light text-fg/70">
          주문할 때 받은 주문번호와 주문자 휴대폰번호를 입력해 주세요. 비회원 주문도 같은
          방법으로 확인합니다.
        </p>

        <OrderLookupForm />
      </main>
      <SiteFooter />
    </>
  );
}

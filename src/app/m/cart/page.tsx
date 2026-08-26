import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileFooter from "@/components/mobile/MobileFooter";
import MobileCartView from "@/components/mobile/MobileCartView";
import { getCartSummary } from "@/lib/orders/cart";

/** 장바구니는 요청마다 렌더한다 — 쿠키와 재고를 다시 본다. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "장바구니 | WOLYA ARCHIVE",
  robots: { index: false, follow: false },
};

export default async function MobileCartPage() {
  const cart = await getCartSummary();

  return (
    <>
      <GrainOverlay alpha={15} frameIntervalMs={50} />
      <MobileHeader />

      <main className="w-full px-6 pt-[92px] pb-16">
        <Link
          href="/m/archive"
          className="mb-6 inline-block text-[10px] tracking-[0.2em] text-fg/50 uppercase"
        >
          ← 아카이브로 돌아가기
        </Link>

        <h1 className="word-keep-all mb-6 font-kr text-xl font-medium">장바구니</h1>

        <MobileCartView cart={cart} />

        <div className="mt-10 border-t border-fg/10 pt-5">
          <Link
            href="/m/order-lookup"
            className="text-[10px] tracking-[0.15em] text-fg/40 uppercase active:opacity-50"
          >
            주문 조회 (비회원)
          </Link>
        </div>
      </main>

      <MobileFooter />
    </>
  );
}

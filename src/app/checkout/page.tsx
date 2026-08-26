import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import SiteFooter from "@/components/SiteFooter";
import CheckoutForm from "@/components/CheckoutForm";
import { getCartSummary } from "@/lib/orders/cart";
import { DEFAULT_PROVIDER_ID, getPaymentProvider } from "@/lib/payment/provider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "주문서 | WOLYA ARCHIVE",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const cart = await getCartSummary();
  // 결제 수단은 추상화 층에서 가져온다. PG 가 붙으면 이 페이지는 고치지 않는다.
  const provider = getPaymentProvider(DEFAULT_PROVIDER_ID);

  return (
    <>
      <GrainOverlay />
      <main className="relative z-10 mx-auto max-w-[1100px] px-6 pt-16 pb-24 lg:px-20 lg:pt-24">
        <Link
          href="/cart"
          className="mb-10 inline-block font-sans text-[10px] tracking-[0.2em] text-fg/50 uppercase transition-colors hover:text-accent"
        >
          ← 장바구니
        </Link>

        <h1 className="word-keep-all mb-8 font-maruburi text-2xl leading-relaxed font-semibold lg:text-3xl">
          주문서 작성
        </h1>

        <p className="word-keep-all mb-10 font-kr text-[13px] leading-[1.8] font-light text-fg/60">
          로그인 없이 주문할 수 있습니다. 주문 후 받는 <strong className="text-fg/80">주문번호</strong>와
          휴대폰번호로 주문 내역을 조회합니다.
        </p>

        <CheckoutForm
          cart={cart}
          paymentLabel={provider.label}
          paymentDescription={provider.description}
        />
      </main>
      <SiteFooter />
    </>
  );
}

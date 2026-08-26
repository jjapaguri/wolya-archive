import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileFooter from "@/components/mobile/MobileFooter";
import MobileCheckoutForm from "@/components/mobile/MobileCheckoutForm";
import { getCartSummary } from "@/lib/orders/cart";
import { DEFAULT_PROVIDER_ID, getPaymentProvider } from "@/lib/payment/provider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "주문서 | WOLYA ARCHIVE",
  robots: { index: false, follow: false },
};

export default async function MobileCheckoutPage() {
  const cart = await getCartSummary();
  const provider = getPaymentProvider(DEFAULT_PROVIDER_ID);

  return (
    <>
      <GrainOverlay alpha={15} frameIntervalMs={50} />
      <MobileHeader />

      <main className="w-full px-6 pt-[92px] pb-16">
        <Link
          href="/m/cart"
          className="mb-6 inline-block text-[10px] tracking-[0.2em] text-fg/50 uppercase"
        >
          ← 장바구니
        </Link>

        <h1 className="word-keep-all mb-4 font-kr text-xl font-medium">주문서 작성</h1>

        <p className="word-keep-all mb-8 font-kr text-[12px] leading-[1.7] font-light text-fg/60">
          로그인 없이 주문할 수 있습니다. 주문 후 받는 주문번호와 휴대폰번호로 주문 내역을
          조회합니다.
        </p>

        <MobileCheckoutForm
          cart={cart}
          paymentLabel={provider.label}
          paymentDescription={provider.description}
        />
      </main>

      <MobileFooter />
    </>
  );
}

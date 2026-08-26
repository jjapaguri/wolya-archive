import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import SiteFooter from "@/components/SiteFooter";
import CartView from "@/components/CartView";
import { getCartSummary } from "@/lib/orders/cart";

/**
 * 장바구니는 요청마다 렌더한다. 쿠키를 읽고 재고를 다시 보기 때문에
 * 캐시하면 팔린 물건이 담긴 채로 보인다. (상품 라우트와 같은 이유)
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "장바구니 | WOLYA ARCHIVE",
  // 개인 상태가 담긴 화면이라 검색에 걸릴 이유가 없다.
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const cart = await getCartSummary();

  return (
    <>
      <GrainOverlay />
      <main className="relative z-10 mx-auto max-w-[900px] px-6 pt-16 pb-24 lg:px-20 lg:pt-24">
        <Link
          href="/archive"
          className="mb-10 inline-block font-sans text-[10px] tracking-[0.2em] text-fg/50 uppercase transition-colors hover:text-accent"
        >
          ← 아카이브로 돌아가기
        </Link>

        <h1 className="word-keep-all mb-8 font-maruburi text-2xl leading-relaxed font-semibold lg:text-3xl">
          장바구니
        </h1>

        <CartView cart={cart} />

        <div className="mt-16 border-t border-border pt-6">
          <Link
            href="/order-lookup"
            className="font-sans text-[10px] tracking-[0.15em] text-fg/40 uppercase transition-colors hover:text-accent"
          >
            주문 조회 (비회원)
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

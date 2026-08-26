import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import SiteFooter from "@/components/SiteFooter";
import ShopGrid from "@/components/ShopGrid";
import { listShopProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop | WOLYA ARCHIVE",
  description: "도매 소싱으로 들여오는 신상품. 준비 중입니다.",
};

/** 상품이 DB 에서 온다 — 요청마다 렌더한다. 이유는 `src/app/page.tsx` 상단 주석 참고. */
export const dynamic = "force-dynamic";

/**
 * Shop 은 **재입고 가능한 신상품** 자리다. 개인 소장 1점 한정 아이템은 `/archive` 로 갔다.
 * 아직 `channel: "shop"` 상품이 없어 안내만 보여주고, 등록되면 코드 수정 없이 목록이 뜬다.
 */
export default async function ShopPage() {
  const products = await listShopProducts();

  return (
    <>
      <GrainOverlay />
      <main className="relative z-10 mx-auto max-w-[1400px] px-6 pt-16 pb-24 lg:px-20 lg:pt-24">
        <Link
          href="/"
          className="mb-10 inline-block font-sans text-[10px] tracking-[0.2em] text-fg/50 uppercase transition-colors hover:text-accent"
        >
          ← 홈으로
        </Link>

        <h1 className="word-keep-all mb-6 font-maruburi text-2xl leading-relaxed font-semibold lg:text-3xl">
          새 재고 준비 중
        </h1>

        {products.length === 0 ? (
          <>
            <p className="word-keep-all mb-10 max-w-[640px] font-kr text-sm leading-[1.8] font-light text-fg/70">
              도매 소싱으로 들여오는 신상품을 준비하고 있습니다. 지금 보실 수 있는 아이템은
              아카이브에 있습니다 — 직접 모아 온 1점 한정 개인 소장분입니다.
            </p>

            <Link
              href="/archive"
              className="inline-flex items-center gap-2 border border-fg px-[30px] py-[15px] font-sans text-xs tracking-[0.2em] text-fg uppercase transition-all duration-[400ms] ease-[cubic-bezier(0.19,1,0.22,1)] hover:bg-fg hover:text-bg"
            >
              Archive 바로가기
            </Link>
          </>
        ) : (
          <ShopGrid products={products} />
        )}
      </main>
      <SiteFooter />
    </>
  );
}

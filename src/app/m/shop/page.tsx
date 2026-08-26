import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileFooter from "@/components/mobile/MobileFooter";
import MobileShopGrid from "@/components/mobile/MobileShopGrid";
import { listShopProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop | WOLYA ARCHIVE",
  description: "도매 소싱으로 들여오는 신상품. 준비 중입니다.",
};

/** 상품이 DB 에서 온다 — 요청마다 렌더한다. 이유는 `src/app/page.tsx` 상단 주석 참고. */
export const dynamic = "force-dynamic";

/**
 * Shop 은 **재입고 가능한 신상품** 자리다. 개인 소장 1점 한정 아이템은 `/m/archive` 로 갔다.
 * 아직 `channel: "shop"` 상품이 없어 안내만 보여주고, 등록되면 코드 수정 없이 목록이 뜬다.
 */
export default async function MobileShopPage() {
  const products = await listShopProducts();

  return (
    <>
      <GrainOverlay alpha={15} frameIntervalMs={50} />
      <MobileHeader />

      <main className="w-full px-6 pt-[92px] pb-16">
        <Link href="/m" className="mb-6 inline-block text-[10px] tracking-[0.2em] text-fg/50 uppercase">
          ← 홈으로
        </Link>

        <h1 className="word-keep-all mb-4 font-kr text-xl font-medium">새 재고 준비 중</h1>

        {products.length === 0 ? (
          <>
            <p className="word-keep-all mb-8 font-kr text-[13px] leading-[1.8] font-light text-fg/70">
              도매 소싱으로 들여오는 신상품을 준비하고 있습니다. 지금 보실 수 있는 아이템은
              아카이브에 있습니다 — 직접 모아 온 1점 한정 개인 소장분입니다.
            </p>

            <Link
              href="/m/archive"
              className="inline-flex items-center gap-2 border border-fg px-6 py-3 font-sans text-xs tracking-[0.2em] text-fg uppercase active:bg-fg active:text-bg"
            >
              Archive 바로가기
            </Link>
          </>
        ) : (
          <MobileShopGrid products={products} />
        )}
      </main>

      <MobileFooter />
    </>
  );
}

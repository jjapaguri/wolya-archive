import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileFooter from "@/components/mobile/MobileFooter";
import MobileShopGrid from "@/components/mobile/MobileShopGrid";
import { listArchiveProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Archive | WOLYA ARCHIVE",
  description: "주인장이 직접 모아 온 1점 한정 아카이브 아이템 전체 목록.",
};

/** 상품이 DB 에서 온다 — 요청마다 렌더한다. 이유는 `src/app/page.tsx` 상단 주석 참고. */
export const dynamic = "force-dynamic";

export default async function MobileArchivePage() {
  const products = await listArchiveProducts();

  return (
    <>
      <GrainOverlay alpha={15} frameIntervalMs={50} />
      <MobileHeader />

      <main className="w-full px-6 pt-[92px] pb-16">
        <Link href="/m" className="mb-6 inline-block text-[10px] tracking-[0.2em] text-fg/50 uppercase">
          ← 홈으로
        </Link>

        <h1 className="word-keep-all mb-4 font-kr text-xl font-medium">아카이브</h1>

        <p className="word-keep-all mb-8 font-kr text-[13px] leading-[1.8] font-light text-fg/70">
          직접 입고 모아 온 개인 소장분입니다. 대부분 한 점뿐이라 나가면 그것으로 끝이고,
          재입고를 약속드리지 않습니다.
        </p>

        {/* 이름은 Shop 시절 그대로지만 카테고리 필터가 붙은 범용 상품 그리드다 */}
        <MobileShopGrid products={products} />
      </main>

      <MobileFooter />
    </>
  );
}

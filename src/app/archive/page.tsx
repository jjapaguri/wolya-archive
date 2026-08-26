import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import SiteFooter from "@/components/SiteFooter";
import ShopGrid from "@/components/ShopGrid";
import { listArchiveProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Archive | WOLYA ARCHIVE",
  description: "주인장이 직접 모아 온 1점 한정 아카이브 아이템 전체 목록.",
};

/** 상품이 DB 에서 온다 — 요청마다 렌더한다. 이유는 `src/app/page.tsx` 상단 주석 참고. */
export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const products = await listArchiveProducts();

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
          아카이브
        </h1>

        <p className="word-keep-all mb-10 max-w-[640px] font-kr text-sm leading-[1.8] font-light text-fg/70">
          직접 입고 모아 온 개인 소장분입니다. 대부분 한 점뿐이라 나가면 그것으로 끝이고,
          재입고를 약속드리지 않습니다.
        </p>

        {/* 이름은 Shop 시절 그대로지만 카테고리 필터가 붙은 범용 상품 그리드다 */}
        <ShopGrid products={products} />
      </main>
      <SiteFooter />
    </>
  );
}

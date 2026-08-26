import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileFooter from "@/components/mobile/MobileFooter";
import MobileShopGrid from "@/components/mobile/MobileShopGrid";
import { listListedProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop | WOLYA ARCHIVE",
  description: "동대문에서 선별한 아카이브 의류 전체 목록.",
};

/** 상품이 DB 에서 온다 — 요청마다 렌더한다. 이유는 `src/app/page.tsx` 상단 주석 참고. */
export const dynamic = "force-dynamic";

export default async function MobileShopPage() {
  const products = await listListedProducts();

  return (
    <>
      <GrainOverlay alpha={15} frameIntervalMs={50} />
      <MobileHeader />

      <main className="w-full px-6 pt-[92px] pb-16">
        <Link href="/m" className="mb-6 inline-block text-[10px] tracking-[0.2em] text-fg/50 uppercase">
          ← 홈으로
        </Link>

        <MobileShopGrid products={products} />
      </main>

      <MobileFooter />
    </>
  );
}

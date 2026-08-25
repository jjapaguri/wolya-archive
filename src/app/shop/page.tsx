import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import SiteFooter from "@/components/SiteFooter";
import ShopGrid from "@/components/ShopGrid";
import { listListedProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop | WOLYA ARCHIVE",
  description: "동대문에서 선별한 아카이브 의류 전체 목록.",
};

/** 상품이 DB 에서 온다 — 요청마다 렌더한다. 이유는 `src/app/page.tsx` 상단 주석 참고. */
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = await listListedProducts();

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

        <ShopGrid products={products} />
      </main>
      <SiteFooter />
    </>
  );
}

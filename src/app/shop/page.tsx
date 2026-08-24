import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import SiteFooter from "@/components/SiteFooter";
import ShopGrid from "@/components/ShopGrid";
import { listedProducts } from "@/data/products";

export const metadata: Metadata = {
  title: "Shop | WOLYA ARCHIVE",
  description: "동대문에서 선별한 아카이브 의류 전체 목록.",
};

export default function ShopPage() {
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

        <span className="mb-10 block font-maruburi text-sm font-bold tracking-[0.2em] text-accent uppercase">
          #전체 아이템
        </span>

        <ShopGrid products={listedProducts} />
      </main>
      <SiteFooter />
    </>
  );
}

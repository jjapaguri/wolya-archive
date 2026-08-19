import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileFooter from "@/components/mobile/MobileFooter";
import MobileProductCard from "@/components/mobile/MobileProductCard";
import { products } from "@/data/products";

export const metadata: Metadata = {
  title: "Shop | WOLYA ARCHIVE",
  description: "동대문에서 선별한 아카이브 의류 전체 목록.",
};

export default function MobileShopPage() {
  return (
    <>
      <GrainOverlay alpha={15} frameIntervalMs={50} />
      <MobileHeader />

      <main className="w-full px-6 pt-[92px] pb-16">
        <Link href="/m" className="mb-6 inline-block text-[10px] tracking-[0.2em] text-fg/50 uppercase">
          ← 홈으로
        </Link>

        <span className="mb-6 block font-kr text-xs font-bold tracking-[0.2em] text-accent uppercase">
          #전체 아이템
        </span>

        <div className="flex flex-col items-center gap-6">
          {products.map((product) => (
            <MobileProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>

      <MobileFooter />
    </>
  );
}

import MobileProductCard from "./MobileProductCard";
import { products } from "@/data/products";

export default function MobileProducts() {
  return (
    <section className="overflow-hidden border-b border-fg/10 bg-bg py-16">
      <span className="mb-8 block px-6 font-kr text-xs font-bold tracking-[0.2em] text-accent uppercase">
        #아이템 소개
      </span>

      <div className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4">
        {products.map((product) => (
          <MobileProductCard key={product.id} product={product} />
        ))}
        {/* 마지막 카드 오른쪽 여백 */}
        <div className="w-2 shrink-0" aria-hidden="true" />
      </div>
    </section>
  );
}

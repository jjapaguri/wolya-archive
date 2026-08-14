import ProductCard from "./ProductCard";
import { topRowProducts, bottomRowProducts } from "@/data/products";

export default function ProductsSection() {
  return (
    <section className="relative z-10 overflow-hidden border-t border-border bg-bg py-20 lg:py-[120px]">
      <span className="mb-[60px] block px-6 font-maruburi text-sm font-bold tracking-[0.2em] text-accent uppercase lg:px-20">
        #아이템 소개
      </span>

      <div className="overflow-hidden">
        <div className="scroll-row-top mb-6 flex w-max gap-6">
          {topRowProducts.map((product, i) => (
            <ProductCard key={`top-${product.id}-${i}`} product={product} />
          ))}
        </div>

        <div className="scroll-row-bottom flex w-max gap-6">
          {bottomRowProducts.map((product, i) => (
            <ProductCard key={`bottom-${product.id}-${i}`} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

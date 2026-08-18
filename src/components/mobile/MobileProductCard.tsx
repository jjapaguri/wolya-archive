import Image from "next/image";
import type { Product } from "@/data/products";

/**
 * 모바일 상품 카드. 데스크톱 카드와 같은 `Product` 데이터를 쓰되,
 * 좁은 화면에 맞춰 원단·핏·사입 수량만 노출한다.
 */
export default function MobileProductCard({ product }: { product: Product }) {
  return (
    <article className="w-[280px] shrink-0 snap-center border border-fg/10 bg-fg/[0.02] p-5">
      <div className="relative mb-5 h-[320px] w-full overflow-hidden bg-accent-dim">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="280px"
          className="object-cover [filter:grayscale(30%)_contrast(1.1)_brightness(0.85)]"
        />
      </div>

      <div className="mb-2 text-[9px] tracking-[0.2em] text-accent uppercase">{product.tag}</div>
      <div className="word-keep-all mb-1 font-kr text-[15px] font-medium text-fg">
        {product.name}
      </div>
      <div className="word-keep-all mb-5 font-kr text-[12px] font-light text-fg/70">
        {product.hook}
      </div>

      <div className="flex flex-col gap-3 border-t border-fg/10 pt-4">
        <div className="word-keep-all font-kr text-[11px] leading-[1.5] text-fg/50">
          <strong className="mb-1 block text-[10px] font-medium tracking-[0.1em] text-fg/80 uppercase">
            원단
          </strong>
          {product.fabric}
        </div>
        <div className="word-keep-all font-kr text-[11px] leading-[1.5] text-fg/50">
          <strong className="mb-1 block text-[10px] font-medium tracking-[0.1em] text-fg/80 uppercase">
            핏
          </strong>
          {product.fit}
        </div>
        <div className="word-keep-all font-kr text-[11px] leading-[1.5] text-fg/50">
          <strong className="mb-1 block text-[10px] font-medium tracking-[0.1em] text-fg/80 uppercase">
            사입 수량
          </strong>
          <span className="mt-1 block font-serif text-base text-accent italic">
            {product.stock}
          </span>
        </div>
      </div>

      <div className="mt-4 text-[10px] tracking-[0.05em] text-accent">{product.categories}</div>
    </article>
  );
}

import Image from "next/image";
import Link from "next/link";
import { formatPrice, type Product } from "@/data/products";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="block w-[280px] shrink-0 border border-border bg-fg/[0.02] p-6 transition-colors duration-300 hover:border-accent lg:w-[320px]"
    >
      <div className="relative mb-5 h-[320px] w-full bg-accent-dim lg:h-[380px]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="320px"
          className="object-cover [filter:grayscale(30%)_contrast(1.1)_brightness(0.85)]"
        />
      </div>

      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="font-sans text-[9px] tracking-[0.2em] text-accent uppercase">
          {product.tag}
        </span>
        <span className="font-sans text-[9px] tracking-[0.1em] text-fg/40 uppercase">
          {product.size}
        </span>
      </div>

      <div className="mb-1 font-sans text-[10px] tracking-[0.15em] text-fg/50 uppercase">
        {product.brand}
      </div>
      <div className="word-keep-all mb-1 font-maruburi text-base font-medium text-fg">
        {product.name}
      </div>
      <div className="word-keep-all mb-4 font-kr text-[13px] font-light text-fg/70">
        {product.hook}
      </div>

      <div className="mb-5 font-serif text-xl text-accent">{formatPrice(product.price)}</div>

      <div className="flex flex-col gap-2.5 border-t border-border pt-4">
        <div className="word-keep-all font-kr text-[11px] leading-[1.6] text-fg/50">
          <strong className="mb-0.5 block text-[10px] font-medium tracking-[0.1em] text-fg/80 uppercase">
            상태
          </strong>
          {product.condition}
        </div>
        <div className="word-keep-all font-kr text-[11px] leading-[1.6] text-fg/50">
          <strong className="mb-0.5 block text-[10px] font-medium tracking-[0.1em] text-fg/80 uppercase">
            원단
          </strong>
          {product.fabric}
        </div>
        <div className="word-keep-all font-kr text-[11px] leading-[1.6] text-fg/50">
          <strong className="mb-0.5 block text-[10px] font-medium tracking-[0.1em] text-fg/80 uppercase">
            핏
          </strong>
          {product.fit}
        </div>
        <div className="word-keep-all font-kr text-[11px] leading-[1.6] text-fg/50">
          <strong className="mb-0.5 block text-[10px] font-medium tracking-[0.1em] text-fg/80 uppercase">
            실측
          </strong>
          {product.measurements}
        </div>
        <div className="word-keep-all font-kr text-[11px] leading-[1.6] text-fg/50">
          <strong className="mb-0.5 block text-[10px] font-medium tracking-[0.1em] text-fg/80 uppercase">
            재고
          </strong>
          <span className="mt-1 inline-block font-serif text-lg text-accent italic">
            {product.stock}
          </span>
        </div>
        <div className="word-keep-all font-kr text-[11px] leading-[1.6] text-fg/50">
          <strong className="mb-0.5 block text-[10px] font-medium tracking-[0.1em] text-fg/80 uppercase">
            추천 대상
          </strong>
          {product.recommendedFor}
        </div>
      </div>

      <div className="mt-3 font-sans text-[10px] tracking-[0.05em] text-accent">
        {product.tags}
      </div>
    </Link>
  );
}

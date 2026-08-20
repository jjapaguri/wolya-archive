import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileFooter from "@/components/mobile/MobileFooter";
import { formatPrice, getProductBySlug, products } from "@/data/products";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/m/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};

  return {
    title: `${product.name} | WOLYA ARCHIVE`,
    description: product.hook,
  };
}

const detailRows = (product: NonNullable<ReturnType<typeof getProductBySlug>>) => [
  { label: "상태", value: product.condition },
  { label: "원단", value: product.fabric },
  { label: "핏", value: product.fit },
  { label: "실측", value: product.measurements },
  { label: "추천 대상", value: product.recommendedFor },
];

export default async function MobileProductDetailPage({
  params,
}: PageProps<"/m/product/[slug]">) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <>
      <GrainOverlay alpha={15} frameIntervalMs={50} />
      <MobileHeader />

      <main className="w-full px-6 pt-[92px] pb-16">
        <Link
          href="/m"
          className="mb-6 inline-block text-[10px] tracking-[0.2em] text-fg/50 uppercase"
        >
          ← 아카이브로 돌아가기
        </Link>

        <div className="hide-scrollbar mb-6 flex snap-x snap-mandatory gap-3 overflow-x-auto">
          {product.images.map((src, i) => (
            <div
              key={src}
              className="relative h-[380px] w-full shrink-0 snap-center overflow-hidden bg-accent-dim"
            >
              <Image
                src={src}
                alt={`${product.name} ${i + 1}`}
                fill
                sizes="100vw"
                priority={i === 0}
                className="object-cover [filter:grayscale(30%)_contrast(1.1)_brightness(0.85)]"
              />
            </div>
          ))}
        </div>

        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-[9px] tracking-[0.2em] text-accent uppercase">{product.tag}</span>
          <span className="text-[9px] tracking-[0.1em] text-fg/40 uppercase">
            {product.brand} · {product.size}
          </span>
        </div>
        <h1 className="word-keep-all mb-1 font-kr text-xl font-medium text-fg">{product.name}</h1>
        <p className="word-keep-all mb-5 font-kr text-[13px] font-light text-fg/70">
          {product.hook}
        </p>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <span className="font-serif text-2xl text-accent">{formatPrice(product.price)}</span>
          <a
            href="http://pf.kakao.com/_bvxlSX"
            target="_blank"
            rel="noreferrer"
            className="border border-accent px-4 py-2 text-[11px] tracking-[0.15em] text-accent uppercase"
          >
            구매 문의
          </a>
        </div>

        <div className="flex flex-col gap-4 border-t border-fg/10 pt-5">
          {detailRows(product).map((row) => (
            <div
              key={row.label}
              className="word-keep-all font-kr text-[12px] leading-[1.5] text-fg/50"
            >
              <strong className="mb-1 block text-[10px] font-medium tracking-[0.1em] text-fg/80 uppercase">
                {row.label}
              </strong>
              {row.value}
            </div>
          ))}

          <div className="word-keep-all font-kr text-[12px] leading-[1.5] text-fg/50">
            <strong className="mb-1 block text-[10px] font-medium tracking-[0.1em] text-fg/80 uppercase">
              재고
            </strong>
            <span className="mt-1 block font-serif text-base text-accent italic">
              {product.stock}
            </span>
          </div>
        </div>

        <div className="mt-5 text-[10px] tracking-[0.05em] text-accent">{product.tags}</div>
      </main>

      <MobileFooter />
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import SiteFooter from "@/components/SiteFooter";
import { formatPrice, type Product } from "@/data/products";
import { getProductBySlug } from "@/lib/products";

/**
 * 상세페이지도 요청마다 렌더한다 — `generateStaticParams` 로 빌드 때 굳히지 않는다.
 *
 * 굳히면 (1) 팔린 옷이 다음 배포까지 "구매 문의" 를 계속 달고 있고,
 * (2) DB 없는 CI 빌드에서는 slug 목록이 빈 배열이 돼 상세페이지가 통째로 사라진다.
 * 이유는 `src/app/page.tsx` 상단 주석 참고.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return {
    title: `${product.name} | WOLYA ARCHIVE`,
    description: product.hook,
  };
}

const detailRows = (product: Product) => [
  { label: "상태", value: product.condition },
  { label: "원단", value: product.fabric },
  { label: "핏", value: product.fit },
  { label: "실측", value: product.measurements },
  { label: "추천 대상", value: product.recommendedFor },
];

export default async function ProductDetailPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <>
      <GrainOverlay />
      <main className="relative z-10 mx-auto max-w-[1000px] px-6 pt-16 pb-24 lg:px-20 lg:pt-24">
        <Link
          href="/"
          className="mb-10 inline-block font-sans text-[10px] tracking-[0.2em] text-fg/50 uppercase transition-colors hover:text-accent"
        >
          ← 아카이브로 돌아가기
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,480px)_1fr] lg:gap-16">
          <div className="flex flex-col gap-3">
            {product.images.map((src, i) => (
              <div
                key={src}
                className="relative h-[420px] w-full bg-accent-dim lg:h-[560px]"
              >
                <Image
                  src={src}
                  alt={`${product.name} ${i + 1}`}
                  fill
                  sizes="(min-width: 1200px) 480px, 100vw"
                  priority={i === 0}
                  className="object-cover [filter:grayscale(30%)_contrast(1.1)_brightness(0.85)]"
                />
              </div>
            ))}
          </div>

          <div>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <span className="flex items-center gap-2 font-sans text-[10px] tracking-[0.2em] text-accent uppercase">
                {product.tag}
                {product.status === "preorder" && (
                  <span className="border border-accent px-2 py-0.5 text-[9px] tracking-[0.1em] text-accent">
                    예약주문
                  </span>
                )}
                {product.status === "sold" && (
                  <span className="border border-fg/30 px-2 py-0.5 text-[9px] tracking-[0.1em] text-fg/50">
                    판매완료
                  </span>
                )}
              </span>
              <span className="font-sans text-[10px] tracking-[0.1em] text-fg/40 uppercase">
                {product.brand} · {product.size}
              </span>
            </div>
            <h1 className="word-keep-all mb-2 font-maruburi text-2xl font-medium text-fg lg:text-3xl">
              {product.name}
            </h1>
            <p className="word-keep-all mb-6 font-kr text-sm font-light text-fg/70">{product.hook}</p>

            <div className="mb-8">
              <div className="mb-4 flex flex-wrap items-baseline gap-4">
                <span className="font-serif text-3xl text-accent">
                  {formatPrice(product.price)}
                </span>
                {product.status === "sold" ? (
                  <span
                    aria-disabled="true"
                    className="cursor-not-allowed border border-fg/20 px-5 py-2 font-sans text-[11px] tracking-[0.15em] text-fg/40 uppercase"
                  >
                    판매완료
                  </span>
                ) : (
                  <a
                    href="http://pf.kakao.com/_bvxlSX"
                    target="_blank"
                    rel="noreferrer"
                    className="border border-accent px-5 py-2 font-sans text-[11px] tracking-[0.15em] text-accent uppercase transition-colors hover:bg-accent hover:text-bg"
                  >
                    구매 문의
                  </a>
                )}
              </div>
              {product.status === "preorder" && (
                <p className="word-keep-all border border-accent/40 bg-accent/[0.06] px-4 py-3 font-kr text-[12px] leading-[1.6] text-accent">
                  사입 확인 후 확정됩니다. 확보에 실패하면 3영업일 내 전액 환불됩니다.
                </p>
              )}
              {product.status === "sold" && (
                <p className="word-keep-all border border-fg/20 bg-fg/[0.03] px-4 py-3 font-kr text-[12px] leading-[1.6] text-fg/50">
                  판매완료된 상품입니다. 같은 옷은 1점만 있어 재입고되지 않습니다.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-4 border-t border-border pt-6">
              {detailRows(product).map((row) => (
                <div
                  key={row.label}
                  className="word-keep-all font-kr text-[13px] leading-[1.6] text-fg/60"
                >
                  <strong className="mb-1 block text-[10px] font-medium tracking-[0.1em] text-fg/80 uppercase">
                    {row.label}
                  </strong>
                  {row.value}
                </div>
              ))}

              <div className="word-keep-all font-kr text-[13px] leading-[1.6] text-fg/60">
                <strong className="mb-1 block text-[10px] font-medium tracking-[0.1em] text-fg/80 uppercase">
                  재고
                </strong>
                <span className="inline-block font-serif text-xl text-accent italic">
                  {product.stock}
                </span>
              </div>
            </div>

            <div className="mt-6 font-sans text-[11px] tracking-[0.05em] text-accent">
              {product.tags}
            </div>

            {product.note && (
              <div className="word-keep-all mt-6 border-t border-border pt-4 font-kr text-[12px] leading-[1.6] text-fg/50">
                <strong className="mb-1 block text-[10px] font-medium tracking-[0.1em] text-fg/70 uppercase">
                  판매자 고지
                </strong>
                {product.note}
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

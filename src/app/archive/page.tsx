import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Archive | WOLYA ARCHIVE",
  description: "WOLYA ARCHIVE 큐레이션 기록. 준비 중입니다.",
};

export default function ArchivePage() {
  return (
    <>
      <GrainOverlay />
      <main className="relative z-10 mx-auto max-w-[720px] px-6 pt-16 pb-24 lg:px-20 lg:pt-24">
        <Link
          href="/"
          className="mb-10 inline-block font-sans text-[10px] tracking-[0.2em] text-fg/50 uppercase transition-colors hover:text-accent"
        >
          ← 홈으로
        </Link>

        <h1 className="word-keep-all mb-8 font-maruburi text-2xl leading-relaxed font-semibold lg:text-3xl">
          큐레이션 기록
        </h1>

        <p className="word-keep-all mb-10 font-kr text-sm leading-[1.8] font-light text-fg/70">
          시즌마다 선별해 온 아이템들의 기록을 이곳에 정리하고 있습니다.
          아직 준비 중입니다. 지금 판매 중인 아이템은 아래에서 볼 수 있습니다.
        </p>

        <Link
          href="/shop"
          className="inline-flex items-center gap-2 border border-fg px-[30px] py-[15px] font-sans text-xs tracking-[0.2em] uppercase text-fg transition-all duration-[400ms] ease-[cubic-bezier(0.19,1,0.22,1)] hover:bg-fg hover:text-bg"
        >
          Shop 바로가기
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}

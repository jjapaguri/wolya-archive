import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileFooter from "@/components/mobile/MobileFooter";

export const metadata: Metadata = {
  title: "Archive | WOLYA ARCHIVE",
  description: "WOLYA ARCHIVE 큐레이션 기록. 준비 중입니다.",
};

export default function MobileArchivePage() {
  return (
    <>
      <GrainOverlay alpha={15} frameIntervalMs={50} />
      <MobileHeader />

      <main className="w-full px-6 pt-[92px] pb-16">
        <Link href="/m" className="mb-6 inline-block text-[10px] tracking-[0.2em] text-fg/50 uppercase">
          ← 홈으로
        </Link>

        <h1 className="word-keep-all mb-6 font-kr text-xl font-medium">큐레이션 기록</h1>

        <p className="word-keep-all mb-8 font-kr text-[13px] leading-[1.8] font-light text-fg/70">
          시즌마다 선별해 온 아이템들의 기록을 이곳에 정리하고 있습니다.
          아직 준비 중입니다. 지금 판매 중인 아이템은 아래에서 볼 수 있습니다.
        </p>

        <Link
          href="/m/shop"
          className="inline-flex items-center gap-2 border border-fg px-6 py-3 font-sans text-xs tracking-[0.2em] uppercase text-fg active:bg-fg active:text-bg"
        >
          Shop 바로가기
        </Link>
      </main>

      <MobileFooter />
    </>
  );
}

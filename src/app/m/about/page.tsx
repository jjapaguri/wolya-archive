import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileFooter from "@/components/mobile/MobileFooter";

export const metadata: Metadata = {
  title: "About | WOLYA ARCHIVE",
  description:
    "300여 개 브랜드, 7,000벌 이상의 시도 끝에 선별한 아이템들을 소개하는 WOLYA ARCHIVE 소개 페이지.",
};

export default function MobileAboutPage() {
  return (
    <>
      <GrainOverlay alpha={15} frameIntervalMs={50} />
      <MobileHeader />

      <main className="w-full px-6 pt-[92px] pb-16">
        <Link href="/m" className="mb-6 inline-block text-[10px] tracking-[0.2em] text-fg/50 uppercase">
          ← 홈으로
        </Link>

        <h1 className="word-keep-all mb-6 font-kr text-xl leading-relaxed font-medium">
          동대문에서 선별한 트렌디하고 힙한 아이템들을 감각적인 큐레이션으로
          합리적인 가격에 제안하는 셀렉트샵.
        </h1>

        <p className="word-keep-all mb-8 font-kr text-[13px] leading-[1.8] font-light text-fg/70">
          300여 개 브랜드, 7,000벌 이상의 시도 끝에 선별한 아이템들. 매주
          브랜드를 뒤지고, 직접 입고, 만져보고, 대부분은 버립니다. 수천 번의
          거절 끝에 살아남은 것들만을 당신의 옷장에 소개합니다. 이것은 단순한
          판매가 아닌, 생존한 미학의 기록입니다.
        </p>

        <div className="mb-8 grid grid-cols-2 gap-5 border-t border-fg/10 pt-6">
          <div className="flex flex-col">
            <span className="font-serif text-2xl text-accent italic">300+</span>
            <span className="mt-1 font-sans text-[9px] tracking-[0.2em] uppercase opacity-60">
              Brands Scoped
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl text-accent italic">7.2k</span>
            <span className="mt-1 font-sans text-[9px] tracking-[0.2em] uppercase opacity-60">
              Items Tested
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-fg/10 pt-5 font-kr text-[13px] text-fg/60">
          <div className="flex gap-3">
            <span className="min-w-[60px] text-[10px] font-medium tracking-[0.15em] text-accent uppercase">
              대표자
            </span>
            <span className="text-fg/80">전종민</span>
          </div>
        </div>
      </main>

      <MobileFooter />
    </>
  );
}

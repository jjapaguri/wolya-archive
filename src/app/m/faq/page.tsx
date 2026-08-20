import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileFooter from "@/components/mobile/MobileFooter";
import { faqs } from "@/lib/faq-content";

export const metadata: Metadata = {
  title: "FAQ | WOLYA ARCHIVE",
  description: "WOLYA ARCHIVE 자주 묻는 질문 — 사이즈, 결제, 배송, 반품·교환 안내.",
};

export default function MobileFaqPage() {
  return (
    <>
      <GrainOverlay alpha={15} frameIntervalMs={50} />
      <MobileHeader />

      <main className="w-full px-6 pt-[92px] pb-16">
        <Link href="/m" className="mb-6 inline-block text-[10px] tracking-[0.2em] text-fg/50 uppercase">
          ← 홈으로
        </Link>

        <span className="mb-6 block font-kr text-xs font-bold tracking-[0.2em] text-accent uppercase">
          #FAQ
        </span>

        <h1 className="word-keep-all mb-8 font-kr text-xl leading-relaxed font-medium">
          자주 묻는 질문
        </h1>

        <div className="flex flex-col gap-6">
          {faqs.map((faq) => (
            <div key={faq.question} className="border-t border-fg/10 pt-6">
              <h2 className="word-keep-all mb-3 font-kr text-[15px] font-medium text-fg">
                Q. {faq.question}
              </h2>
              <p className="word-keep-all font-kr text-[13px] leading-[1.7] font-light text-fg/70">
                A. {faq.answer}
              </p>
            </div>
          ))}
        </div>

        <p className="word-keep-all mt-10 border-t border-fg/10 pt-6 font-kr text-[11px] leading-[1.7] text-fg/50">
          더 궁금한 점은{" "}
          <Link href="/m/contact" className="text-accent underline underline-offset-2">
            문의하기
          </Link>
          로 남겨주세요.
        </p>
      </main>

      <MobileFooter />
    </>
  );
}

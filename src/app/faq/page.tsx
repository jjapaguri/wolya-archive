import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import SiteFooter from "@/components/SiteFooter";
import { faqs } from "@/lib/faq-content";

export const metadata: Metadata = {
  title: "FAQ | WOLYA ARCHIVE",
  description: "WOLYA ARCHIVE 자주 묻는 질문 — 사이즈, 결제, 배송, 반품·교환 안내.",
};

export default function FaqPage() {
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

        <h1 className="word-keep-all mb-10 font-maruburi text-2xl leading-relaxed font-semibold lg:text-3xl">
          자주 묻는 질문
        </h1>

        <div className="flex flex-col gap-8">
          {faqs.map((faq) => (
            <div key={faq.question} className="border-t border-border pt-6">
              <h2 className="word-keep-all mb-3 font-maruburi text-base font-medium text-fg">
                Q. {faq.question}
              </h2>
              <p className="word-keep-all font-kr text-sm leading-[1.8] font-light text-fg/70">
                A. {faq.answer}
              </p>
            </div>
          ))}
        </div>

        <p className="word-keep-all mt-10 border-t border-border pt-6 font-kr text-xs leading-[1.7] text-fg/50">
          더 궁금한 점은{" "}
          <Link href="/contact" className="text-accent underline underline-offset-2">
            문의하기
          </Link>
          로 남겨주세요.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}

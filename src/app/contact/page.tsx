import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Contact | WOLYA ARCHIVE",
  description: "WOLYA ARCHIVE 문의 채널 안내.",
};

const channels = [
  { label: "인스타그램", value: "@iwannabebratpitt", href: "https://instagram.com/iwannabebratpitt" },
  { label: "카카오톡", value: "아카이브_월야", href: "http://pf.kakao.com/_bvxlSX" },
];

export default function ContactPage() {
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
          문의하기
        </h1>

        <p className="word-keep-all mb-10 font-kr text-sm leading-[1.8] font-light text-fg/70">
          고객센터 전화·이메일 채널은 오픈 준비 중입니다. 지금은 아래 SNS
          채널로 문의해 주세요.
        </p>

        <div className="flex flex-col gap-4 border-t border-border pt-6 font-kr text-sm text-fg/60">
          {channels.map((channel) => (
            <div key={channel.label} className="flex flex-wrap items-baseline gap-3">
              <span className="min-w-[100px] text-[10px] font-medium tracking-[0.15em] text-accent uppercase">
                {channel.label}
              </span>
              <a
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg/80 underline underline-offset-4 transition-colors hover:text-accent"
              >
                {channel.value}
              </a>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileFooter from "@/components/mobile/MobileFooter";

export const metadata: Metadata = {
  title: "Contact | WOLYA ARCHIVE",
  description: "WOLYA ARCHIVE 문의 채널 안내.",
};

const channels = [
  { label: "인스타그램", value: "@[계정명]" },
  { label: "카카오톡", value: "[채널명/링크]" },
];

export default function MobileContactPage() {
  return (
    <>
      <GrainOverlay alpha={15} frameIntervalMs={50} />
      <MobileHeader />

      <main className="w-full px-6 pt-[92px] pb-16">
        <Link href="/m" className="mb-6 inline-block text-[10px] tracking-[0.2em] text-fg/50 uppercase">
          ← 홈으로
        </Link>

        <span className="mb-6 block font-kr text-xs font-bold tracking-[0.2em] text-accent uppercase">
          #Contact
        </span>

        <h1 className="word-keep-all mb-6 font-kr text-xl font-medium">문의하기</h1>

        <p className="word-keep-all mb-8 font-kr text-[13px] leading-[1.8] font-light text-fg/70">
          고객센터 전화·이메일 채널은 오픈 준비 중입니다. 지금은 아래 SNS
          채널로 문의해 주세요.
        </p>

        <div className="flex flex-col gap-3 border-t border-fg/10 pt-5 font-kr text-[13px] text-fg/60">
          {channels.map((channel) => (
            <div key={channel.label} className="flex flex-wrap items-baseline gap-3">
              <span className="min-w-[90px] text-[10px] font-medium tracking-[0.15em] text-accent uppercase">
                {channel.label}
              </span>
              <span className="text-fg/80">{channel.value}</span>
            </div>
          ))}
        </div>
      </main>

      <MobileFooter />
    </>
  );
}

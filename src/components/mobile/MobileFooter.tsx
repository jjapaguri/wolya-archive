import type { ReactNode } from "react";
import Link from "next/link";
import { businessInfo } from "@/data/business";
import DesktopViewLink from "./DesktopViewLink";

/** 카카오톡 채널 — 하단 소셜 링크와 교환·반품 문의가 같이 쓴다 */
const KAKAO_CHANNEL_URL = "http://pf.kakao.com/_bvxlSX";

const businessFields = [
  { label: "상호", value: businessInfo.name },
  { label: "대표자", value: businessInfo.representative },
  { label: "사업자등록번호", value: businessInfo.registrationNumber },
  { label: "통신판매업", value: businessInfo.mailOrderLicenseNumber },
  { label: "사업장 소재지", value: businessInfo.address, wide: true },
  { label: "연락처", value: businessInfo.phone },
].filter((field) => field.value !== "");

function Row({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="flex items-start justify-between">
      <span className="mt-0.5 shrink-0 text-[9px] font-medium tracking-[0.1em] text-accent uppercase">
        {label}
      </span>
      <span className={wide ? "w-2/3 text-right" : "text-right"}>{children}</span>
    </div>
  );
}

export default function MobileFooter() {
  return (
    <footer className="relative z-10 bg-bg px-6 py-12">
      <div className="mb-10 flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="mb-2 font-serif text-xl text-fg italic">WOLYA ARCHIVE</div>
          <div className="word-keep-all flex flex-col gap-1 font-kr text-[11px] leading-[1.6] text-fg/60">
            {businessFields.map((field) => (
              <Row key={field.label} label={field.label} wide={field.wide}>
                {field.value}
              </Row>
            ))}
          </div>
        </div>

        <div className="word-keep-all flex flex-col gap-1 font-kr text-[11px] leading-[1.6] text-fg/60">
          <Row label="고객센터">
            <a href={`tel:${businessInfo.phone.replace(/-/g, "")}`} className="active:opacity-50">
              {businessInfo.phone}
            </a>
            <br />
            <span className="text-[10px] text-fg/40">(운영 10:00~22:00, 주말/공휴일 휴무)</span>
          </Row>
          <Row label="이메일">
            <a href={`mailto:${businessInfo.email}`} className="active:opacity-50">
              {businessInfo.email}
            </a>
          </Row>
          <Row label="개인정보책임" wide>
            {businessInfo.representative} / {businessInfo.email}
          </Row>
          <Row label="교환·반품 문의" wide>
            <a
              href={KAKAO_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="active:opacity-50"
            >
              카카오톡 채널 아카이브_월야
            </a>
          </Row>
          {/* 주소는 복사해 두지 않는다 — 소재지가 바뀌면 businessInfo 한 곳만 고치면 되게 */}
          <Row label="반품 주소">사업장 소재지와 동일</Row>
        </div>
      </div>

      <div className="mb-8 h-px w-full bg-fg/10" />

      <div className="mb-8 flex flex-col gap-4 font-kr text-[11px] text-fg/70">
        <a
          href="https://instagram.com/iwannabebratpitt"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 active:opacity-50"
        >
          <span>[IG]</span> 인스타그램 @iwannabebratpitt
        </a>
        <a
          href={KAKAO_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 active:opacity-50"
        >
          <span>[KT]</span> 카카오톡 채널 아카이브_월야
        </a>
      </div>

      <div className="mb-6 h-px w-full bg-fg/10" />

      <div className="mb-8 flex justify-center gap-4 text-[9px] tracking-[0.1em] text-fg/50 uppercase">
        <Link href="/m/legal/terms">이용약관</Link>
        <span className="text-fg/20">|</span>
        <Link href="/m/legal/privacy">개인정보처리방침</Link>
        <span className="text-fg/20">|</span>
        <Link href="/m/legal/refund">교환/환불 규정</Link>
      </div>

      <div className="mb-6 text-center">
        <DesktopViewLink />
      </div>

      <div className="text-center text-[9px] tracking-[0.05em] text-fg/30">
        © 2024 [브랜드명]. ALL RIGHTS RESERVED.
      </div>
    </footer>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { businessInfo } from "@/data/business";
import DesktopViewLink from "./DesktopViewLink";

/**
 * 소셜 아이콘 — 데스크톱 `SiteFooter` 와 같은 path 를 쓴다.
 * 모바일 컴포넌트는 데스크톱 것을 import 하지 않는 규칙이라 복사해 둔다 (`docs/MAP.md`).
 */
function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3C6.48 3 2 6.58 2 11c0 2.86 1.9 5.37 4.76 6.79-.2.75-.74 2.75-.84 3.18-.13.53.2.52.42.38.17-.11 2.72-1.85 3.82-2.6.6.09 1.22.13 1.84.13 5.52 0 10-3.58 10-8s-4.48-8-10-8Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

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
  const year = new Date().getFullYear();

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
          <InstagramIcon /> 인스타그램 @iwannabebratpitt
        </a>
        <a
          href={KAKAO_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 active:opacity-50"
        >
          <KakaoIcon /> 카카오톡 채널 아카이브_월야
        </a>
      </div>

      <div className="mb-6 h-px w-full bg-fg/10" />

      {/* 회원 진입점 — 데스크톱 짝은 `src/components/SiteFooter.tsx` 다. 같이 고친다 */}
      <div className="mb-5 flex justify-center text-[9px] tracking-[0.1em] text-fg/50 uppercase">
        <Link href="/m/account">로그인 · 내 정보</Link>
      </div>

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
        © {year} WOLYA ARCHIVE. All rights reserved.
      </div>
    </footer>
  );
}

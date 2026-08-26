import Link from "next/link";
import { businessInfo } from "@/data/business";

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

const businessFields = [
  { label: "상호", value: businessInfo.name },
  { label: "대표자", value: businessInfo.representative },
  { label: "사업자등록번호", value: businessInfo.registrationNumber },
  { label: "통신판매업 신고번호", value: businessInfo.mailOrderLicenseNumber },
  { label: "사업장 소재지", value: businessInfo.address },
  { label: "연락처", value: businessInfo.phone },
].filter((field) => field.value !== "");

/** 카카오톡 채널 — 하단 소셜 링크와 교환·반품 문의가 같이 쓴다 */
const KAKAO_CHANNEL_URL = "http://pf.kakao.com/_bvxlSX";

type SupportField = {
  label: string;
  value: string;
  /** 값에 링크를 걸 주소. 없으면 텍스트로만 보여준다 */
  href?: string;
  /** 새 탭으로 여는 외부 링크인지 */
  external?: boolean;
  note?: string;
};

const supportFields: SupportField[] = [
  {
    label: "고객센터",
    value: businessInfo.phone,
    href: `tel:${businessInfo.phone.replace(/-/g, "")}`,
    note: "(운영 10:00~22:00, 주말/공휴일 휴무)",
  },
  { label: "이메일", value: businessInfo.email, href: `mailto:${businessInfo.email}` },
  {
    label: "개인정보관리책임자",
    value: `${businessInfo.representative} / ${businessInfo.email}`,
  },
  {
    label: "교환·반품 문의",
    value: "카카오톡 채널 아카이브_월야",
    href: KAKAO_CHANNEL_URL,
    external: true,
  },
  // 주소는 복사해 두지 않는다 — 사업장 소재지가 바뀌면 businessInfo 한 곳만 고치면 되게
  { label: "반품 주소", value: "사업장 소재지와 동일" },
];

const legalLinks = [
  { label: "이용약관", href: "/legal/terms" },
  { label: "개인정보처리방침", href: "/legal/privacy" },
  { label: "교환/환불 규정", href: "/legal/refund" },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-border bg-bg px-6 pt-20 pb-10 lg:px-20">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-[60px] grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-[60px]">
          <div className="flex flex-col gap-4">
            <div className="mb-5 font-serif text-2xl text-fg italic">WOLYA ARCHIVE</div>
            {businessFields.map((field) => (
              <div
                key={field.label}
                className="word-keep-all flex flex-wrap items-baseline gap-3 font-kr text-sm leading-[1.6] text-fg/60"
              >
                <span className="min-w-[120px] text-[10px] font-medium tracking-[0.15em] text-accent uppercase">
                  {field.label}
                </span>
                <span className="text-fg/80">{field.value}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {supportFields.map((field) => (
              <div
                key={field.label}
                className="word-keep-all flex flex-wrap items-baseline gap-3 font-kr text-sm leading-[1.6] text-fg/60"
              >
                <span className="min-w-[120px] text-[10px] font-medium tracking-[0.15em] text-accent uppercase">
                  {field.label}
                </span>
                {field.href ? (
                  <a
                    href={field.href}
                    {...(field.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="text-fg/80 transition-colors hover:text-accent"
                  >
                    {field.value}
                  </a>
                ) : (
                  <span className="text-fg/80">{field.value}</span>
                )}
                {field.note && <span className="text-xs text-fg/40">{field.note}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto h-px max-w-[1200px] bg-border" />

        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 py-[30px] font-kr text-sm text-fg/70 lg:flex-row lg:gap-10">
          <a
            href="https://instagram.com/iwannabebratpitt"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-colors hover:text-accent"
          >
            <InstagramIcon /> 인스타그램 @iwannabebratpitt
          </a>
          <a
            href={KAKAO_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-colors hover:text-accent"
          >
            <KakaoIcon /> 카카오톡 채널 아카이브_월야
          </a>
        </div>

        <div className="mx-auto h-px max-w-[1200px] bg-border" />

        {/* 회원 진입점 — 홈의 헤더 메뉴 말고는 들어갈 구멍이 없어서 여기에도 둔다.
            모바일 짝은 `src/components/mobile/MobileFooter.tsx` — 같이 고친다 */}
        <div className="mx-auto flex max-w-[1200px] justify-center pt-[30px] text-[11px] tracking-[0.1em] uppercase">
          <Link href="/account" className="text-fg/50 transition-colors hover:text-accent">
            로그인 · 내 정보
          </Link>
        </div>

        <div className="mx-auto flex max-w-[1200px] flex-wrap justify-center gap-5 py-[30px] text-[11px] tracking-[0.1em] uppercase">
          {legalLinks.map((link, i) => (
            <span key={link.href} className="flex items-center gap-5">
              <Link href={link.href} className="text-fg/50 transition-colors hover:text-accent">
                {link.label}
              </Link>
              {i < legalLinks.length - 1 && <span className="text-fg/20">|</span>}
            </span>
          ))}
        </div>

        <div className="mx-auto max-w-[1200px] pb-10 text-center text-[11px] tracking-[0.05em] text-fg/30">
          © {year} WOLYA ARCHIVE. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

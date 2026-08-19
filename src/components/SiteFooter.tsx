import Link from "next/link";

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

const contactFields = [
  { label: "대표자", value: "전종민" },
  {
    label: "사업자등록번호",
    value: "[000-00-00000]",
    link: { href: "#", text: "[사업자정보 확인] (공정위 표준 링크)" },
  },
  { label: "통신판매업 신고번호", value: "[제0000-서울OO-0000호]" },
  { label: "사업장 소재지", value: "[주소 전체 — 우편번호 포함]" },
];

const supportFields = [
  { label: "고객센터", value: "[전화번호]", note: "(운영시간 [10:00~22:00], 주말/공휴일 휴무)" },
  { label: "이메일", value: "[contact@example.com]" },
  { label: "개인정보관리책임자", value: "[담당자명 / 이메일]" },
  { label: "교환·반품 문의", value: "[전용 채널 안내 — 예: 카카오톡 채널 또는 이메일]" },
  { label: "반품 주소", value: "[실제 반품 수령 주소]" },
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
        <div className="word-keep-all mb-10 border-b border-border py-5 font-kr text-xs leading-[1.6] text-fg/50">
          전자상거래법(통신판매업 신고 사업자)상 하단 고지 의무 항목입니다.
          ⚠️ 통신판매업 신고번호·사업자등록번호는 관할 시/군/구청 또는
          정부24에서 신고 후 발급받은 실제 번호를 기재해야 합니다. 미신고
          상태로 온라인 판매·광고를 지속하면 과태료 대상입니다.
        </div>

        <div className="mb-[60px] grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-[60px]">
          <div className="flex flex-col gap-4">
            <div className="mb-5 font-serif text-2xl text-fg italic">WOLYA ARCHIVE</div>
            {contactFields.map((field) => (
              <div
                key={field.label}
                className="word-keep-all flex flex-wrap items-baseline gap-3 font-kr text-sm leading-[1.6] text-fg/60"
              >
                <span className="min-w-[120px] text-[10px] font-medium tracking-[0.15em] text-accent uppercase">
                  {field.label}
                </span>
                <span className="text-fg/80">{field.value}</span>
                {field.link && (
                  <a
                    href={field.link.href}
                    className="text-fg/50 underline decoration-solid underline-offset-[3px] transition-colors hover:text-accent"
                  >
                    {field.link.text}
                  </a>
                )}
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
                <span className="text-fg/80">{field.value}</span>
                {field.note && <span className="text-xs text-fg/40">{field.note}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto h-px max-w-[1200px] bg-border" />

        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 py-[30px] font-kr text-sm text-fg/70 lg:flex-row lg:gap-10">
          <span className="flex items-center gap-2">
            <InstagramIcon /> 인스타그램 @[계정명]
          </span>
          <span className="flex items-center gap-2">
            <KakaoIcon /> 카카오톡 채널 [채널명/링크]
          </span>
        </div>

        <div className="mx-auto h-px max-w-[1200px] bg-border" />

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

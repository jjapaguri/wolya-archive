import type { ReactNode } from "react";

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
      <div className="word-keep-all mb-8 border-b border-fg/10 pb-6 font-kr text-[10px] leading-[1.6] text-fg/40">
        전자상거래법(통신판매업 신고 사업자)상 하단 고지 의무 항목입니다. 통신판매업
        신고번호·사업자등록번호는 관할 시/군/구청 또는 정부24에서 신고 후 발급받은 실제 번호를
        기재해야 합니다.
      </div>

      <div className="mb-10 flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="mb-2 font-serif text-xl text-fg italic">[브랜드/샵 이름]</div>
          <div className="word-keep-all flex flex-col gap-1 font-kr text-[11px] leading-[1.6] text-fg/60">
            <Row label="대표자">전종민</Row>
            <Row label="사업자등록번호">
              [000-00-00000]
              <br />
              <a href="#" className="mt-1 inline-block text-fg/40 underline">
                [사업자정보 확인]
              </a>
            </Row>
            <Row label="통신판매업">[제0000-서울OO-0000호]</Row>
            <Row label="사업장 소재지" wide>
              [주소 전체 — 우편번호 포함]
            </Row>
          </div>
        </div>

        <div className="word-keep-all flex flex-col gap-1 font-kr text-[11px] leading-[1.6] text-fg/60">
          <Row label="고객센터">
            [전화번호]
            <br />
            <span className="text-[10px] text-fg/40">(운영 10:00~22:00, 주말 휴무)</span>
          </Row>
          <Row label="이메일">[contact@example.com]</Row>
          <Row label="개인정보책임">[담당자명 / 이메일]</Row>
          <Row label="교환·반품 문의">[카카오톡 채널 안내]</Row>
          <Row label="반품 주소" wide>
            [실제 반품 수령 주소]
          </Row>
        </div>
      </div>

      <div className="mb-8 h-px w-full bg-fg/10" />

      <div className="mb-8 flex flex-col gap-4 font-kr text-[11px] text-fg/70">
        <a href="#" className="flex items-center gap-2 active:opacity-50">
          <span>[IG]</span> 인스타그램 @[계정명]
        </a>
        <a href="#" className="flex items-center gap-2 active:opacity-50">
          <span>[KT]</span> 카카오톡 채널 [채널명/링크]
        </a>
      </div>

      <div className="mb-6 h-px w-full bg-fg/10" />

      <div className="mb-8 flex justify-center gap-4 text-[9px] tracking-[0.1em] text-fg/50 uppercase">
        <a href="#">이용약관</a>
        <span className="text-fg/20">|</span>
        <a href="#">개인정보처리방침</a>
        <span className="text-fg/20">|</span>
        <a href="#">교환/환불 규정</a>
      </div>

      <div className="mb-6 text-center">
        {/* 미들웨어가 ?view=desktop 을 읽어 쿠키에 저장하고 데스크톱 화면으로 보낸다. */}
        <a
          href="/?view=desktop"
          className="text-[9px] tracking-[0.15em] text-fg/40 uppercase underline underline-offset-4 active:text-fg"
        >
          데스크톱 버전으로 보기
        </a>
      </div>

      <div className="text-center text-[9px] tracking-[0.05em] text-fg/30">
        © 2024 [브랜드명]. ALL RIGHTS RESERVED.
      </div>
    </footer>
  );
}

import Link from "next/link";

const navLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Archive", href: "/archive" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function ContentPanel() {
  return (
    <section
      className="absolute top-0 right-0 z-20 flex h-full w-[350px] max-w-[85vw] flex-col justify-between
        border-l border-border bg-[rgba(13,11,10,0.95)] px-6 py-10 backdrop-blur-md
        lg:static lg:w-auto lg:max-w-none lg:bg-none lg:px-10 lg:py-[60px] lg:backdrop-blur-none"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, var(--bg-soft), var(--bg))",
      }}
    >
      <nav className="mb-[60px] flex justify-end gap-5 font-sans text-[11px] tracking-[0.1em] uppercase">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-fg transition-colors duration-300 hover:text-accent"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        <h2 className="word-keep-all mb-[30px] font-maruburi text-lg leading-relaxed font-semibold">
          동대문에서 선별한 트렌디하고 힙한 아이템들을 감각적인 큐레이션으로
          합리적인 가격에 제안하는 셀렉트샵.
        </h2>

        <p className="word-keep-all mb-10 text-justify font-kr text-[13px] leading-[1.8] font-light text-fg/70">
          300여 개 브랜드, 7,000벌 이상의 시도 끝에 선별한 아이템들. 매주
          브랜드를 뒤지고, 직접 입고, 만져보고, 대부분은 버립니다. 수천 번의
          거절 끝에 살아남은 것들만을 당신의 옷장에 소개합니다. 이것은 단순한
          판매가 아닌, 생존한 미학의 기록입니다.
        </p>

        <div className="grid grid-cols-2 gap-5 border-t border-border pt-[30px]">
          <div className="flex flex-col">
            <span className="font-serif text-3xl text-accent italic">300+</span>
            <span className="mt-[5px] font-sans text-[9px] tracking-[0.2em] uppercase opacity-60">
              Brands Scoped
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-3xl text-accent italic">7.2k</span>
            <span className="mt-[5px] font-sans text-[9px] tracking-[0.2em] uppercase opacity-60">
              Items Tested
            </span>
          </div>
        </div>

        {/* 실물이 있는 쪽으로 보낸다 — Shop 은 신상품 준비 중 안내만 있는 상태다 */}
        <Link
          href="/archive"
          className="mt-10 flex w-full items-center justify-between border border-fg px-[30px] py-[15px] font-sans text-xs tracking-[0.2em] uppercase text-fg transition-all duration-[400ms] ease-[cubic-bezier(0.19,1,0.22,1)] hover:bg-fg hover:text-bg"
        >
          <span>View Collections</span>
          <svg
            width="20"
            height="10"
            viewBox="0 0 20 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 5H1M19 5L15 1M19 5L15 9"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </Link>
      </div>
    </section>
  );
}

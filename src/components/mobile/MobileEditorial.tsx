const STATS = [
  { value: "300+", label: "Brands Scoped" },
  { value: "7.2k", label: "Items Tested" },
];

export default function MobileEditorial() {
  return (
    <section className="border-b border-fg/10 bg-gradient-to-b from-bg-soft to-bg px-6 py-12">
      <h2 className="word-keep-all mb-6 font-kr text-lg leading-[1.6] font-medium text-fg">
        동대문에서 선별한 트렌디하고 힙한 아이템들을 감각적인 큐레이션으로 합리적인 가격에
        제안하는 셀렉트샵.
      </h2>

      <div className="mb-6 h-px w-10 bg-accent" />

      <p className="word-keep-all mb-10 text-justify font-kr text-[13px] leading-[1.8] font-light text-fg/70">
        300여 개 브랜드, 7,000벌 이상의 시도 끝에 선별한 아이템들. 매주 브랜드를 뒤지고, 직접
        입고, 만져보고, 대부분은 버립니다. 수천 번의 거절 끝에 살아남은 것들만을 당신의 옷장에
        소개합니다. 이것은 단순한 판매가 아닌, 생존한 미학의 기록입니다.
      </p>

      <div className="grid grid-cols-2 gap-6 border-t border-fg/10 pt-8">
        {STATS.map((stat) => (
          <div key={stat.label} className="flex flex-col">
            <span className="font-serif text-4xl leading-none text-accent italic">
              {stat.value}
            </span>
            <span className="mt-2 text-[9px] tracking-[0.2em] uppercase opacity-60">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mt-10 flex w-full items-center justify-between border border-fg bg-transparent p-4 font-sans text-xs tracking-[0.2em] text-fg uppercase transition-colors active:bg-fg active:text-bg"
      >
        <span>VIEW COLLECTIONS</span>
        <svg width="20" height="10" viewBox="0 0 20 10" fill="none" aria-hidden="true">
          <path d="M19 5H1M19 5L15 1M19 5L15 9" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
    </section>
  );
}

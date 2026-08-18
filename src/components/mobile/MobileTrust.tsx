const TRUST_ITEMS = [
  "300여 개 브랜드 직접 조사",
  "7,000벌 이상 직접 시착",
  "통과율 3% 미만 큐레이션",
  "전 제품 실측 cm 단위 표기",
  "스타일당 [20]장 이하 소량 사입",
];

export default function MobileTrust() {
  return (
    <section className="border-b border-fg/10 bg-bg px-6 py-16">
      <span className="mb-8 block font-kr text-xs font-bold tracking-[0.2em] text-accent uppercase">
        #신뢰 요소
      </span>

      <div className="flex flex-col gap-4">
        {TRUST_ITEMS.map((item) => (
          <div
            key={item}
            className="flex items-start gap-2 border-t border-fg/10 pt-4 font-kr text-[14px] leading-[1.6] font-light text-fg/80"
          >
            <span className="mt-0.5 text-xs text-accent" aria-hidden="true">
              ✔
            </span>
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

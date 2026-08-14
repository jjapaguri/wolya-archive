const trustItems = [
  "300여 개 브랜드 직접 조사",
  "7,000벌 이상 직접 시착",
  "통과율 3% 미만 큐레이션",
  "전 제품 실측 cm 단위 표기",
  "스타일당 [20]장 이하 소량 사입",
];

export default function TrustSection() {
  return (
    <section className="relative z-10 border-t border-border bg-bg px-6 py-20 lg:px-20 lg:py-[100px]">
      <span className="mb-[60px] block font-maruburi text-sm font-bold tracking-[0.2em] text-accent uppercase">
        #신뢰 요소
      </span>
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-[30px] min-[768px]:max-[1199.98px]:grid-cols-2 lg:grid-cols-5">
        {trustItems.map((item) => (
          <div
            key={item}
            className="word-keep-all border-t border-border pt-5 font-kr text-sm leading-[1.6] font-light text-fg/80 before:mr-2 before:text-xs before:text-accent before:content-['✔']"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

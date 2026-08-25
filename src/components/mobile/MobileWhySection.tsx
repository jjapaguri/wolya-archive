const REASONS = [
  {
    figure: "300+",
    body: "300여 개 브랜드 → 23,000벌 이상 시착 국내외 브랜드 300여 곳을 매 시즌 훑고, 직접 사입해서 입어본 옷만 7,000벌이 넘습니다.",
  },
  {
    figure: "[200]",
    body: "그중 남은 건 [200]벌 뿐 원단, 마감, 핏 셋 중 하나라도 애매하면 탈락시킵니다. 지금까지 살아남은 비율은 3%가 안 됩니다.",
  },
  {
    figure: "[20]",
    body: "소량만 들여옵니다 한 스타일당 [20]장 이하로만 사입합니다. 재입고 약속 안 드립니다. 없어지면 그걸로 끝입니다.",
  },
];

export default function MobileWhySection() {
  return (
    <section className="border-b border-fg/10 bg-bg px-6 py-16">
      <div className="mb-10">
        <h2 className="word-keep-all mb-4 font-kr text-xl leading-[1.5] font-medium text-fg">
          옷 사는 데 시간 쓰기 싫은데, 대충 사면 꼭 후회하죠.
        </h2>
        <p className="word-keep-all font-kr text-[14px] leading-[1.7] font-light text-fg/60">
          사이즈 실패, 원단 실망, 어디서 산 티 나는 핏— 저도 300개 넘는 브랜드를 겪으며 다
          당해봤습니다.
        </p>
      </div>

      <div>
        <div className="flex flex-col gap-8">
          {REASONS.map((reason) => (
            <div key={reason.figure} className="border-t border-fg/10 pt-8">
              <span className="mb-5 block font-serif text-5xl leading-none text-accent italic">
                {reason.figure}
              </span>
              <p className="word-keep-all font-kr text-[14px] leading-[1.7] font-light text-fg/80">
                {reason.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

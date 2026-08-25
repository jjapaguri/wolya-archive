export default function EditorialSection() {
  return (
    <section className="relative z-10 border-t border-border bg-bg px-6 py-24 lg:px-20 lg:py-[140px]">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-10 max-w-[700px] lg:mb-[80px]">
          <h2 className="word-keep-all mb-5 font-maruburi text-2xl leading-[1.6] font-medium text-fg">
            옷 사는 데 시간 쓰기 싫은데, 대충 사면 꼭 후회하죠.
          </h2>
          <p className="word-keep-all font-kr text-[15px] leading-[1.8] font-light text-fg/60">
            사이즈 실패, 원단 실망, 어디서 산 티 나는 핏— 저도 300개 넘는
            브랜드를 겪으며 다 당해봤습니다.
          </p>
        </div>

        <div>
          <div className="mb-[60px] grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div className="border-t border-border pt-[60px]">
              <span className="mb-6 block font-serif text-6xl leading-none text-accent italic">
                300+
              </span>
              <p className="word-keep-all font-kr text-[15px] leading-[1.8] font-light text-fg/80">
                300여 개 브랜드 → 7,000벌 이상 시착. 국내외 브랜드 300여 곳을
                매 시즌 훑고, 직접 사입해서 입어본 옷만 7,000벌이 넘습니다.
              </p>
            </div>
            <div className="border-t border-border pt-[60px]">
              <span className="mb-6 block font-serif text-6xl leading-none text-accent italic">
                [200]
              </span>
              <p className="word-keep-all font-kr text-[15px] leading-[1.8] font-light text-fg/80">
                그중 남은 건 [200]벌 뿐. 원단, 마감, 핏 셋 중 하나라도
                애매하면 탈락시킵니다. 지금까지 살아남은 비율은 3%가 안
                됩니다.
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-[60px]">
            <span className="mb-6 block font-serif text-6xl leading-none text-accent italic">
              [20]
            </span>
            <p className="word-keep-all font-kr text-[15px] leading-[1.8] font-light text-fg/80">
              소량만 들여옵니다. 한 스타일당 [20]장 이하로만 사입합니다.
              재입고 약속 안 드립니다. 없어지면 그걸로 끝입니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";

const faqs = [
  {
    q: "정말 다 직접 입어보고 파는 건가요?",
    a: (
      <>
        A. 네, 지난 <em className="font-serif text-accent italic">[1년]</em>간
        300여 개 브랜드, 7,000벌 이상 직접 사입해서 시착했습니다. 인스타
        하이라이트에 착용 기록 남겨두고 있습니다.
      </>
    ),
  },
  {
    q: "사이즈가 애매하면요?",
    a: (
      <>
        A. 전 제품 cm 단위 실측을 표기합니다. 애매하면{" "}
        <em className="font-serif text-accent italic">[키/몸무게]</em>만 DM
        주시면 5분 내로 답변드립니다.
      </>
    ),
  },
  {
    q: "반품 되나요?",
    a: "A. [정책 명시 — 단순 변심 vs 하자 구분, 예: 수령 후 3일 이내 하자 시 100% 교환]",
  },
  {
    q: "재입고 되나요?",
    a: (
      <>
        A. 스타일당 <em className="font-serif text-accent italic">[20]</em>
        장 이하로만 사입해서, 지금까지 재입고된 아이템은{" "}
        <em className="font-serif text-accent italic">[0]</em>건입니다.
      </>
    ),
  },
];

export default function FaqSection() {
  return (
    <section className="relative z-10 border-t border-border bg-bg px-6 py-20 lg:px-20 lg:py-[100px]">
      <div className="mx-auto max-w-[900px]">
        <div className="flex flex-col gap-10">
          {faqs.map((faq) => (
            <div key={faq.q} className="border-t border-border pt-[30px]">
              <div className="word-keep-all mb-4 font-maruburi text-base font-medium text-fg">
                Q. {faq.q}
              </div>
              <div className="word-keep-all font-kr text-sm leading-[1.8] font-light text-fg/70">
                {faq.a}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-[60px] text-center">
          <Link
            href="/faq"
            className="inline-block border border-fg px-10 py-[15px] font-sans text-[11px] tracking-[0.2em] text-fg uppercase transition-all duration-300 hover:bg-fg hover:text-bg"
          >
            See more FAQ
          </Link>
        </div>
      </div>
    </section>
  );
}

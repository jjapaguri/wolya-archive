import type { ReactNode } from "react";

function Figure({ children }: { children: ReactNode }) {
  return <em className="px-0.5 font-serif text-base text-accent not-italic">{children}</em>;
}

const FAQS: { question: string; answer: ReactNode }[] = [
  {
    question: "Q. 정말 다 직접 입어보고 파는 건가요?",
    answer: (
      <>
        A. 네, 지난 <Figure>[1년]</Figure>간 300여 개 브랜드, 7,000벌 이상 직접 사입해서
        시착했습니다. 인스타 하이라이트에 착용 기록 남겨두고 있습니다.
      </>
    ),
  },
  {
    question: "Q. 사이즈가 애매하면요?",
    answer: (
      <>
        A. 전 제품 cm 단위 실측을 표기합니다. 애매하면 <Figure>[키/몸무게]</Figure>만 DM 주시면
        5분 내로 답변드립니다.
      </>
    ),
  },
  {
    question: "Q. 반품 되나요?",
    answer: (
      <>
        A. 수령 후 3일 이내 하자 시 100% 교환 및 반품 가능합니다. 단순 변심의 경우 왕복 배송비가
        부과됩니다.
      </>
    ),
  },
  {
    question: "Q. 재입고 되나요?",
    answer: (
      <>
        A. 스타일당 <Figure>[20]</Figure>장 이하로만 사입해서, 지금까지 재입고된 아이템은{" "}
        <Figure>[0]</Figure>건입니다.
      </>
    ),
  },
];

export default function MobileFaq() {
  return (
    <section className="border-b border-fg/10 bg-bg px-6 py-16">
      <span className="mb-8 block font-kr text-xs font-bold tracking-[0.2em] text-accent uppercase">
        #FAQ
      </span>

      <div className="flex flex-col gap-6">
        {FAQS.map((faq) => (
          <div key={faq.question} className="border-t border-fg/10 pt-6">
            <div className="word-keep-all mb-3 font-kr text-[15px] font-medium text-fg">
              {faq.question}
            </div>
            <div className="word-keep-all font-kr text-[13px] leading-[1.7] font-light text-fg/70">
              {faq.answer}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <a
          href="#"
          className="inline-block border border-fg px-8 py-4 font-sans text-[10px] tracking-[0.2em] text-fg uppercase transition-colors active:bg-fg active:text-bg"
        >
          See more FAQ
        </a>
      </div>
    </section>
  );
}

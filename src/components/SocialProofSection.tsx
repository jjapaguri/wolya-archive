export default function SocialProofSection() {
  return (
    <section
      className="relative z-10 border-t border-border px-6 py-20 lg:px-20 lg:py-[100px]"
      style={{
        backgroundImage: "linear-gradient(to bottom, var(--bg-soft), var(--bg))",
      }}
    >
      <div className="mx-auto max-w-[1000px]">
        <p className="word-keep-all mb-[30px] max-w-[800px] font-kr text-xl leading-[1.6] font-medium text-fg lg:text-[22px]">
          &ldquo;이번 시즌 <em className="font-serif text-2xl text-accent italic lg:text-[28px]">[12]벌</em>,
          3일 만에 완판됐습니다.&rdquo;
        </p>
        <p className="word-keep-all mb-[30px] max-w-[800px] font-kr text-xl leading-[1.6] font-medium text-fg lg:text-[22px]">
          &ldquo;재입고 문의 <em className="font-serif text-2xl text-accent italic lg:text-[28px]">[50]건</em> 넘게
          받았지만, 다시 안 들어옵니다.&rdquo;
        </p>
        <p className="font-kr text-[13px] text-fg/50">
          실제 후기/DM 캡처, 팔로워 착용샷 리그램 삽입 위치 — 숫자는 실제
          판매 데이터로 교체
        </p>
      </div>
    </section>
  );
}

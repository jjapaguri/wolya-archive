import { SOCIAL_LABELS, type SocialProvider } from "@/lib/auth/social";

/**
 * 소셜 로그인 버튼 — **켜져 있는 제공자만** 그린다.
 *
 * 앱 키(`KAKAO_CLIENT_ID` 등)는 사람이 서버 `.env.local` 에 넣는다. 서버 컴포넌트가
 * `enabledSocialProviders()` 로 판정해 이 목록을 내려주므로, 키가 없으면 배열이 비고
 * 이 컴포넌트는 아무것도 그리지 않는다. **키를 채우고 재시작하면 코드 수정 없이 켜진다.**
 *
 * 서버 컴포넌트다 — 키 값 자체는 클라이언트로 내려가지 않는다(제공자 이름만 내려간다).
 */
const brandClass: Record<SocialProvider, string> = {
  kakao: "border-[#FEE500]/60 text-[#FEE500] hover:bg-[#FEE500] hover:text-[#191600]",
  naver: "border-[#03C75A]/60 text-[#03C75A] hover:bg-[#03C75A] hover:text-white",
  google: "border-fg/40 text-fg/80 hover:bg-fg hover:text-bg",
};

export default function SocialLoginButtons({
  providers,
  next,
}: {
  providers: SocialProvider[];
  next: string;
}) {
  if (providers.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="font-sans text-[10px] tracking-[0.2em] text-fg/40 uppercase">
          또는
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {providers.map((provider) => (
        <a
          key={provider}
          // Server Action 이 아니라 라우트 핸들러다 — 제공자 사이트로 나갔다가 돌아온다
          href={`/api/auth/social/${provider}/start?next=${encodeURIComponent(next)}`}
          className={`flex w-full items-center justify-center border px-[30px] py-[13px] font-kr text-sm transition-all duration-300 ${brandClass[provider]}`}
        >
          {SOCIAL_LABELS[provider]}로 계속하기
        </a>
      ))}
    </div>
  );
}

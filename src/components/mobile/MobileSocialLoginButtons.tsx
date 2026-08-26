import { SOCIAL_LABELS, type SocialProvider } from "@/lib/auth/social";

/**
 * 모바일 소셜 로그인 버튼 — 켜져 있는 제공자만 그린다.
 * 판정은 서버 컴포넌트(`/m/login` 페이지)가 하고 여기는 목록만 받는다.
 * 앱 키 값 자체는 클라이언트로 내려가지 않는다.
 */
const brandClass: Record<SocialProvider, string> = {
  kakao: "border-[#FEE500]/60 text-[#FEE500] active:bg-[#FEE500] active:text-[#191600]",
  naver: "border-[#03C75A]/60 text-[#03C75A] active:bg-[#03C75A] active:text-white",
  google: "border-fg/40 text-fg/80 active:bg-fg active:text-bg",
};

export default function MobileSocialLoginButtons({
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
        <span className="h-px flex-1 bg-fg/10" />
        <span className="text-[10px] tracking-[0.2em] text-fg/40 uppercase">또는</span>
        <span className="h-px flex-1 bg-fg/10" />
      </div>

      {providers.map((provider) => (
        <a
          key={provider}
          href={`/api/auth/social/${provider}/start?next=${encodeURIComponent(next)}`}
          className={`flex w-full items-center justify-center border px-6 py-4 font-kr text-sm ${brandClass[provider]}`}
        >
          {SOCIAL_LABELS[provider]}로 계속하기
        </a>
      ))}
    </div>
  );
}

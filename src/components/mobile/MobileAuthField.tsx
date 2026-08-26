import type { ReactNode } from "react";

/**
 * 모바일 인증 폼의 입력 한 줄.
 *
 * 데스크톱 `src/components/AuthField.tsx` 와 같은 역할이지만 **일부러 복사해 둔다** —
 * 모바일 컴포넌트는 데스크톱 것을 import 하지 않는 것이 이 레포의 규칙이다(`docs/MAP.md`).
 * 글자 크기·터치 영역·포커스 표시가 서로 다르게 자라야 해서 공유하면 오히려 엉킨다.
 */
export function MobileAuthField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-2">
      <span className="text-[10px] font-medium tracking-[0.15em] text-accent uppercase">
        {label}
      </span>
      {children}
      {hint && <span className="font-kr text-[11px] leading-[1.6] text-fg/40">{hint}</span>}
    </label>
  );
}

/**
 * `text-base`(16px) 를 유지한다 — iOS 사파리는 16px 미만 입력에 포커스하면
 * 화면을 확대해 버린다. `/m/layout.tsx` 가 `maximumScale=1` 이라 되돌아오지도 않는다.
 */
export const mobileAuthInputClass =
  "w-full border border-fg/15 bg-transparent px-4 py-3 font-kr text-base text-fg " +
  "outline-none placeholder:text-fg/30 focus:border-accent";

export const mobileAuthButtonClass =
  "w-full border border-fg px-6 py-4 text-xs tracking-[0.2em] text-fg uppercase " +
  "active:bg-fg active:text-bg disabled:opacity-40";

export function MobileAuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="word-keep-all border border-accent/50 bg-accent-dim/40 px-4 py-3 font-kr text-[13px] leading-[1.7] text-fg/90"
    >
      {message}
    </p>
  );
}

export function MobileAuthNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="status" className="font-kr text-[13px] text-fg/60">
      {message}
    </p>
  );
}

import type { ReactNode } from "react";

/**
 * 데스크톱 인증 폼의 입력 한 줄.
 * 모바일은 `src/components/mobile/` 에 따로 있다 (모바일은 데스크톱 것을 import 하지 않는다).
 */
export function AuthField({
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
      <span className="font-sans text-[10px] tracking-[0.2em] text-accent uppercase">
        {label}
      </span>
      {children}
      {hint && <span className="font-kr text-xs text-fg/40">{hint}</span>}
    </label>
  );
}

export const authInputClass =
  "w-full border border-border bg-transparent px-4 py-3 font-kr text-sm text-fg " +
  "outline-none transition-colors placeholder:text-fg/30 focus:border-accent";

export const authButtonClass =
  "w-full border border-fg px-[30px] py-[15px] font-sans text-xs tracking-[0.2em] text-fg " +
  "uppercase transition-all duration-[400ms] ease-[cubic-bezier(0.19,1,0.22,1)] " +
  "hover:bg-fg hover:text-bg disabled:cursor-not-allowed disabled:opacity-40";

/** 실패 사유. 로그인에서는 여기 들어오는 문구가 항상 같다 (계정 존재 여부를 흘리지 않는다). */
export function AuthError({ message }: { message: string | null }) {
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

export function AuthNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="status" className="font-kr text-[13px] text-fg/60">
      {message}
    </p>
  );
}

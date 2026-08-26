"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_FORM_STATE } from "@/lib/auth/form-state";
import {
  MobileAuthError,
  MobileAuthField,
  mobileAuthButtonClass,
  mobileAuthInputClass,
} from "./MobileAuthField";

/**
 * 모바일 로그인 폼. Server Action 은 데스크톱과 같은 것을 쓴다(`@/lib/auth/actions`) —
 * 공유하는 것은 `src/lib` 이지 컴포넌트가 아니다.
 *
 * 실패 문구는 서버가 정한다. 이메일 존재 여부를 화면에서 유추해 만들지 않는다.
 */
export default function MobileLoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, INITIAL_AUTH_FORM_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />

      <MobileAuthError message={state.error} />

      <MobileAuthField label="이메일" htmlFor="m-login-email">
        <input
          id="m-login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={mobileAuthInputClass}
          placeholder="you@example.com"
        />
      </MobileAuthField>

      <MobileAuthField label="비밀번호" htmlFor="m-login-password">
        <input
          id="m-login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={mobileAuthInputClass}
        />
      </MobileAuthField>

      <button type="submit" disabled={pending} className={mobileAuthButtonClass}>
        {pending ? "확인 중" : "로그인"}
      </button>
    </form>
  );
}

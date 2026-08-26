"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_FORM_STATE } from "@/lib/auth/form-state";
import { AuthError, AuthField, authButtonClass, authInputClass } from "./AuthField";

/**
 * 데스크톱 로그인 폼.
 *
 * 서버 전용 모듈(`@/lib/auth/session` 등)을 import 하지 않는다 — "use client" 파일이
 * `pg` 를 끌어오면 빌드가 깨진다. Server Action 과 순수 타입만 가져온다.
 *
 * 실패 문구는 서버가 정한다. 여기서 "이메일이 없습니다" 같은 것을 만들어 내지 않는다.
 */
export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, INITIAL_AUTH_FORM_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="next" value={next} />

      <AuthError message={state.error} />

      <AuthField label="이메일" htmlFor="login-email">
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={authInputClass}
          placeholder="you@example.com"
        />
      </AuthField>

      <AuthField label="비밀번호" htmlFor="login-password">
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={authInputClass}
        />
      </AuthField>

      <button type="submit" disabled={pending} className={authButtonClass}>
        {pending ? "확인 중" : "로그인"}
      </button>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_FORM_STATE } from "@/lib/auth/form-state";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/validation";
import { AuthError, AuthField, authButtonClass, authInputClass } from "./AuthField";

/**
 * 데스크톱 회원가입 폼.
 *
 * **받는 것만 받는다** — 이메일·이름·비밀번호, 그리고 선택인 휴대폰.
 * 생년월일·성별은 묻지 않는다(스키마에 컬럼조차 없다).
 *
 * 동의는 체크박스로 받지만 **저장은 동의한 시각**이다. 서버가 `now()` 를 찍는다.
 */
export default function SignupForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signupAction, INITIAL_AUTH_FORM_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="next" value={next} />

      <AuthError message={state.error} />

      <AuthField label="이메일" htmlFor="signup-email">
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={authInputClass}
          placeholder="you@example.com"
        />
      </AuthField>

      <AuthField label="이름" htmlFor="signup-name">
        <input
          id="signup-name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={80}
          required
          className={authInputClass}
        />
      </AuthField>

      <AuthField
        label="휴대폰 (선택)"
        htmlFor="signup-phone"
        hint="주문 조회와 배송 안내에 씁니다. 나중에 내 정보에서 추가해도 됩니다."
      >
        <input
          id="signup-phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          className={authInputClass}
          placeholder="010-0000-0000"
        />
      </AuthField>

      <AuthField
        label="비밀번호"
        htmlFor="signup-password"
        hint={`${PASSWORD_MIN_LENGTH}자 이상.`}
      >
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
          className={authInputClass}
        />
      </AuthField>

      <AuthField label="비밀번호 확인" htmlFor="signup-password-confirm">
        <input
          id="signup-password-confirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
          className={authInputClass}
        />
      </AuthField>

      <fieldset className="flex flex-col gap-3 border-t border-border pt-6">
        <legend className="sr-only">약관 동의</legend>

        <label className="flex items-start gap-3 font-kr text-[13px] leading-[1.7] text-fg/70">
          <input type="checkbox" name="agreeTerms" required className="mt-1 accent-accent" />
          <span>
            <Link href="/legal/terms" className="underline underline-offset-4 hover:text-accent">
              이용약관
            </Link>
            에 동의합니다. (필수)
          </span>
        </label>

        <label className="flex items-start gap-3 font-kr text-[13px] leading-[1.7] text-fg/70">
          <input type="checkbox" name="agreePrivacy" required className="mt-1 accent-accent" />
          <span>
            <Link href="/legal/privacy" className="underline underline-offset-4 hover:text-accent">
              개인정보처리방침
            </Link>
            에 동의합니다. (필수)
          </span>
        </label>

        <label className="flex items-start gap-3 font-kr text-[13px] leading-[1.7] text-fg/70">
          <input type="checkbox" name="agreeMarketing" className="mt-1 accent-accent" />
          <span>신상품·재입고 소식을 받아보겠습니다. (선택, 언제든 해제 가능)</span>
        </label>
      </fieldset>

      <button type="submit" disabled={pending} className={authButtonClass}>
        {pending ? "가입 중" : "가입하기"}
      </button>
    </form>
  );
}

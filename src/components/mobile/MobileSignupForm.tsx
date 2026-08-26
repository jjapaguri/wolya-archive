"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_FORM_STATE } from "@/lib/auth/form-state";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/validation";
import {
  MobileAuthError,
  MobileAuthField,
  mobileAuthButtonClass,
  mobileAuthInputClass,
} from "./MobileAuthField";

/**
 * 모바일 회원가입 폼.
 * 받는 항목은 데스크톱과 같다 — 이메일·이름·비밀번호, 선택인 휴대폰.
 * 동의는 체크박스로 받고 **저장은 시각**이다(서버가 `now()` 를 찍는다).
 */
export default function MobileSignupForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signupAction, INITIAL_AUTH_FORM_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />

      <MobileAuthError message={state.error} />

      <MobileAuthField label="이메일" htmlFor="m-signup-email">
        <input
          id="m-signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={mobileAuthInputClass}
          placeholder="you@example.com"
        />
      </MobileAuthField>

      <MobileAuthField label="이름" htmlFor="m-signup-name">
        <input
          id="m-signup-name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={80}
          required
          className={mobileAuthInputClass}
        />
      </MobileAuthField>

      <MobileAuthField
        label="휴대폰 (선택)"
        htmlFor="m-signup-phone"
        hint="주문 조회와 배송 안내에 씁니다. 나중에 추가해도 됩니다."
      >
        <input
          id="m-signup-phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          className={mobileAuthInputClass}
          placeholder="010-0000-0000"
        />
      </MobileAuthField>

      <MobileAuthField
        label="비밀번호"
        htmlFor="m-signup-password"
        hint={`${PASSWORD_MIN_LENGTH}자 이상.`}
      >
        <input
          id="m-signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
          className={mobileAuthInputClass}
        />
      </MobileAuthField>

      <MobileAuthField label="비밀번호 확인" htmlFor="m-signup-password-confirm">
        <input
          id="m-signup-password-confirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
          className={mobileAuthInputClass}
        />
      </MobileAuthField>

      <fieldset className="flex flex-col gap-3 border-t border-fg/10 pt-5">
        <legend className="sr-only">약관 동의</legend>

        <label className="flex items-start gap-3 font-kr text-[13px] leading-[1.7] text-fg/70">
          <input type="checkbox" name="agreeTerms" required className="mt-1 accent-accent" />
          <span>
            <Link href="/m/legal/terms" className="underline underline-offset-4">
              이용약관
            </Link>
            에 동의합니다. (필수)
          </span>
        </label>

        <label className="flex items-start gap-3 font-kr text-[13px] leading-[1.7] text-fg/70">
          <input type="checkbox" name="agreePrivacy" required className="mt-1 accent-accent" />
          <span>
            <Link href="/m/legal/privacy" className="underline underline-offset-4">
              개인정보처리방침
            </Link>
            에 동의합니다. (필수)
          </span>
        </label>

        <label className="flex items-start gap-3 font-kr text-[13px] leading-[1.7] text-fg/70">
          <input type="checkbox" name="agreeMarketing" className="mt-1 accent-accent" />
          <span>신상품·재입고 소식을 받아보겠습니다. (선택)</span>
        </label>
      </fieldset>

      <button type="submit" disabled={pending} className={mobileAuthButtonClass}>
        {pending ? "가입 중" : "가입하기"}
      </button>
    </form>
  );
}

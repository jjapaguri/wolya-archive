"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_FORM_STATE } from "@/lib/auth/form-state";
import { formatPhone } from "@/lib/auth/validation";
import {
  AuthError,
  AuthField,
  AuthNotice,
  authButtonClass,
  authInputClass,
} from "./AuthField";

/**
 * 내 정보 — 이름·휴대폰·마케팅 수신.
 *
 * 이메일은 여기서 바꾸지 않는다. 소셜 계정 연결·주문 조회가 이메일에 걸려 있어서
 * 변경에는 본인확인 절차가 따로 필요하다 (`docs/BACKLOG.md` 에 항목으로 남겼다).
 */
export default function AccountProfileForm({
  name,
  phone,
  marketingAgreed,
}: {
  name: string;
  phone: string | null;
  marketingAgreed: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    INITIAL_AUTH_FORM_STATE
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <AuthError message={state.error} />
      <AuthNotice message={state.message ?? null} />

      <AuthField label="이름" htmlFor="profile-name">
        <input
          id="profile-name"
          name="name"
          type="text"
          defaultValue={name}
          maxLength={80}
          required
          className={authInputClass}
        />
      </AuthField>

      <AuthField
        label="휴대폰"
        htmlFor="profile-phone"
        hint="주문 조회와 배송 안내에 씁니다."
      >
        <input
          id="profile-phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          defaultValue={phone ? formatPhone(phone) : ""}
          className={authInputClass}
          placeholder="010-0000-0000"
        />
      </AuthField>

      <label className="flex items-start gap-3 font-kr text-[13px] leading-[1.7] text-fg/70">
        <input
          type="checkbox"
          name="agreeMarketing"
          defaultChecked={marketingAgreed}
          className="mt-1 accent-accent"
        />
        <span>신상품·재입고 소식을 받아보겠습니다. (선택)</span>
      </label>

      <button type="submit" disabled={pending} className={authButtonClass}>
        {pending ? "저장 중" : "저장"}
      </button>
    </form>
  );
}

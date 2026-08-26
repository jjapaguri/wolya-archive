"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_FORM_STATE } from "@/lib/auth/form-state";
import { formatPhone } from "@/lib/auth/validation";
import {
  MobileAuthError,
  MobileAuthField,
  MobileAuthNotice,
  mobileAuthButtonClass,
  mobileAuthInputClass,
} from "./MobileAuthField";

/** 모바일 내 정보. 이메일은 여기서 바꾸지 않는다(본인확인 절차가 따로 필요하다). */
export default function MobileAccountProfileForm({
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
      <MobileAuthError message={state.error} />
      <MobileAuthNotice message={state.message ?? null} />

      <MobileAuthField label="이름" htmlFor="m-profile-name">
        <input
          id="m-profile-name"
          name="name"
          type="text"
          defaultValue={name}
          maxLength={80}
          required
          className={mobileAuthInputClass}
        />
      </MobileAuthField>

      <MobileAuthField label="휴대폰" htmlFor="m-profile-phone" hint="주문 조회와 배송 안내에 씁니다.">
        <input
          id="m-profile-phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          defaultValue={phone ? formatPhone(phone) : ""}
          className={mobileAuthInputClass}
          placeholder="010-0000-0000"
        />
      </MobileAuthField>

      <label className="flex items-start gap-3 font-kr text-[13px] leading-[1.7] text-fg/70">
        <input
          type="checkbox"
          name="agreeMarketing"
          defaultChecked={marketingAgreed}
          className="mt-1 accent-accent"
        />
        <span>신상품·재입고 소식을 받아보겠습니다. (선택)</span>
      </label>

      <button type="submit" disabled={pending} className={mobileAuthButtonClass}>
        {pending ? "저장 중" : "저장"}
      </button>
    </form>
  );
}

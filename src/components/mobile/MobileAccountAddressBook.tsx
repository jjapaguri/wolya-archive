"use client";

import { useActionState, useState } from "react";
import { deleteAddressAction, saveAddressAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_FORM_STATE } from "@/lib/auth/form-state";
import { formatPhone } from "@/lib/auth/validation";
import type { AccountAddress } from "@/lib/auth/types";
import {
  MobileAuthError,
  MobileAuthField,
  MobileAuthNotice,
  mobileAuthButtonClass,
  mobileAuthInputClass,
} from "./MobileAuthField";

/**
 * 모바일 배송지 주소록.
 * 주소록은 원본이고 주문서는 값으로 복사(스냅샷)한다 — 여기서 고쳐도 지난 주문서는 안 변한다.
 */
export default function MobileAccountAddressBook({
  addresses,
}: {
  addresses: AccountAddress[];
}) {
  const [saveState, saveFormAction, saving] = useActionState(
    saveAddressAction,
    INITIAL_AUTH_FORM_STATE
  );
  const [deleteState, deleteFormAction] = useActionState(
    deleteAddressAction,
    INITIAL_AUTH_FORM_STATE
  );

  const [editing, setEditing] = useState<AccountAddress | null>(null);
  // defaultValue 는 리렌더로 갱신되지 않는다 — key 를 바꿔 폼을 다시 마운트한다
  const formKey = editing?.id ?? "new";

  return (
    <div className="flex flex-col gap-7">
      {addresses.length > 0 && (
        <ul className="flex flex-col gap-3">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="flex flex-col gap-2 border border-fg/10 px-4 py-3 font-kr text-[13px] text-fg/70"
            >
              <div className="flex flex-wrap items-center gap-2">
                {address.isDefault && (
                  <span className="border border-accent px-1.5 py-0.5 text-[9px] tracking-[0.1em] text-accent uppercase">
                    기본
                  </span>
                )}
                <span className="text-fg">{address.recipient}</span>
                <span className="text-fg/50">{formatPhone(address.phone)}</span>
              </div>

              <p className="word-keep-all leading-[1.7]">
                [{address.postcode}] {address.address1}
                {address.address2 ? ` ${address.address2}` : ""}
              </p>

              <div className="mt-1 flex gap-5 text-[10px] tracking-[0.15em] uppercase">
                <button
                  type="button"
                  onClick={() => setEditing(address)}
                  className="text-fg/50 active:opacity-50"
                >
                  수정
                </button>
                <form action={deleteFormAction}>
                  <input type="hidden" name="addressId" value={address.id} />
                  <button type="submit" className="text-fg/50 active:opacity-50">
                    삭제
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <MobileAuthError message={deleteState.error} />
      <MobileAuthNotice message={deleteState.message ?? null} />

      <form key={formKey} action={saveFormAction} className="flex flex-col gap-5">
        <h3 className="font-kr text-base font-medium">
          {editing ? "배송지 수정" : "배송지 추가"}
        </h3>

        <MobileAuthError message={saveState.error} />
        <MobileAuthNotice message={saveState.message ?? null} />

        {editing && <input type="hidden" name="addressId" value={editing.id} />}

        <MobileAuthField label="배송지 이름 (선택)" htmlFor="m-address-label">
          <input
            id="m-address-label"
            name="label"
            type="text"
            maxLength={40}
            defaultValue={editing?.label ?? ""}
            className={mobileAuthInputClass}
            placeholder="집 / 회사"
          />
        </MobileAuthField>

        <MobileAuthField label="받는 분" htmlFor="m-address-recipient">
          <input
            id="m-address-recipient"
            name="recipient"
            type="text"
            maxLength={80}
            defaultValue={editing?.recipient ?? ""}
            required
            className={mobileAuthInputClass}
          />
        </MobileAuthField>

        <MobileAuthField label="휴대폰" htmlFor="m-address-phone">
          <input
            id="m-address-phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            defaultValue={editing ? formatPhone(editing.phone) : ""}
            required
            className={mobileAuthInputClass}
            placeholder="010-0000-0000"
          />
        </MobileAuthField>

        <MobileAuthField label="우편번호" htmlFor="m-address-postcode">
          <input
            id="m-address-postcode"
            name="postcode"
            type="text"
            inputMode="numeric"
            maxLength={5}
            defaultValue={editing?.postcode ?? ""}
            required
            className={mobileAuthInputClass}
            placeholder="00000"
          />
        </MobileAuthField>

        <MobileAuthField label="주소" htmlFor="m-address-address1">
          <input
            id="m-address-address1"
            name="address1"
            type="text"
            maxLength={255}
            defaultValue={editing?.address1 ?? ""}
            required
            className={mobileAuthInputClass}
          />
        </MobileAuthField>

        <MobileAuthField label="상세 주소 (선택)" htmlFor="m-address-address2">
          <input
            id="m-address-address2"
            name="address2"
            type="text"
            maxLength={255}
            defaultValue={editing?.address2 ?? ""}
            className={mobileAuthInputClass}
          />
        </MobileAuthField>

        <label className="flex items-start gap-3 font-kr text-[13px] leading-[1.7] text-fg/70">
          <input
            type="checkbox"
            name="isDefault"
            defaultChecked={editing?.isDefault ?? addresses.length === 0}
            className="mt-1 accent-accent"
          />
          <span>기본 배송지로 사용합니다.</span>
        </label>

        <button type="submit" disabled={saving} className={mobileAuthButtonClass}>
          {saving ? "저장 중" : editing ? "수정 저장" : "추가"}
        </button>

        {editing && (
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="w-full border border-fg/15 px-6 py-4 text-xs tracking-[0.2em] text-fg/60 uppercase active:opacity-50"
          >
            취소
          </button>
        )}
      </form>
    </div>
  );
}

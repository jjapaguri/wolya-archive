"use client";

import { useActionState, useState } from "react";
import { deleteAddressAction, saveAddressAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_FORM_STATE } from "@/lib/auth/form-state";
import { formatPhone } from "@/lib/auth/validation";
import type { AccountAddress } from "@/lib/auth/types";
import {
  AuthError,
  AuthField,
  AuthNotice,
  authButtonClass,
  authInputClass,
} from "./AuthField";

/**
 * 배송지 주소록 (데스크톱).
 *
 * 주소록은 **원본**이다. 주문서는 이 값을 참조하지 않고 값으로 복사한다(스냅샷) —
 * `db/README.md` 3단계 요점. 그래서 여기서 주소를 고쳐도 지난 주문서는 변하지 않는다.
 *
 * 기본 배송지는 회원당 1개다(DB 부분 유니크 인덱스). 새로 지정하면 서버가 같은
 * 트랜잭션에서 기존 기본을 내린다.
 */
export default function AccountAddressBook({ addresses }: { addresses: AccountAddress[] }) {
  const [saveState, saveFormAction, saving] = useActionState(
    saveAddressAction,
    INITIAL_AUTH_FORM_STATE
  );
  const [deleteState, deleteFormAction] = useActionState(
    deleteAddressAction,
    INITIAL_AUTH_FORM_STATE
  );

  /** 수정 중인 주소. null 이면 새로 추가하는 중. */
  const [editing, setEditing] = useState<AccountAddress | null>(null);

  // key 를 바꿔 폼을 통째로 다시 마운트한다 — defaultValue 는 리렌더로 갱신되지 않는다
  const formKey = editing?.id ?? "new";

  return (
    <div className="flex flex-col gap-8">
      {addresses.length > 0 && (
        <ul className="flex flex-col gap-4">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="flex flex-col gap-2 border border-border px-5 py-4 font-kr text-sm text-fg/70"
            >
              <div className="flex flex-wrap items-center gap-3">
                {address.isDefault && (
                  <span className="border border-accent px-2 py-0.5 font-sans text-[9px] tracking-[0.15em] text-accent uppercase">
                    기본
                  </span>
                )}
                <span className="text-fg">{address.recipient}</span>
                <span className="text-fg/50">{formatPhone(address.phone)}</span>
                {address.label && <span className="text-fg/40">({address.label})</span>}
              </div>

              <p className="word-keep-all leading-[1.7]">
                [{address.postcode}] {address.address1}
                {address.address2 ? ` ${address.address2}` : ""}
              </p>

              <div className="mt-1 flex gap-4 font-sans text-[10px] tracking-[0.15em] uppercase">
                <button
                  type="button"
                  onClick={() => setEditing(address)}
                  className="text-fg/50 transition-colors hover:text-accent"
                >
                  수정
                </button>
                <form action={deleteFormAction}>
                  <input type="hidden" name="addressId" value={address.id} />
                  <button
                    type="submit"
                    className="text-fg/50 transition-colors hover:text-accent"
                  >
                    삭제
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AuthError message={deleteState.error} />
      <AuthNotice message={deleteState.message ?? null} />

      <form key={formKey} action={saveFormAction} className="flex flex-col gap-5">
        <h3 className="font-maruburi text-lg font-semibold">
          {editing ? "배송지 수정" : "배송지 추가"}
        </h3>

        <AuthError message={saveState.error} />
        <AuthNotice message={saveState.message ?? null} />

        {editing && <input type="hidden" name="addressId" value={editing.id} />}

        <AuthField label="배송지 이름 (선택)" htmlFor="address-label">
          <input
            id="address-label"
            name="label"
            type="text"
            maxLength={40}
            defaultValue={editing?.label ?? ""}
            className={authInputClass}
            placeholder="집 / 회사"
          />
        </AuthField>

        <AuthField label="받는 분" htmlFor="address-recipient">
          <input
            id="address-recipient"
            name="recipient"
            type="text"
            maxLength={80}
            defaultValue={editing?.recipient ?? ""}
            required
            className={authInputClass}
          />
        </AuthField>

        <AuthField label="휴대폰" htmlFor="address-phone">
          <input
            id="address-phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            defaultValue={editing ? formatPhone(editing.phone) : ""}
            required
            className={authInputClass}
            placeholder="010-0000-0000"
          />
        </AuthField>

        <AuthField label="우편번호" htmlFor="address-postcode">
          <input
            id="address-postcode"
            name="postcode"
            type="text"
            inputMode="numeric"
            maxLength={5}
            defaultValue={editing?.postcode ?? ""}
            required
            className={authInputClass}
            placeholder="00000"
          />
        </AuthField>

        <AuthField label="주소" htmlFor="address-address1">
          <input
            id="address-address1"
            name="address1"
            type="text"
            maxLength={255}
            defaultValue={editing?.address1 ?? ""}
            required
            className={authInputClass}
          />
        </AuthField>

        <AuthField label="상세 주소 (선택)" htmlFor="address-address2">
          <input
            id="address-address2"
            name="address2"
            type="text"
            maxLength={255}
            defaultValue={editing?.address2 ?? ""}
            className={authInputClass}
          />
        </AuthField>

        <label className="flex items-start gap-3 font-kr text-[13px] leading-[1.7] text-fg/70">
          <input
            type="checkbox"
            name="isDefault"
            defaultChecked={editing?.isDefault ?? addresses.length === 0}
            className="mt-1 accent-accent"
          />
          <span>기본 배송지로 사용합니다.</span>
        </label>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className={authButtonClass}>
            {saving ? "저장 중" : editing ? "수정 저장" : "추가"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="w-full border border-border px-[30px] py-[15px] font-sans text-xs tracking-[0.2em] text-fg/60 uppercase transition-colors hover:text-fg"
            >
              취소
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

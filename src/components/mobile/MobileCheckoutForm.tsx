"use client";

/**
 * 주문서 (모바일 `/m/checkout`). 데스크톱 쌍은 `src/components/CheckoutForm.tsx`.
 *
 * 검증은 즉시 피드백용이고 진짜 방어선은 서버다. 금액은 `expectedTotal` 로 대조만 보낸다 —
 * 저장되는 금액은 서버가 DB 가격으로 다시 계산한다 (AGENTS.md 불변규칙 2).
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice } from "@/data/products";
import {
  EMPTY_CHECKOUT_INPUT,
  hasErrors,
  validateCheckout,
  type CartSummary,
  type CheckoutErrors,
  type CheckoutInput,
} from "@/lib/orders/shared";

type Props = {
  cart: CartSummary;
  paymentLabel: string;
  paymentDescription: string;
};

const FIELD_LABELS: Record<string, string> = {
  ordererName: "주문자",
  ordererPhone: "휴대폰번호",
  ordererEmail: "이메일 (선택)",
  recipient: "받는 분",
  recipientPhone: "받는 분 휴대폰번호",
  postcode: "우편번호",
  address1: "주소",
  address2: "상세주소",
  deliveryMemo: "배송 메모 (선택)",
  depositName: "입금자명 (비우면 주문자명)",
};

export default function MobileCheckoutForm({ cart, paymentLabel, paymentDescription }: Props) {
  const router = useRouter();
  const [input, setInput] = useState<CheckoutInput>(EMPTY_CHECKOUT_INPUT);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [sameAsOrderer, setSameAsOrderer] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function set<K extends keyof CheckoutInput>(key: K, value: CheckoutInput[K]) {
    setInput((prev) => {
      const next = { ...prev, [key]: value };
      if (sameAsOrderer && key === "ordererName") next.recipient = value as string;
      if (sameAsOrderer && key === "ordererPhone") next.recipientPhone = value as string;
      return next;
    });
  }

  function toggleSame(checked: boolean) {
    setSameAsOrderer(checked);
    if (checked) {
      setInput((prev) => ({
        ...prev,
        recipient: prev.ordererName,
        recipientPhone: prev.ordererPhone,
      }));
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setNotice(null);

    const found = validateCheckout(input);
    setErrors(found);
    if (hasErrors(found)) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, expectedTotal: cart.totalAmount }),
      });
      const body: {
        ok?: boolean;
        orderNo?: string;
        message?: string;
        errors?: CheckoutErrors;
      } = await response.json();

      if (!response.ok || !body.ok) {
        if (body.errors) setErrors(body.errors);
        setNotice(body.message ?? "주문을 완료하지 못했습니다. 입력을 확인해 주세요.");
        return;
      }
      router.push(`/m/order/${body.orderNo}`);
    } catch {
      setNotice("네트워크가 불안정합니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (cart.unavailable || cart.lines.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <p className="word-keep-all font-kr text-[13px] leading-[1.7] text-fg/60">
          {cart.unavailable
            ? "지금은 주문서를 열 수 없습니다. 카카오톡 채널(아카이브_월야)로 문의해 주세요."
            : "장바구니가 비어 있습니다."}
        </p>
        <Link
          href="/m/archive"
          className="w-full border border-accent px-4 py-3 text-center text-[12px] tracking-[0.15em] text-accent uppercase active:opacity-70"
        >
          아카이브 둘러보기
        </Link>
      </div>
    );
  }

  const field = (
    key: keyof typeof FIELD_LABELS,
    options: { type?: string; placeholder?: string; disabled?: boolean } = {}
  ) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] tracking-[0.15em] text-fg/50 uppercase">{FIELD_LABELS[key]}</span>
      <input
        type={options.type ?? "text"}
        value={input[key as keyof CheckoutInput] as string}
        disabled={options.disabled}
        placeholder={options.placeholder}
        onChange={(event) => set(key as keyof CheckoutInput, event.target.value)}
        className="w-full border border-fg/15 bg-bg-soft px-3 py-3 font-kr text-[15px] text-fg placeholder:text-fg/25 focus:border-accent focus:outline-none disabled:opacity-50"
      />
      {errors[key as keyof CheckoutInput] && (
        <span className="font-kr text-[11px] text-accent">
          {errors[key as keyof CheckoutInput]}
        </span>
      )}
    </label>
  );

  return (
    <form onSubmit={submit} className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-[10px] tracking-[0.2em] text-accent uppercase">주문자</h2>
        {field("ordererName")}
        {field("ordererPhone", { type: "tel", placeholder: "01012345678" })}
        {field("ordererEmail", { type: "email", placeholder: "입금·배송 안내를 받을 주소" })}
      </section>

      <section className="flex flex-col gap-4 border-t border-fg/10 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] tracking-[0.2em] text-accent uppercase">배송지</h2>
          <label className="flex items-center gap-2 font-kr text-[12px] text-fg/60">
            <input
              type="checkbox"
              checked={sameAsOrderer}
              onChange={(event) => toggleSame(event.target.checked)}
              className="accent-[var(--accent)]"
            />
            주문자와 동일
          </label>
        </div>
        {field("recipient", { disabled: sameAsOrderer })}
        {field("recipientPhone", { type: "tel", disabled: sameAsOrderer })}
        {field("postcode", { placeholder: "12345" })}
        {field("address1", { placeholder: "도로명 주소" })}
        {field("address2", { placeholder: "동·호수 등" })}
        {field("deliveryMemo", { placeholder: "부재 시 문 앞에 놓아 주세요" })}
      </section>

      <section className="flex flex-col gap-4 border-t border-fg/10 pt-6">
        <h2 className="text-[10px] tracking-[0.2em] text-accent uppercase">결제 수단</h2>
        <div className="border border-accent/40 bg-accent/[0.06] px-4 py-3">
          <p className="mb-1 font-kr text-[13px] text-fg">{paymentLabel}</p>
          <p className="word-keep-all font-kr text-[12px] leading-[1.6] text-fg/60">
            {paymentDescription}
          </p>
        </div>
        {field("depositName", { placeholder: "통장에 찍히는 이름" })}
      </section>

      <section className="flex flex-col gap-3 border-t border-fg/10 pt-6">
        <h2 className="text-[10px] tracking-[0.2em] text-accent uppercase">동의</h2>
        <label className="flex items-start gap-3 font-kr text-[12px] leading-[1.6] text-fg/70">
          <input
            type="checkbox"
            checked={input.agreeTerms}
            onChange={(event) => set("agreeTerms", event.target.checked)}
            className="mt-0.5 accent-[var(--accent)]"
          />
          <span className="word-keep-all">
            (필수){" "}
            <Link href="/m/legal/terms" className="underline underline-offset-4">
              이용약관
            </Link>
            에 동의합니다.
          </span>
        </label>
        {errors.agreeTerms && (
          <span className="font-kr text-[11px] text-accent">{errors.agreeTerms}</span>
        )}
        <label className="flex items-start gap-3 font-kr text-[12px] leading-[1.6] text-fg/70">
          <input
            type="checkbox"
            checked={input.agreePrivacy}
            onChange={(event) => set("agreePrivacy", event.target.checked)}
            className="mt-0.5 accent-[var(--accent)]"
          />
          <span className="word-keep-all">
            (필수) 주문 처리·배송을 위한{" "}
            <Link href="/m/legal/privacy" className="underline underline-offset-4">
              개인정보 수집·이용
            </Link>
            에 동의합니다. 수집 항목: 이름·휴대폰번호·주소(선택: 이메일).
          </span>
        </label>
        {errors.agreePrivacy && (
          <span className="font-kr text-[11px] text-accent">{errors.agreePrivacy}</span>
        )}
      </section>

      <section className="flex flex-col gap-3 border-t border-fg/10 pt-6">
        <h2 className="text-[10px] tracking-[0.2em] text-accent uppercase">주문 요약</h2>
        <ul className="flex flex-col gap-2 border-b border-fg/10 pb-4">
          {cart.lines.map((line) => (
            <li key={line.id} className="flex justify-between gap-3 font-kr text-[12px] text-fg/70">
              <span className="word-keep-all">
                {line.name}
                {line.variantLabel && <span className="text-fg/40"> · {line.variantLabel}</span>}
                <span className="text-fg/40"> × {line.quantity}</span>
                {line.isPreorder && <span className="ml-1 text-accent">[예약]</span>}
              </span>
              <span className="shrink-0 tabular-nums">{formatPrice(line.lineAmount)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between font-kr text-[12px] text-fg/60">
          <span>상품 금액</span>
          <span className="tabular-nums">{formatPrice(cart.itemsAmount)}</span>
        </div>
        <div className="flex justify-between font-kr text-[12px] text-fg/60">
          <span>배송비</span>
          <span className="tabular-nums">{formatPrice(cart.shippingFee)}</span>
        </div>
        <div className="flex items-baseline justify-between border-t border-fg/10 pt-3">
          <span className="text-[10px] tracking-[0.15em] text-fg uppercase">총 결제금액</span>
          <span className="font-serif text-xl text-accent">{formatPrice(cart.totalAmount)}</span>
        </div>
      </section>

      {cart.hasPreorder && (
        <p className="word-keep-all border border-accent/40 bg-accent/[0.06] px-4 py-3 font-kr text-[12px] leading-[1.5] text-accent">
          예약주문이 포함돼 있습니다. 입금 확인 후 사입을 진행하며, 확보에 실패하면 3영업일 내
          전액 환불됩니다.
        </p>
      )}

      {notice && (
        <p aria-live="polite" className="word-keep-all font-kr text-[12px] text-accent">
          {notice}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || cart.hasBlockedLine}
        className="w-full border border-accent bg-accent px-4 py-3.5 text-[12px] tracking-[0.15em] text-bg uppercase active:opacity-70 disabled:border-fg/20 disabled:bg-transparent disabled:text-fg/40"
      >
        {submitting ? "주문 접수 중…" : "주문하기"}
      </button>

      <Link
        href="/m/cart"
        className="text-center text-[10px] tracking-[0.15em] text-fg/40 uppercase active:opacity-50"
      >
        장바구니로 돌아가기
      </Link>
    </form>
  );
}

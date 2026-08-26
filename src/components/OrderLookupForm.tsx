"use client";

/**
 * 비회원 주문 조회 폼 (데스크톱 `/order-lookup`).
 * 모바일 쌍은 `mobile/MobileOrderLookupForm.tsx`.
 *
 * 로그인 없이 주문서를 여는 문이라 서버가 IP 당 시도 횟수를 막는다
 * (`/api/orders/lookup`). 여기서는 형식만 미리 걸러 헛된 요청을 줄인다.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { isValidOrderNo, isValidPhone } from "@/lib/orders/shared";

export default function OrderLookupForm({ defaultOrderNo = "" }: { defaultOrderNo?: string }) {
  const router = useRouter();
  const [orderNo, setOrderNo] = useState(defaultOrderNo);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    if (!isValidOrderNo(orderNo)) {
      setMessage("주문번호 형식이 올바르지 않습니다. 예: 20260826-K7M2QPXZ");
      return;
    }
    if (!isValidPhone(phone)) {
      setMessage("휴대폰번호를 정확히 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // mobile=false → 서버가 데스크톱 경로(/order/…)를 돌려준다
        body: JSON.stringify({ orderNo, phone, mobile: false }),
      });
      const body: { ok?: boolean; path?: string; message?: string } = await response.json();
      if (!response.ok || !body.ok || !body.path) {
        setMessage(body.message ?? "일치하는 주문을 찾을 수 없습니다.");
        return;
      }
      router.push(body.path);
    } catch {
      setMessage("네트워크가 불안정합니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex max-w-[440px] flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="font-sans text-[10px] tracking-[0.15em] text-fg/50 uppercase">주문번호</span>
        <input
          value={orderNo}
          onChange={(event) => setOrderNo(event.target.value.toUpperCase())}
          placeholder="20260826-K7M2QPXZ"
          className="border border-border bg-bg-soft px-4 py-3 font-sans text-[14px] tracking-[0.05em] text-fg placeholder:text-fg/25 focus:border-accent focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-sans text-[10px] tracking-[0.15em] text-fg/50 uppercase">
          주문자 휴대폰번호
        </span>
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="01012345678"
          className="border border-border bg-bg-soft px-4 py-3 font-kr text-[14px] text-fg placeholder:text-fg/25 focus:border-accent focus:outline-none"
        />
      </label>

      {message && (
        <p aria-live="polite" className="word-keep-all font-kr text-[12px] text-accent">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="self-start border border-accent bg-accent px-6 py-3 font-sans text-[11px] tracking-[0.15em] text-bg uppercase transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {submitting ? "조회 중…" : "주문 조회"}
      </button>
    </form>
  );
}

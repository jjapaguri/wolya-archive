"use client";

/**
 * 상세페이지 담기 버튼 (모바일 `/m/product/[slug]`).
 *
 * 데스크톱 쌍은 `src/components/AddToCartButton.tsx` 다.
 * **데스크톱 컴포넌트를 import 하지 않는다** (docs/BACKLOG.md 이중 라우트 규칙).
 * 공유하는 것은 `@/lib/orders/shared` 의 타입뿐이다.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { PurchaseOption } from "@/lib/orders/shared";

type Props = {
  slug: string;
  options: PurchaseOption[];
  isPreorder: boolean;
};

export default function MobileAddToCartButton({ slug, options, isPreorder }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<number>(
    options.find((option) => option.orderable)?.variantId ?? options[0]?.variantId ?? 0
  );
  const [message, setMessage] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);

  const current = options.find((option) => option.variantId === selected) ?? options[0];

  async function add() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, variantId: selected, quantity: 1 }),
      });
      const body: { ok?: boolean; message?: string } = await response.json();
      if (!response.ok || !body.ok) {
        setMessage(body.message ?? "담지 못했습니다. 잠시 후 다시 시도해 주세요.");
        setAdded(false);
        return;
      }
      setAdded(true);
      setMessage("장바구니에 담았습니다.");
      startTransition(() => router.refresh());
    } catch {
      setMessage("네트워크가 불안정합니다. 다시 시도해 주세요.");
      setAdded(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {options.length > 1 && (
        <label className="flex flex-col gap-2">
          <span className="text-[10px] tracking-[0.15em] text-fg/50 uppercase">옵션</span>
          <select
            value={selected}
            onChange={(event) => setSelected(Number(event.target.value))}
            className="w-full border border-fg/15 bg-bg-soft px-3 py-3 font-kr text-[14px] text-fg"
          >
            {options.map((option) => (
              <option key={option.variantId} value={option.variantId} disabled={!option.orderable}>
                {option.label || "단일 옵션"}
                {option.orderable ? "" : " (품절)"}
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        type="button"
        onClick={add}
        disabled={busy || !current?.orderable}
        className="w-full border border-accent bg-accent px-4 py-3 text-[12px] tracking-[0.15em] text-bg uppercase active:opacity-70 disabled:border-fg/20 disabled:bg-transparent disabled:text-fg/40"
      >
        {busy ? "담는 중…" : isPreorder ? "예약주문 담기" : "장바구니 담기"}
      </button>

      {added && (
        <Link
          href="/m/cart"
          className="w-full border border-accent px-4 py-3 text-center text-[12px] tracking-[0.15em] text-accent uppercase active:opacity-70"
        >
          장바구니 보기
        </Link>
      )}

      {message && (
        <p
          aria-live="polite"
          className={`word-keep-all font-kr text-[12px] leading-[1.5] ${added ? "text-accent" : "text-fg/60"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

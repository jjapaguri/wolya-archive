"use client";

/**
 * 상세페이지 담기 버튼 (데스크톱 `/product/[slug]`).
 *
 * 모바일 쌍은 `src/components/mobile/MobileAddToCartButton.tsx` 다.
 * **모바일 컴포넌트는 이 파일을 import 하지 않는다** (docs/BACKLOG.md 이중 라우트 규칙).
 * 공유하는 것은 `@/lib/orders/shared` 의 타입뿐이다 — 거기엔 `pg` 가 없다.
 *
 * 서버가 옵션을 못 읽은 경우(DB 미설정·원장 폴백) 이 컴포넌트는 아예 렌더되지 않는다.
 * 상세페이지가 그때는 종전처럼 카카오톡 구매 문의만 그린다.
 */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import type { PurchaseOption } from "@/lib/orders/shared";

type Props = {
  slug: string;
  options: PurchaseOption[];
  /** 예약주문 상품이면 문구가 달라진다 */
  isPreorder: boolean;
};

export default function AddToCartButton({ slug, options, isPreorder }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<number>(
    options.find((option) => option.orderable)?.variantId ?? options[0]?.variantId ?? 0
  );
  const [message, setMessage] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);

  const current = options.find((option) => option.variantId === selected) ?? options[0];
  const disabled = busy || pending || !current?.orderable;

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
      // 서버 컴포넌트가 그린 재고·상태를 새로 받아온다.
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
        <label className="flex items-center gap-3 font-sans text-[10px] tracking-[0.15em] text-fg/50 uppercase">
          옵션
          <select
            value={selected}
            onChange={(event) => setSelected(Number(event.target.value))}
            className="border border-border bg-bg-soft px-3 py-2 font-kr text-[13px] text-fg"
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

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={add}
          disabled={disabled}
          className="border border-accent bg-accent px-5 py-2 font-sans text-[11px] tracking-[0.15em] text-bg uppercase transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:border-fg/20 disabled:bg-transparent disabled:text-fg/40"
        >
          {busy ? "담는 중…" : isPreorder ? "예약주문 담기" : "장바구니 담기"}
        </button>
        {added && (
          <Link
            href="/cart"
            className="border border-accent px-5 py-2 font-sans text-[11px] tracking-[0.15em] text-accent uppercase transition-colors hover:bg-accent hover:text-bg"
          >
            장바구니 보기
          </Link>
        )}
      </div>

      {message && (
        <p
          aria-live="polite"
          className={`word-keep-all font-kr text-[12px] leading-[1.6] ${added ? "text-accent" : "text-fg/60"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

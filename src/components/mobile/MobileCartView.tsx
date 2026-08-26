"use client";

/**
 * 장바구니 화면 (모바일 `/m/cart`). 데스크톱 쌍은 `src/components/CartView.tsx`.
 * 금액은 서버가 준 값을 표시만 한다 — 여기서 계산하지 않는다.
 */
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "@/data/products";
import type { CartSummary } from "@/lib/orders/shared";

export default function MobileCartView({ cart: initial }: { cart: CartSummary }) {
  const [cart, setCart] = useState(initial);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(method: "PATCH" | "DELETE", itemId: number, quantity?: number) {
    setBusyId(itemId);
    setError(null);
    try {
      const response = await fetch("/api/cart", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity }),
      });
      const body: { ok?: boolean; cart?: CartSummary; message?: string } = await response.json();
      if (!response.ok || !body.ok || !body.cart) {
        setError(body.message ?? "장바구니를 바꾸지 못했습니다.");
        return;
      }
      setCart(body.cart);
    } catch {
      setError("네트워크가 불안정합니다. 다시 시도해 주세요.");
    } finally {
      setBusyId(null);
    }
  }

  if (cart.unavailable) {
    return (
      <p className="word-keep-all border border-fg/20 bg-fg/[0.03] px-4 py-5 font-kr text-[13px] leading-[1.7] text-fg/60">
        지금은 장바구니를 사용할 수 없습니다. 카카오톡 채널(아카이브_월야)로 문의해 주세요.
      </p>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <p className="word-keep-all font-kr text-[13px] leading-[1.7] text-fg/60">
          장바구니가 비어 있습니다.
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

  return (
    <div className="flex flex-col gap-8">
      <ul className="flex flex-col border-t border-fg/10">
        {cart.lines.map((line) => (
          <li key={line.id} className="flex gap-4 border-b border-fg/10 py-4">
            <Link
              href={`/m/product/${line.slug}`}
              className="relative h-[104px] w-[80px] shrink-0 bg-accent-dim"
            >
              {line.image && (
                <Image
                  src={line.image}
                  alt={line.name}
                  fill
                  sizes="80px"
                  className="object-cover [filter:grayscale(30%)_contrast(1.1)_brightness(0.85)]"
                />
              )}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-baseline gap-2 text-[9px] tracking-[0.15em] text-fg/40 uppercase">
                {line.brand}
                {line.isPreorder && (
                  <span className="border border-accent px-1 py-0.5 text-[8px] text-accent">
                    예약주문
                  </span>
                )}
              </div>
              <Link
                href={`/m/product/${line.slug}`}
                className="word-keep-all font-kr text-[13px] text-fg active:opacity-60"
              >
                {line.name}
              </Link>
              {line.variantLabel && (
                <span className="font-kr text-[11px] text-fg/50">옵션 · {line.variantLabel}</span>
              )}
              {line.unavailableReason && (
                <span className="word-keep-all font-kr text-[11px] text-accent">
                  {line.unavailableReason === "sold_out"
                    ? "품절되었습니다. 주문하려면 이 항목을 빼 주세요."
                    : "판매가 종료된 상품입니다. 이 항목을 빼 주세요."}
                </span>
              )}

              <div className="mt-1 flex items-center justify-between gap-3">
                <div className="flex items-center border border-fg/15">
                  <button
                    type="button"
                    aria-label="수량 줄이기"
                    disabled={busyId === line.id}
                    onClick={() => send("PATCH", line.id, line.quantity - 1)}
                    className="px-3 py-1 text-[14px] text-fg/60 active:opacity-50 disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="min-w-[28px] text-center text-[12px] text-fg tabular-nums">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="수량 늘리기"
                    disabled={busyId === line.id || line.isPreorder}
                    onClick={() => send("PATCH", line.id, line.quantity + 1)}
                    className="px-3 py-1 text-[14px] text-fg/60 active:opacity-50 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <span className="font-serif text-lg text-accent">
                  {formatPrice(line.lineAmount)}
                </span>
              </div>

              <button
                type="button"
                disabled={busyId === line.id}
                onClick={() => send("DELETE", line.id)}
                className="self-start text-[10px] tracking-[0.15em] text-fg/40 uppercase active:opacity-50 disabled:opacity-40"
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>

      {error && (
        <p aria-live="polite" className="word-keep-all font-kr text-[12px] text-accent">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 font-kr text-[13px] text-fg/60">
        <div className="flex justify-between">
          <span>상품 금액</span>
          <span className="tabular-nums">{formatPrice(cart.itemsAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span>배송비</span>
          <span className="tabular-nums">{formatPrice(cart.shippingFee)}</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between border-t border-fg/10 pt-3">
          <span className="text-[10px] tracking-[0.15em] text-fg uppercase">결제 예정 금액</span>
          <span className="font-serif text-xl text-accent">{formatPrice(cart.totalAmount)}</span>
        </div>
      </div>

      {cart.hasPreorder && (
        <p className="word-keep-all border border-accent/40 bg-accent/[0.06] px-4 py-3 font-kr text-[12px] leading-[1.5] text-accent">
          예약주문 상품이 담겨 있습니다. 사입 확인 후 발송되며, 확보에 실패하면 3영업일 내 전액
          환불됩니다.
        </p>
      )}

      {cart.hasBlockedLine ? (
        <span
          aria-disabled="true"
          className="w-full border border-fg/20 px-4 py-3 text-center text-[12px] tracking-[0.15em] text-fg/40 uppercase"
        >
          주문할 수 없는 항목이 있습니다
        </span>
      ) : (
        <Link
          href="/m/checkout"
          className="w-full border border-accent bg-accent px-4 py-3 text-center text-[12px] tracking-[0.15em] text-bg uppercase active:opacity-70"
        >
          주문서 작성
        </Link>
      )}

      <Link
        href="/m/archive"
        className="text-center text-[10px] tracking-[0.15em] text-fg/40 uppercase active:opacity-50"
      >
        계속 둘러보기
      </Link>
    </div>
  );
}

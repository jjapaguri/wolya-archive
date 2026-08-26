"use client";

/**
 * 장바구니 화면 (데스크톱 `/cart`). 모바일 쌍은 `mobile/MobileCartView.tsx`.
 *
 * 수량·삭제는 `/api/cart` 로 보내고, 응답으로 온 요약을 그대로 그린다.
 * **금액을 이 컴포넌트가 계산하지 않는다** — 서버가 준 값을 표시만 한다.
 */
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "@/data/products";
import type { CartSummary } from "@/lib/orders/shared";

type Props = { cart: CartSummary };

export default function CartView({ cart: initial }: Props) {
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
      <p className="word-keep-all border border-fg/20 bg-fg/[0.03] px-5 py-6 font-kr text-[13px] leading-[1.8] text-fg/60">
        지금은 장바구니를 사용할 수 없습니다. 카카오톡 채널(아카이브_월야)로 문의해 주세요.
      </p>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="flex flex-col items-start gap-6">
        <p className="word-keep-all font-kr text-[13px] leading-[1.8] text-fg/60">
          장바구니가 비어 있습니다.
        </p>
        <Link
          href="/archive"
          className="border border-accent px-5 py-2 font-sans text-[11px] tracking-[0.15em] text-accent uppercase transition-colors hover:bg-accent hover:text-bg"
        >
          아카이브 둘러보기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <ul className="flex flex-col border-t border-border">
        {cart.lines.map((line) => (
          <li
            key={line.id}
            className="flex gap-5 border-b border-border py-6"
          >
            <Link
              href={`/product/${line.slug}`}
              className="relative h-[120px] w-[96px] shrink-0 bg-accent-dim"
            >
              {line.image && (
                <Image
                  src={line.image}
                  alt={line.name}
                  fill
                  sizes="96px"
                  className="object-cover [filter:grayscale(30%)_contrast(1.1)_brightness(0.85)]"
                />
              )}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-baseline gap-2 font-sans text-[10px] tracking-[0.15em] text-fg/40 uppercase">
                {line.brand}
                {line.isPreorder && (
                  <span className="border border-accent px-1.5 py-0.5 text-[9px] text-accent">
                    예약주문
                  </span>
                )}
              </div>
              <Link
                href={`/product/${line.slug}`}
                className="word-keep-all font-kr text-[14px] text-fg transition-colors hover:text-accent"
              >
                {line.name}
              </Link>
              {line.variantLabel && (
                <span className="font-kr text-[12px] text-fg/50">옵션 · {line.variantLabel}</span>
              )}

              {line.unavailableReason && (
                <span className="word-keep-all font-kr text-[12px] text-accent">
                  {line.unavailableReason === "sold_out"
                    ? "품절되었습니다. 주문하려면 이 항목을 빼 주세요."
                    : "판매가 종료된 상품입니다. 이 항목을 빼 주세요."}
                </span>
              )}

              <div className="mt-1 flex items-center gap-3">
                <div className="flex items-center border border-border">
                  <button
                    type="button"
                    aria-label="수량 줄이기"
                    disabled={busyId === line.id}
                    onClick={() => send("PATCH", line.id, line.quantity - 1)}
                    className="px-3 py-1 font-sans text-[13px] text-fg/60 transition-colors hover:text-accent disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="min-w-[32px] text-center font-sans text-[12px] text-fg tabular-nums">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="수량 늘리기"
                    disabled={busyId === line.id || line.isPreorder}
                    onClick={() => send("PATCH", line.id, line.quantity + 1)}
                    className="px-3 py-1 font-sans text-[13px] text-fg/60 transition-colors hover:text-accent disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  disabled={busyId === line.id}
                  onClick={() => send("DELETE", line.id)}
                  className="font-sans text-[10px] tracking-[0.15em] text-fg/40 uppercase transition-colors hover:text-accent disabled:opacity-40"
                >
                  삭제
                </button>
              </div>
            </div>

            <div className="shrink-0 text-right font-serif text-xl text-accent">
              {formatPrice(line.lineAmount)}
            </div>
          </li>
        ))}
      </ul>

      {error && (
        <p aria-live="polite" className="word-keep-all font-kr text-[12px] text-accent">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 self-end text-right font-kr text-[13px] text-fg/60">
        <div className="flex justify-between gap-10">
          <span>상품 금액</span>
          <span className="tabular-nums">{formatPrice(cart.itemsAmount)}</span>
        </div>
        <div className="flex justify-between gap-10">
          <span>배송비</span>
          <span className="tabular-nums">{formatPrice(cart.shippingFee)}</span>
        </div>
        <div className="mt-2 flex justify-between gap-10 border-t border-border pt-3 text-fg">
          <span className="font-sans text-[10px] tracking-[0.15em] uppercase">결제 예정 금액</span>
          <span className="font-serif text-2xl text-accent">{formatPrice(cart.totalAmount)}</span>
        </div>
      </div>

      {cart.hasPreorder && (
        <p className="word-keep-all border border-accent/40 bg-accent/[0.06] px-4 py-3 font-kr text-[12px] leading-[1.6] text-accent">
          예약주문 상품이 담겨 있습니다. 사입 확인 후 발송되며, 확보에 실패하면 3영업일 내 전액
          환불됩니다.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-4">
        <Link
          href="/archive"
          className="font-sans text-[10px] tracking-[0.15em] text-fg/50 uppercase transition-colors hover:text-accent"
        >
          계속 둘러보기
        </Link>
        {cart.hasBlockedLine ? (
          <span
            aria-disabled="true"
            className="cursor-not-allowed border border-fg/20 px-6 py-3 font-sans text-[11px] tracking-[0.15em] text-fg/40 uppercase"
          >
            주문할 수 없는 항목이 있습니다
          </span>
        ) : (
          <Link
            href="/checkout"
            className="border border-accent bg-accent px-6 py-3 font-sans text-[11px] tracking-[0.15em] text-bg uppercase transition-opacity hover:opacity-85"
          >
            주문서 작성
          </Link>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileFooter from "@/components/mobile/MobileFooter";
import MobileOrderLookupForm from "@/components/mobile/MobileOrderLookupForm";
import { formatPrice } from "@/data/products";
import { findOrderForViewer } from "@/lib/orders/lookup";
import {
  DEPOSIT_DUE_DAYS,
  ORDER_STATUS_LABELS,
  formatDateTimeKst,
  type OrderView,
} from "@/lib/orders/shared";

/**
 * 주문 완료 · 무통장 입금 안내 (모바일). 데스크톱 쌍은 `/order/[orderNo]`.
 * 주문번호만으로는 열리지 않는다 — 이유는 `src/lib/orders/lookup.ts` 주석.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "주문 내역 | WOLYA ARCHIVE",
  robots: { index: false, follow: false },
};

export default async function MobileOrderPage({ params }: PageProps<"/m/order/[orderNo]">) {
  const { orderNo } = await params;
  const order = await findOrderForViewer(orderNo);

  if (!order) {
    return (
      <>
        <GrainOverlay alpha={15} frameIntervalMs={50} />
        <MobileHeader />
        <main className="w-full px-6 pt-[92px] pb-16">
          <h1 className="word-keep-all mb-4 font-kr text-xl font-medium">본인 확인이 필요합니다</h1>
          <p className="word-keep-all mb-8 font-kr text-[13px] leading-[1.8] font-light text-fg/70">
            주문 내역은 주문번호와 주문자 휴대폰번호가 모두 맞아야 열립니다.
          </p>
          <MobileOrderLookupForm defaultOrderNo={orderNo.toUpperCase()} />
        </main>
        <MobileFooter />
      </>
    );
  }

  return (
    <>
      <GrainOverlay alpha={15} frameIntervalMs={50} />
      <MobileHeader />

      <main className="w-full px-6 pt-[92px] pb-16">
        <Link href="/m" className="mb-6 inline-block text-[10px] tracking-[0.2em] text-fg/50 uppercase">
          ← 홈으로
        </Link>

        <h1 className="word-keep-all mb-2 font-kr text-xl font-medium">주문이 접수되었습니다</h1>
        <p className="mb-8 text-[10px] tracking-[0.15em] text-fg/50 uppercase">
          {order.orderNo} · {formatDateTimeKst(order.createdAt)} ·{" "}
          <span className="text-accent">{ORDER_STATUS_LABELS[order.status] ?? order.status}</span>
        </p>

        <MobileDepositNotice order={order} />

        <section className="mb-8">
          <h2 className="mb-3 text-[10px] tracking-[0.2em] text-accent uppercase">주문 상품</h2>
          <ul className="flex flex-col border-t border-fg/10">
            {order.items.map((item, index) => (
              <li
                key={`${item.productName}-${index}`}
                className="flex items-baseline justify-between gap-3 border-b border-fg/10 py-3"
              >
                <span className="word-keep-all font-kr text-[13px] text-fg/80">
                  {item.slug ? (
                    <Link href={`/m/product/${item.slug}`} className="active:opacity-60">
                      {item.productName}
                    </Link>
                  ) : (
                    item.productName
                  )}
                  {item.variantLabel && <span className="text-fg/40"> · {item.variantLabel}</span>}
                  <span className="text-fg/40"> × {item.quantity}</span>
                  {item.isPreorder && (
                    <span className="ml-1.5 border border-accent px-1 py-0.5 text-[8px] tracking-[0.1em] text-accent">
                      예약주문
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-serif text-base text-accent">
                  {formatPrice(item.lineAmount)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-2 font-kr text-[12px] text-fg/60">
            <div className="flex justify-between">
              <span>상품 금액</span>
              <span className="tabular-nums">{formatPrice(order.itemsAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>배송비</span>
              <span className="tabular-nums">{formatPrice(order.shippingFee)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between">
                <span>할인</span>
                <span className="tabular-nums">- {formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="mt-1 flex items-baseline justify-between border-t border-fg/10 pt-3">
              <span className="text-[10px] tracking-[0.15em] text-fg uppercase">총 결제금액</span>
              <span className="font-serif text-xl text-accent">
                {formatPrice(order.totalAmount)}
              </span>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-[10px] tracking-[0.2em] text-accent uppercase">배송지</h2>
          <div className="word-keep-all flex flex-col gap-1 border-t border-fg/10 pt-3 font-kr text-[12px] leading-[1.7] text-fg/70">
            <span>
              {order.recipient} · {order.ordererPhoneMasked}
            </span>
            <span>
              ({order.postcode}) {order.address1} {order.address2}
            </span>
            {order.deliveryMemo && <span className="text-fg/50">메모 · {order.deliveryMemo}</span>}
          </div>
        </section>

        <div className="flex flex-wrap gap-4 border-t border-fg/10 pt-5">
          <Link
            href="/m/order-lookup"
            className="text-[10px] tracking-[0.15em] text-fg/40 uppercase active:opacity-50"
          >
            다른 주문 조회
          </Link>
          <a
            href="http://pf.kakao.com/_bvxlSX"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] tracking-[0.15em] text-fg/40 uppercase active:opacity-50"
          >
            문의하기
          </a>
        </div>
      </main>

      <MobileFooter />
    </>
  );
}

/** 무통장 입금 안내. 계좌가 설정돼 있지 않으면 가짜 계좌를 그리지 않는다. */
function MobileDepositNotice({ order }: { order: OrderView }) {
  const payment = order.payment;
  if (!payment || payment.provider !== "manual") return null;
  if (order.status !== "pending") return null;

  const account = payment.bankTransfer;

  return (
    <section className="mb-8 border border-accent/40 bg-accent/[0.06] px-4 py-5">
      <h2 className="mb-3 text-[10px] tracking-[0.2em] text-accent uppercase">무통장 입금 안내</h2>

      {account ? (
        <dl className="mb-3 flex flex-col gap-1.5 font-kr text-[13px] text-fg/80">
          <div className="flex gap-3">
            <dt className="min-w-[60px] text-fg/50">은행</dt>
            <dd>{account.bank}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="min-w-[60px] text-fg/50">계좌번호</dt>
            <dd className="tabular-nums">{account.accountNo}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="min-w-[60px] text-fg/50">예금주</dt>
            <dd>{account.holder}</dd>
          </div>
        </dl>
      ) : (
        <p className="word-keep-all mb-3 font-kr text-[12px] leading-[1.7] text-fg/70">
          입금 계좌는 카카오톡 채널(아카이브_월야)로 안내해 드립니다. 주문번호를 함께 남겨
          주세요.
        </p>
      )}

      <dl className="mb-3 flex flex-col gap-1.5 font-kr text-[13px] text-fg/80">
        <div className="flex items-baseline gap-3">
          <dt className="min-w-[60px] text-fg/50">입금액</dt>
          <dd className="font-serif text-lg text-accent">{formatPrice(payment.amount)}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="min-w-[60px] text-fg/50">입금자명</dt>
          <dd>{payment.depositName}</dd>
        </div>
        {payment.depositDueAt && (
          <div className="flex gap-3">
            <dt className="min-w-[60px] text-fg/50">입금 기한</dt>
            <dd>{formatDateTimeKst(payment.depositDueAt)}</dd>
          </div>
        )}
      </dl>

      <p className="word-keep-all font-kr text-[11px] leading-[1.7] text-fg/60">
        {DEPOSIT_DUE_DAYS}일 이내에 입금이 확인되지 않으면 주문이 자동으로 취소됩니다.
        {order.hasPreorder &&
          " 예약주문 상품은 입금 확인 후 사입을 진행하며, 확보에 실패하면 3영업일 내 전액 환불됩니다."}
      </p>
    </section>
  );
}

/**
 * 결제 수단 추상화 — **PG 는 나중에 provider 만 갈아끼운다.**
 *
 * 지금 계약(PG 심사)이 아직이라 구현체는 무통장 입금(`manual`) 하나뿐이다.
 * 그래서 주문 코드가 "계좌번호" 를 직접 아는 일이 없도록 이 층을 먼저 세운다.
 * 토스·포트원이 붙는 날 하는 일은 두 가지다:
 *
 *   1. `src/lib/payment/<provider>.ts` 에 `PaymentProvider` 를 하나 더 구현한다
 *   2. 아래 `PROVIDERS` 에 등록한다
 *
 * 주문 생성 코드(`src/lib/orders/checkout.ts`)는 고치지 않는다.
 *
 * ── 이 층이 하지 않는 것 ──────────────────────────────────────────
 * - **DB 를 건드리지 않는다.** `prepare()` 는 payments 행에 넣을 값을 만들어 줄 뿐이고,
 *   INSERT 는 주문 트랜잭션 안에서 checkout.ts 가 한다. 결제 기록과 주문·재고 차감이
 *   같은 트랜잭션이어야 하기 때문이다.
 * - **금액을 정하지 않는다.** 금액은 서버가 DB 가격으로 재계산한 값만 들어온다(불변규칙 2).
 * - **웹훅을 처리하지 않는다.** 무통장은 웹훅이 없다. PG 가 붙으면 `pg_transaction_id`
 *   UNIQUE 를 멱등 키로 쓰는 웹훅 라우트를 provider 별로 따로 만든다(불변규칙 5).
 */
import type { BankTransferInfo } from "@/lib/orders/shared";
import { manualPaymentProvider } from "@/lib/payment/manual";

/** 004_payments 의 `pg_provider` CHECK 와 같은 목록이다. 여기를 늘리려면 CHECK 도 같이 본다. */
export type PaymentProviderId = "manual" | "toss" | "portone" | "kakaopay" | "naverpay";

/** 004_payments 의 `method` CHECK 와 같은 목록. */
export type PaymentMethod = "card" | "transfer" | "vbank" | "easy_pay" | "phone";

/** 주문이 결제 수단에 건네는 사실. 전부 서버가 계산·검증한 값이다. */
export type PaymentIntent = {
  orderNo: string;
  /** 서버가 DB 가격으로 재계산한 총액 (원 단위 정수) */
  amount: number;
  ordererName: string;
  /** 무통장 입금자명. 비어 있으면 주문자명을 쓴다 */
  depositName: string;
};

/** payments 행에 넣을 값. checkout.ts 가 이대로 INSERT 한다. */
export type PaymentDraft = {
  provider: PaymentProviderId;
  method: PaymentMethod;
  /** 무통장은 승인 개념이 없어 항상 'ready' 로 시작한다. 입금 확인은 사람이 한다 */
  status: "ready";
  amount: number;
  depositName: string | null;
  depositDueAt: Date | null;
  /**
   * PG 거래 ID. 승인 전에는 NULL 이고, 무통장은 끝까지 NULL 이다.
   * (004 의 `payments_paid_needs_proof` CHECK 때문에 status='paid' 로 올리는 쪽이
   *  이 값을 반드시 채워야 한다 — 무통장은 운영이 입금 확인하며 넣는다)
   */
  pgTransactionId: string | null;
};

/** 주문 완료·조회 화면에 그릴 안내. 수단마다 모양이 다르다. */
export type PaymentInstruction =
  | {
      kind: "bank_transfer";
      /** 계좌가 설정돼 있지 않으면 null — 화면은 "카카오톡으로 안내" 대체 문구를 그린다 */
      account: BankTransferInfo | null;
      amount: number;
      depositName: string;
      dueAt: string | null;
    }
  | { kind: "redirect"; url: string };

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  readonly method: PaymentMethod;
  /** 주문서에 보이는 이름 */
  readonly label: string;
  /** 고객이 결제하는 방법을 한 줄로 */
  readonly description: string;
  /**
   * payments 행에 넣을 값을 만든다. DB 를 건드리지 않는다.
   * PG 가 붙으면 여기서 승인창 발급 API 를 호출하므로 처음부터 비동기로 둔다.
   */
  prepare(intent: PaymentIntent): Promise<PaymentDraft>;
}

const PROVIDERS: Partial<Record<PaymentProviderId, PaymentProvider>> = {
  manual: manualPaymentProvider,
};

/** 지금 실제로 받을 수 있는 결제 수단. PG 계약 전에는 무통장 하나뿐이다. */
export const ENABLED_PROVIDER_IDS: PaymentProviderId[] = ["manual"];

export function getPaymentProvider(id: PaymentProviderId): PaymentProvider {
  const provider = PROVIDERS[id];
  if (!provider) throw new Error(`지원하지 않는 결제 수단: ${id}`);
  return provider;
}

/** 주문서 기본 결제 수단. PG 가 붙으면 여기를 바꾸는 것으로 기본값이 옮겨간다. */
export const DEFAULT_PROVIDER_ID: PaymentProviderId = "manual";

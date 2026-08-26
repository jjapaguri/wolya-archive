/**
 * 무통장 입금 — `PaymentProvider` 의 첫 구현체.
 *
 * PG 계약·심사가 끝나기 전까지 이 사이트가 실제로 받을 수 있는 유일한 결제 수단이다.
 * `payments.pg_provider = 'manual'`, `method = 'transfer'` 로 기록된다.
 *
 * ── 승인이라는 단계가 없다 ────────────────────────────────────────
 * 카드 결제와 달리 무통장은 "승인" 순간이 없다. 주문은 항상 `status='ready'` 인
 * payments 행과 `status='pending'` 인 주문으로 시작하고, 통장에 돈이 들어온 것을
 * **사람이 확인해서** 결제 완료로 올린다. 그래서:
 *
 *   - `pg_transaction_id` 는 여기서 NULL 이다. 004 의 `payments_paid_needs_proof`
 *     CHECK 가 `status='paid'` 로 올릴 때 이 값을 요구하므로, 입금 확인 절차가
 *     입금 건을 식별하는 값(예: 은행 거래고유번호)을 그때 채워야 한다.
 *   - 재고는 **주문 시점에** 깎는다. 입금까지 기다리면 단벌 상품이 중복 판매된다.
 *     기한 내 미입금이면 운영이 주문을 취소하며 재고를 되돌린다.
 *
 * ── 계좌번호는 코드에 박지 않는다 ─────────────────────────────────
 * `.env` 에서 읽는다 (AGENTS.md 불변규칙 6 — 비밀값은 물론이고, 값이 바뀔 수 있는
 * 운영 설정을 커밋에 박으면 고치는 데 배포가 필요해진다).
 * **설정되지 않았으면 가짜 계좌를 그리지 않고 안내 문구를 바꾼다** — 틀린 계좌번호를
 * 보여주는 것이 계좌를 안 보여주는 것보다 훨씬 나쁘다.
 *
 *   WOLYA_BANK_NAME     은행명            (예: 국민은행)
 *   WOLYA_BANK_ACCOUNT  계좌번호
 *   WOLYA_BANK_HOLDER   예금주
 *
 * 셋 다 서버에서만 읽는다. `NEXT_PUBLIC_` 접두사를 붙이지 말 것 — 붙이면 값이
 * 클라이언트 번들에 인라인된다.
 */
import { DEPOSIT_DUE_DAYS, type BankTransferInfo } from "@/lib/orders/shared";
import type { PaymentDraft, PaymentIntent, PaymentProvider } from "@/lib/payment/provider";

/**
 * 입금 계좌. 환경변수가 하나라도 비어 있으면 `null` 이다.
 *
 * 모듈 최상단이 아니라 호출 시점에 읽는다 — 빌드 때 굳으면 서버에서 `.env` 를 고쳐도
 * 반영되지 않고, CI 빌드(값 없음)의 결과가 운영에 그대로 실린다.
 */
export function getBankAccount(): BankTransferInfo | null {
  const bank = process.env.WOLYA_BANK_NAME?.trim();
  const accountNo = process.env.WOLYA_BANK_ACCOUNT?.trim();
  const holder = process.env.WOLYA_BANK_HOLDER?.trim();
  if (!bank || !accountNo || !holder) return null;
  return { bank, accountNo, holder };
}

/** 입금 기한 — 주문 시각 + DEPOSIT_DUE_DAYS 일. */
export function depositDueAt(from: Date = new Date()): Date {
  const due = new Date(from);
  due.setDate(due.getDate() + DEPOSIT_DUE_DAYS);
  return due;
}

export const manualPaymentProvider: PaymentProvider = {
  id: "manual",
  method: "transfer",
  label: "무통장 입금",
  description: `주문 후 ${DEPOSIT_DUE_DAYS}일 이내에 안내 계좌로 입금해 주세요. 입금이 확인되면 발송을 준비합니다.`,

  async prepare(intent: PaymentIntent): Promise<PaymentDraft> {
    return {
      provider: "manual",
      method: "transfer",
      status: "ready",
      amount: intent.amount,
      depositName: (intent.depositName || intent.ordererName).trim() || null,
      depositDueAt: depositDueAt(),
      // 무통장은 PG 거래가 없다. 입금 확인 절차가 나중에 채운다.
      pgTransactionId: null,
    };
  },
};

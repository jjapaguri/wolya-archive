/**
 * 주문·장바구니의 **공유 계약** — 타입 · 검증 · 금액 정책.
 *
 * **이 파일은 `pg` 를 import 하지 않는다.** `src/data/products.ts` 와 같은 이유다 —
 * 데스크톱·모바일 양쪽의 "use client" 폼이 여기서 타입과 검증을 가져가므로,
 * DB 드라이버가 딸려 오면 브라우저 번들이 module-not-found 로 죽는다.
 * 커넥션을 쓰는 쪽은 `src/lib/orders/cart.ts` · `checkout.ts` · `lookup.ts`.
 *
 * ── 검증이 두 번 도는 이유 ────────────────────────────────────────
 * 여기 있는 `validateCheckout` 을 클라이언트 폼이 먼저 돌려 즉시 오류를 보여주고,
 * **서버가 같은 함수를 다시 돌린다.** 클라이언트 검증은 편의이지 방어가 아니다.
 * 금액도 마찬가지다 — 클라이언트가 보낸 금액은 어디에서도 쓰지 않는다(불변규칙 2).
 * 서버는 DB 의 현재 가격으로 다시 계산하고, 화면에 보이던 금액과 다르면 주문을 세우지 않는다.
 */

/** 배송비 (원). 정수 원 단위 — 금액에 부동소수점을 쓰지 않는다 (불변규칙 1). */
export const SHIPPING_FEE = 3500;

/**
 * 무통장 입금 기한 (일). 이 시간이 지나도 미입금이면 운영이 주문을 취소한다.
 * 단벌이라 오래 잡아두면 팔 수 있는 물건이 묶인다.
 */
export const DEPOSIT_DUE_DAYS = 3;

/** 한 항목의 최대 수량. 단벌 재고라 사실상 1이지만, 다옵션 상품이 생길 자리를 남겨 둔다. */
export const MAX_LINE_QUANTITY = 10;

/**
 * 배송비 계산 — **서버가 이 함수로만 계산한다.**
 *
 * 지금은 주문당 정액이다. 무료배송 기준선은 프로모션 결정이라
 * (AGENTS.md 4절 "가격 인하·프로모션 결정") 사람 승인 없이 넣지 않는다.
 * 기준선이 생기면 이 함수 한 곳만 고치면 화면·주문 양쪽이 같이 바뀐다.
 */
export function calcShippingFee(itemsAmount: number): number {
  return itemsAmount > 0 ? SHIPPING_FEE : 0;
}

// ── 화면이 보는 모양 ────────────────────────────────────────────

/** 장바구니 한 줄. 가격은 **조회 시점의 상품 가격**이지 담을 때의 가격이 아니다. */
export type CartLine = {
  /** cart_items.id — 수량 변경·삭제가 이 값으로 온다 */
  id: number;
  variantId: number;
  /** 통계·재입고 문의용 참조. 주문서에는 이 값과 함께 이름·단가 스냅샷이 같이 들어간다 */
  productId: number;
  slug: string;
  name: string;
  brand: string;
  /** 옵션 표기 (사이즈·색상). 단벌이라 대개 사이즈 한 줄이다 */
  variantLabel: string;
  image: string;
  unitPrice: number;
  quantity: number;
  lineAmount: number;
  /** 예약주문 항목 — 재고 0 이어도 주문을 받는다. 안내 문구가 달라진다 */
  isPreorder: boolean;
  /** 지금 남은 재고. 예약주문은 0 이 정상이다 */
  stockQuantity: number;
  /** 담아둔 사이 팔렸거나 내려간 항목 — 주문으로 넘어갈 수 없다 */
  unavailableReason: "sold_out" | "unpublished" | null;
};

/**
 * 상세페이지의 옵션 선택지 (사이즈·색상).
 * 가격·재고는 담을 때 서버가 다시 읽으므로 여기 값은 **표시용**이다.
 */
export type PurchaseOption = {
  variantId: number;
  label: string;
  stockQuantity: number;
  isPreorder: boolean;
  /** 지금 담을 수 있는가 — 예약주문은 재고 0 이어도 담을 수 있다 */
  orderable: boolean;
};

export type CartSummary = {
  lines: CartLine[];
  itemsAmount: number;
  shippingFee: number;
  totalAmount: number;
  /** 주문 불가 항목이 하나라도 있으면 주문서로 넘어가지 못한다 */
  hasBlockedLine: boolean;
  /** 예약주문이 섞여 있으면 주문서·완료 화면의 안내 문구가 달라진다 */
  hasPreorder: boolean;
  /** DB 를 못 읽어 장바구니 기능 자체를 쓸 수 없는 상태 */
  unavailable: boolean;
};

export const EMPTY_CART: CartSummary = {
  lines: [],
  itemsAmount: 0,
  shippingFee: 0,
  totalAmount: 0,
  hasBlockedLine: false,
  hasPreorder: false,
  unavailable: false,
};

/** 주문 조회·완료 화면이 보는 주문 한 건. 전부 주문 시점 스냅샷이다. */
export type OrderView = {
  orderNo: string;
  status: OrderStatus;
  createdAt: string;
  ordererName: string;
  /** 가운데를 가린 휴대폰번호. 화면에는 원본을 그리지 않는다 */
  ordererPhoneMasked: string;
  recipient: string;
  postcode: string;
  address1: string;
  address2: string;
  deliveryMemo: string;
  itemsAmount: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  items: OrderItemView[];
  hasPreorder: boolean;
  payment: PaymentView | null;
};

export type OrderItemView = {
  productName: string;
  variantLabel: string;
  slug: string | null;
  unitPrice: number;
  quantity: number;
  lineAmount: number;
  isPreorder: boolean;
};

export type PaymentView = {
  provider: string;
  method: string;
  status: string;
  amount: number;
  depositName: string;
  depositDueAt: string | null;
  /** 무통장 입금 안내. 계좌가 설정돼 있지 않으면 null 이고 화면은 대체 안내를 그린다 */
  bankTransfer: BankTransferInfo | null;
};

export type BankTransferInfo = {
  bank: string;
  accountNo: string;
  holder: string;
};

export type OrderStatus =
  | "pending"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "입금 대기",
  paid: "입금 확인",
  preparing: "상품 준비중",
  shipped: "배송중",
  delivered: "배송완료",
  cancelled: "주문 취소",
  refunded: "환불 완료",
};

// ── 주문서 입력 ─────────────────────────────────────────────────

/** 주문서가 받는 값. **여기 없는 개인정보는 수집하지 않는다** (불변규칙 7). */
export type CheckoutInput = {
  ordererName: string;
  ordererPhone: string;
  /** 선택. 입금 확인·배송 안내를 메일로 받고 싶을 때만 */
  ordererEmail: string;
  recipient: string;
  recipientPhone: string;
  postcode: string;
  address1: string;
  address2: string;
  deliveryMemo: string;
  /** 무통장 입금자명. 비우면 주문자명으로 본다 */
  depositName: string;
  /** 필수 동의 — 서버가 시각으로 저장한다 */
  agreeTerms: boolean;
  agreePrivacy: boolean;
};

export const EMPTY_CHECKOUT_INPUT: CheckoutInput = {
  ordererName: "",
  ordererPhone: "",
  ordererEmail: "",
  recipient: "",
  recipientPhone: "",
  postcode: "",
  address1: "",
  address2: "",
  deliveryMemo: "",
  depositName: "",
  agreeTerms: false,
  agreePrivacy: false,
};

/** 필드명 → 오류 문구. 비어 있으면 통과다. */
export type CheckoutErrors = Partial<Record<keyof CheckoutInput, string>>;

/** 휴대폰번호에서 숫자만 남긴다. 저장·대조는 항상 이 형태로 한다. */
export function normalizePhone(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

/** 010-1234-5678 형태로 보기 좋게. 형식이 아니면 원본을 그대로 돌려준다. */
export function formatPhone(value: string): string {
  const digits = normalizePhone(value);
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return value;
}

/** 가운데 4자리를 가린다. 주문 조회 화면이 본인 확인용으로만 보여준다. */
export function maskPhone(value: string): string {
  const digits = normalizePhone(value);
  if (digits.length < 7) return "***";
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}

export function isValidPhone(value: string): boolean {
  return /^01[016789][0-9]{7,8}$/.test(normalizePhone(value));
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/** 주문번호 형식 — 003 의 orders_no_format CHECK 와 같은 규칙이다. */
export function isValidOrderNo(value: string): boolean {
  return /^[0-9]{8}-[A-Z0-9]{6,15}$/.test(value.trim().toUpperCase());
}

/**
 * 주문서 검증. **클라이언트와 서버가 같은 함수를 쓴다.**
 * 서버 쪽 호출이 진짜 방어선이고, 클라이언트 호출은 즉시 피드백용이다.
 */
export function validateCheckout(input: CheckoutInput): CheckoutErrors {
  const errors: CheckoutErrors = {};

  if (input.ordererName.trim().length < 2) errors.ordererName = "주문자명을 입력해 주세요.";
  else if (input.ordererName.trim().length > 40) errors.ordererName = "주문자명이 너무 깁니다.";

  if (!isValidPhone(input.ordererPhone)) errors.ordererPhone = "휴대폰번호를 정확히 입력해 주세요.";

  if (input.ordererEmail.trim() && !isValidEmail(input.ordererEmail.trim()))
    errors.ordererEmail = "이메일 형식이 올바르지 않습니다.";

  if (input.recipient.trim().length < 2) errors.recipient = "받는 분 성함을 입력해 주세요.";
  else if (input.recipient.trim().length > 40) errors.recipient = "받는 분 성함이 너무 깁니다.";

  if (!isValidPhone(input.recipientPhone))
    errors.recipientPhone = "받는 분 휴대폰번호를 정확히 입력해 주세요.";

  if (!/^[0-9]{5}$/.test(input.postcode.trim())) errors.postcode = "우편번호 5자리를 입력해 주세요.";

  if (input.address1.trim().length < 5) errors.address1 = "주소를 입력해 주세요.";
  else if (input.address1.trim().length > 200) errors.address1 = "주소가 너무 깁니다.";

  if (input.address2.trim().length > 100) errors.address2 = "상세주소가 너무 깁니다.";
  if (input.deliveryMemo.trim().length > 100) errors.deliveryMemo = "배송 메모가 너무 깁니다.";
  if (input.depositName.trim().length > 30) errors.depositName = "입금자명이 너무 깁니다.";

  if (!input.agreeTerms) errors.agreeTerms = "이용약관에 동의해 주세요.";
  if (!input.agreePrivacy) errors.agreePrivacy = "개인정보 수집·이용에 동의해 주세요.";

  return errors;
}

export function hasErrors(errors: CheckoutErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** 임의의 JSON 을 CheckoutInput 으로 좁힌다. 모르는 키는 버린다. */
export function toCheckoutInput(raw: unknown): CheckoutInput {
  const source = (raw ?? {}) as Record<string, unknown>;
  const text = (key: string) => (typeof source[key] === "string" ? (source[key] as string) : "");
  return {
    ordererName: text("ordererName"),
    ordererPhone: text("ordererPhone"),
    ordererEmail: text("ordererEmail"),
    recipient: text("recipient"),
    recipientPhone: text("recipientPhone"),
    postcode: text("postcode"),
    address1: text("address1"),
    address2: text("address2"),
    deliveryMemo: text("deliveryMemo"),
    depositName: text("depositName"),
    agreeTerms: source.agreeTerms === true,
    agreePrivacy: source.agreePrivacy === true,
  };
}

/** 주문 화면의 날짜·시각 표기. 서버 타임존과 무관하게 항상 한국 시간으로 그린다. */
export function formatDateTimeKst(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * 주문 조회 — 로그인 없이 "주문번호 + 휴대폰번호" 로 연다 (003 의 확정 전제).
 *
 * 서버 전용이다(`pg` 를 끌어온다).
 *
 * ── 주문번호만으로는 열리지 않는다 ────────────────────────────────
 * 주문 완료 화면(`/order/[orderNo]`)도 결국 같은 규칙을 지킨다. 주문 직후에
 * 휴대폰번호를 다시 묻지 않기 위해, **주문번호와 휴대폰 해시**를 httpOnly 쿠키에
 * 담아 두고 페이지가 그것으로 본인 확인을 한다:
 *
 *   - 쿠키에는 휴대폰 원본을 넣지 않는다. SHA-256 해시만 넣는다
 *     (안 쓰는 개인정보는 두지 않는다 — 불변규칙 7).
 *   - 쿠키는 사용자가 고칠 수 있는 값이므로, 위조하려면 **그 주문의 휴대폰번호를
 *     알아야** 한다. 즉 위조 난이도가 조회 폼과 같다. 주문번호 하나만 새는 링크
 *     공유 사고로는 열리지 않는다.
 *   - 비교는 `timingSafeEqual` 로 한다.
 *
 * 조회 폼(`POST /api/orders/lookup`)이 성공하면 같은 쿠키를 세우므로, 그 뒤로는
 * 주문 상세 링크를 그대로 열 수 있다.
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { isDatabaseConfigured, query } from "@/lib/db";
import {
  SQL_ORDER_BY_NO,
  SQL_ORDER_BY_NO_AND_PHONE,
  SQL_ORDER_ITEMS,
  SQL_ORDER_PAYMENT,
} from "@/lib/orders/queries";
import {
  isValidOrderNo,
  maskPhone,
  normalizePhone,
  type OrderStatus,
  type OrderView,
} from "@/lib/orders/shared";
import { getBankAccount } from "@/lib/payment/manual";

export const ORDER_ACCESS_COOKIE = "wolya_order";

/** 7일. 그 뒤에는 조회 폼에서 주문번호+휴대폰으로 다시 연다. */
const ACCESS_MAX_AGE = 60 * 60 * 24 * 7;

/** 쿠키에 담아 두는 최근 주문 수. 무한정 쌓이면 쿠키가 커진다. */
const MAX_REMEMBERED = 5;

type Num = number | string;

type OrderRow = {
  id: Num;
  order_no: string;
  status: string;
  created_at: Date | string;
  orderer_name: string;
  orderer_phone: string;
  orderer_email: string | null;
  recipient: string;
  recipient_phone: string;
  postcode: string;
  address1: string;
  address2: string | null;
  delivery_memo: string | null;
  items_amount: Num;
  shipping_fee: Num;
  discount_amount: Num;
  total_amount: Num;
};

type OrderItemRow = {
  product_name: string;
  variant_label: string | null;
  unit_price: Num;
  quantity: Num;
  line_amount: Num;
  is_preorder: boolean | null;
  slug: string | null;
};

type PaymentRow = {
  pg_provider: string;
  method: string;
  status: string;
  amount: Num;
  deposit_name: string | null;
  deposit_due_at: Date | string | null;
};

type AccessEntry = { no: string; ph: string };

function n(value: Num | null | undefined): number {
  return Number(value ?? 0);
}

function toIso(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

/** 휴대폰번호(숫자만) → 해시. 쿠키에 넣는 것은 항상 이 값이다. */
export function hashPhone(phone: string): string {
  return createHash("sha256").update(normalizePhone(phone)).digest("hex");
}

function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

async function loadOrderView(row: OrderRow): Promise<OrderView> {
  const orderId = n(row.id);
  const [itemRows, paymentRows] = await Promise.all([
    query<OrderItemRow>(SQL_ORDER_ITEMS, [orderId]),
    query<PaymentRow>(SQL_ORDER_PAYMENT, [orderId]),
  ]);

  const items = itemRows.map((item) => ({
    productName: item.product_name,
    variantLabel: item.variant_label ?? "",
    slug: item.slug,
    unitPrice: n(item.unit_price),
    quantity: n(item.quantity),
    lineAmount: n(item.line_amount),
    isPreorder: item.is_preorder === true,
  }));

  const payment = paymentRows[0] ?? null;

  return {
    orderNo: row.order_no,
    status: row.status as OrderStatus,
    createdAt: toIso(row.created_at) ?? "",
    ordererName: row.orderer_name,
    ordererPhoneMasked: maskPhone(row.orderer_phone),
    recipient: row.recipient,
    postcode: row.postcode,
    address1: row.address1,
    address2: row.address2 ?? "",
    deliveryMemo: row.delivery_memo ?? "",
    itemsAmount: n(row.items_amount),
    shippingFee: n(row.shipping_fee),
    discountAmount: n(row.discount_amount),
    totalAmount: n(row.total_amount),
    items,
    hasPreorder: items.some((item) => item.isPreorder),
    payment: payment
      ? {
          provider: payment.pg_provider,
          method: payment.method,
          status: payment.status,
          amount: n(payment.amount),
          depositName: payment.deposit_name ?? row.orderer_name,
          depositDueAt: toIso(payment.deposit_due_at),
          // 무통장일 때만 계좌를 붙인다. 설정이 없으면 null 이고 화면이 대체 안내를 그린다.
          bankTransfer: payment.pg_provider === "manual" ? getBankAccount() : null,
        }
      : null,
  };
}

/** 주문번호 + 휴대폰번호. 둘 다 맞아야 열린다. 못 찾으면 null. */
export async function findOrderByNoAndPhone(
  orderNo: string,
  phone: string
): Promise<OrderView | null> {
  if (!isDatabaseConfigured()) return null;
  const normalizedNo = orderNo.trim().toUpperCase();
  const digits = normalizePhone(phone);
  if (!isValidOrderNo(normalizedNo) || digits.length < 10) return null;

  try {
    const rows = await query<OrderRow>(SQL_ORDER_BY_NO_AND_PHONE, [normalizedNo, digits]);
    if (rows.length === 0) return null;
    return await loadOrderView(rows[0]);
  } catch (error) {
    console.error(
      "[order] 주문 조회 실패:",
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

/**
 * 쿠키에 담긴 본인 확인으로 여는 주문 상세.
 * 쿠키가 없거나 해시가 다르면 null — 화면은 조회 폼으로 보낸다.
 */
export async function findOrderForViewer(orderNo: string): Promise<OrderView | null> {
  if (!isDatabaseConfigured()) return null;
  const normalizedNo = orderNo.trim().toUpperCase();
  if (!isValidOrderNo(normalizedNo)) return null;

  const remembered = (await readAccessCookie()).find((entry) => entry.no === normalizedNo);
  if (!remembered) return null;

  try {
    const rows = await query<OrderRow>(SQL_ORDER_BY_NO, [normalizedNo]);
    if (rows.length === 0) return null;
    if (!sameHash(hashPhone(rows[0].orderer_phone), remembered.ph)) return null;
    return await loadOrderView(rows[0]);
  } catch (error) {
    console.error(
      "[order] 주문 조회 실패:",
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

async function readAccessCookie(): Promise<AccessEntry[]> {
  const store = await cookies();
  return parseAccessCookie(store.get(ORDER_ACCESS_COOKIE)?.value);
}

/** 쿠키 값 파싱. 사용자가 고칠 수 있는 값이라 모양이 틀리면 통째로 버린다. */
export function parseAccessCookie(value: string | undefined): AccessEntry[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is AccessEntry =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as AccessEntry).no === "string" &&
          typeof (entry as AccessEntry).ph === "string" &&
          /^[0-9a-f]{64}$/.test((entry as AccessEntry).ph)
      )
      .slice(0, MAX_REMEMBERED);
  } catch {
    return [];
  }
}

/**
 * 응답에 "이 주문은 본인이 조회했다" 는 쿠키를 싣는다.
 * 라우트 핸들러에서만 호출된다 (서버 컴포넌트 렌더 중에는 쿠키를 세울 수 없다).
 */
export function grantOrderAccess(
  response: Response,
  orderNo: string,
  phone: string,
  existing: AccessEntry[] = []
): void {
  const entry: AccessEntry = { no: orderNo.toUpperCase(), ph: hashPhone(phone) };
  const next = [entry, ...existing.filter((item) => item.no !== entry.no)].slice(
    0,
    MAX_REMEMBERED
  );

  const parts = [
    `${ORDER_ACCESS_COOKIE}=${encodeURIComponent(JSON.stringify(next))}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${ACCESS_MAX_AGE}`,
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  response.headers.append("Set-Cookie", parts.join("; "));
}

/** 라우트 핸들러가 기존 쿠키를 읽어 `grantOrderAccess` 에 넘길 때 쓴다. */
export async function currentAccessEntries(): Promise<AccessEntry[]> {
  return readAccessCookie();
}

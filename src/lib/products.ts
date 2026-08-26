/**
 * 상품 조회 계층 — 화면이 상품을 보는 유일한 창구.
 *
 * **서버 전용이다.** `@/lib/db` 를 거쳐 `pg` 를 끌어오므로 "use client" 컴포넌트에서
 * import 하면 빌드가 깨진다(브라우저 번들에 `pg` 가 들어가려다 module-not-found).
 * 화면 컴포넌트는 서버 컴포넌트(페이지)에서 `await` 한 결과를 **props 로** 받는다.
 *
 * A0 는 읽기까지만이다. 주문·재고 차감·결제는 B 단계이고 여기서 건드리지 않는다.
 *
 * ── 원장 폴백 (이 계층의 핵심 안전장치) ────────────────────────────
 * DB 를 못 읽거나(미설정·접속 실패) 상품이 0건이면 `src/data/products.ts` 원장을 그대로
 * 돌려준다. 이유는 두 가지다:
 *
 *   1. **빌드에 DB 가 필요 없어진다.** CI 러너에는 `DATABASE_URL` 이 없다.
 *      폴백이 없으면 `npm run build` 가 DB 접속 실패로 죽는다.
 *   2. **마이그레이션 순서 사고가 사이트를 비우지 못한다.** 이 코드가 먼저 배포되고
 *      008·009 가 아직 운영 DB 에 적용되지 않았더라도, 화면은 지금과 똑같이 37건을
 *      계속 보여준다. 빈 쇼핑몰이 뜨는 경우가 구조적으로 없다.
 *
 * 폴백은 **임시 다리**다. 운영 DB 에 009 가 적용된 것을 확인하면 원장과 이 폴백을 같이
 * 걷어낸다 (`docs/BACKLOG.md` 의 A2 항목).
 *
 * ── 품절 덮어쓰기 ──────────────────────────────────────────────────
 * 원본 매물 생존 체크(`scripts/check-source-availability.mjs`, 3시간마다)는 GitHub
 * Actions 에서 돌고, 운영 DB 는 `listen_addresses=localhost` 라 **Actions 에서 닿지 않는다.**
 * 그래서 그 자동화는 지금도 원장의 `status` 를 `"sold"` 로 바꿔 커밋하는 방식이다.
 * 원장이 sold 라고 표시한 상품은 DB 가 뭐라 하든 sold 로 내린다 — 품절은 항상
 * "더 숨기는" 방향이라 이 덮어쓰기가 물건을 잘못 팔리게 만들 수는 없다.
 * (반대 방향은 하지 않는다. 원장이 available 이라고 DB 의 품절을 되살리지 않는다.)
 */
import { query } from "@/lib/db";
import {
  SQL_LIST_PRODUCTS,
  SQL_PRODUCT_BY_SLUG,
  SQL_PRODUCTS_BY_CATEGORY,
  mapRow,
  type ProductRow,
} from "@/lib/product-queries";
import {
  products as ledgerProducts,
  productChannel,
  type Product,
} from "@/data/products";

export { SQL_PRODUCT_BY_SLUG, SQL_PRODUCTS_BY_CATEGORY };

/** 같은 사유를 매 요청마다 찍지 않는다 — 동적 렌더링이라 요청 수만큼 쌓인다. */
const warned = new Set<string>();
function warnOnce(key: string, message: string) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[products] ${message}`);
}

/** 원장이 sold 로 내린 slug. 위 "품절 덮어쓰기" 참고. */
const ledgerSoldSlugs = new Set(
  ledgerProducts.filter((p) => p.status === "sold").map((p) => p.slug)
);

function applyLedgerSold(list: Product[]): Product[] {
  return list.map((p) =>
    p.status !== "sold" && ledgerSoldSlugs.has(p.slug) ? { ...p, status: "sold" as const } : p
  );
}

/**
 * 전체 카탈로그(판매중 + 판매완료). 아카이브 번호 순.
 *
 * 상세페이지도 이 목록에서 찾는다. slug 한 건만 쿼리하지 않는 이유는 **출처를 하나로
 * 묶기 위해서다** — 목록은 원장 폴백인데 상세는 DB 라면, 009 적용 전에 목록에는 있는
 * 상품이 상세에서 404 가 난다. 지금 카탈로그는 37건이라 전량 조회 비용이 무의미하다.
 * 카탈로그가 커지면 `SQL_PRODUCT_BY_SLUG` 로 갈아탄다.
 */
export async function listProducts(): Promise<Product[]> {
  if (!process.env.DATABASE_URL) {
    warnOnce("no-url", "DATABASE_URL 이 없어 원장(src/data/products.ts)으로 렌더한다");
    return ledgerProducts;
  }
  try {
    const rows = await query<ProductRow>(SQL_LIST_PRODUCTS);
    if (rows.length === 0) {
      warnOnce("empty", "DB 에 노출 가능한 상품이 0건이라 원장으로 렌더한다 (009 미적용?)");
      return ledgerProducts;
    }
    return applyLedgerSold(rows.map(mapRow));
  } catch (error) {
    // DATABASE_URL 값이 섞여 나가지 않도록 메시지만 찍는다 (AGENTS.md 불변규칙 6).
    console.error(
      "[products] DB 조회 실패 — 원장으로 렌더한다:",
      error instanceof Error ? error.message : String(error)
    );
    return ledgerProducts;
  }
}

/**
 * 목록 노출용 — `sold` 는 `/shop` `/m/shop` 목록과 홈 코디 슬라이드에서 뺀다.
 * 상세페이지는 `getProductBySlug` 로 따로 살려둔다.
 */
export async function listListedProducts(): Promise<Product[]> {
  return (await listProducts()).filter((p) => p.status !== "sold");
}

/** slug 로 1건. 없으면 null. 판매완료 상품도 돌려준다(상세는 살아 있어야 한다). */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  return (await listProducts()).find((p) => p.slug === slug) ?? null;
}

/**
 * 판매중(available·preorder) 을 앞, 판매완료(sold) 를 뒤로 보내는 안정 정렬.
 * 각 그룹 안에서는 원래 순서(아카이브 번호 순) 를 그대로 유지한다.
 */
function sortSoldLast(products: Product[]): Product[] {
  return [
    ...products.filter((p) => p.status !== "sold"),
    ...products.filter((p) => p.status === "sold"),
  ];
}

/**
 * `/archive` `/m/archive` 목록 — 주인장 개인 소장 중고·1점 한정.
 * 채널이 지정되지 않은 상품은 archive 로 본다(`Product.channel` 주석).
 * 판매완료 상품도 목록에서 감추지 않고 뒤로 보내 SOLD OUT 으로 보여준다
 * (카드 표시는 `ProductCard`/`MobileProductCard`). 목록에서 완전히 빼는 건
 * `listListedProducts` 를 쓰는 홈 코디 슬라이드뿐이다.
 */
export async function listArchiveProducts(): Promise<Product[]> {
  const all = await listProducts();
  return sortSoldLast(all.filter((p) => productChannel(p) === "archive"));
}

/**
 * `/shop` `/m/shop` 목록 — 도매 소싱한 재입고 가능한 신상품.
 * 지금은 그런 상품이 아직 없어 0건이고, 그때는 두 페이지가 "준비 중" 안내를 보여준다.
 * `channel: "shop"` 상품이 등록되면 코드 수정 없이 목록이 나온다.
 * 판매완료 상품도 (등록되면) `listArchiveProducts` 와 같은 규칙으로 뒤로 보내 노출한다.
 */
export async function listShopProducts(): Promise<Product[]> {
  const all = await listProducts();
  return sortSoldLast(all.filter((p) => productChannel(p) === "shop"));
}

/**
 * 홈 코디 교차 슬라이드용 두 줄. 윗줄=상의, 아랫줄=하의.
 *
 * **채널로 거르지 않는다** — 홈은 "지금 보여줄 수 있는 옷" 을 흘리는 자리라
 * 아카이브든 신상품이든 상의/하의면 태운다. 지금은 전량이 아카이브라 종전과 같고,
 * 신상품이 들어오면 자동으로 함께 흐른다. 한쪽만 흘리고 싶으면 여기서 한 줄 거르면 된다.
 */
export async function listOutfitRows(): Promise<{ tops: Product[]; bottoms: Product[] }> {
  const listed = await listListedProducts();
  return {
    tops: listed.filter((p) => p.kind === "top"),
    bottoms: listed.filter((p) => p.kind === "bottom"),
  };
}

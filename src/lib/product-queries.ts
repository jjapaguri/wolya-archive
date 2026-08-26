/**
 * 상품 조회 SQL 과 행→Product 매퍼.
 *
 * **이 파일은 `pg` 를 import 하지 않는다.** 일부러 그렇게 뒀다 —
 * DB 드라이버 없이도 SQL 과 매핑 규칙을 단독 검증할 수 있어야 하기 때문이다.
 * (`scripts/verify_product_queries.mjs` 가 psql 로 같은 SQL 을 돌려 결과를 대조한다.)
 *
 * 커넥션을 쓰는 쪽은 `src/lib/products.ts`.
 */
import type { Product, ProductCategory, ProductKind } from "@/data/products";

/** SELECT 가 돌려주는 원시 행. 숫자 컬럼은 드라이버가 문자열로 줄 수 있어 넓게 받는다. */
export type ProductRow = {
  id: number | string;
  slug: string;
  tag_label: string | null;
  name: string;
  brand: string | null;
  size: string | null;
  price: number | string;
  source_price: number | string | null;
  condition_note: string | null;
  hook: string | null;
  fabric: string | null;
  fit: string | null;
  measurements: string | null;
  stock_note: string | null;
  recommended_for: string | null;
  category: string | null;
  hashtags: string | null;
  images: string[] | null;
  /** 008 컬럼 */
  short_measure: string | null;
  seller_note: string | null;
  is_preorder: boolean | null;
  /** 옵션 재고 합계. 재고의 실체는 product_variants.stock_quantity 다 */
  stock_quantity: number | string | null;
  /** products.status 원본 — 'published' | 'sold_out' */
  db_status: string | null;
};

/**
 * 공통 SELECT.
 *
 * - `deleted_at IS NULL` 은 항상 건다. 상품 삭제는 소프트 삭제다.
 * - 노출 상태는 `published` 와 `sold_out` 을 **둘 다** 가져온다.
 *   판매완료 상품의 상세페이지는 살아 있어야 하기 때문이다(404 가 아니라 "판매완료" 표시).
 *   목록에서 빼는 것은 `listedProducts()` 가 한다 — 정적 배열 시절과 같은 규칙이다.
 * - 이미지는 sort_order 순으로 배열 집계한다. images[0] 이 대표 이미지(is_primary).
 * - 옵션(size)은 단벌 전제라 대표 1개만 뽑고, 재고는 **합계**를 따로 낸다.
 *   다옵션 상품이 생기면 B단계에서 바꾼다.
 * - 정렬은 아카이브 번호 오름차순 = 현재 화면에 보이는 순서.
 *   (인수인계 문서는 `published_at DESC` 를 적었지만, 시드가 published_at 을 한 값으로
 *    넣어 그대로 쓰면 순서가 불안정해진다. 화면 순서를 보존하는 tag_label 정렬을 택했다.)
 */
const BASE_SELECT = `
  SELECT
    p.id,
    p.slug,
    p.tag_label,
    p.name,
    b.name                AS brand,
    v.size,
    p.base_price          AS price,
    p.source_price,
    p.condition_note,
    p.hook,
    p.fabric,
    p.fit,
    p.measurements,
    p.stock_note,
    p.recommended_for,
    c.slug                AS category,
    p.hashtags,
    p.short_measure,
    p.seller_note,
    p.is_preorder,
    COALESCE(v.stock_quantity, 0) AS stock_quantity,
    p.status              AS db_status,
    COALESCE(img.urls, ARRAY[]::text[]) AS images
  FROM products p
  LEFT JOIN brands     b ON b.id = p.brand_id
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN LATERAL (
    SELECT (array_agg(pv.size ORDER BY pv.id))[1] AS size,
           sum(pv.stock_quantity)                 AS stock_quantity
    FROM product_variants pv
    WHERE pv.product_id = p.id
  ) v ON TRUE
  LEFT JOIN LATERAL (
    SELECT array_agg(pi.url ORDER BY pi.is_primary DESC, pi.sort_order, pi.id) AS urls
    FROM product_images pi
    WHERE pi.product_id = p.id
  ) img ON TRUE
  WHERE p.deleted_at IS NULL
    AND p.status IN ('published', 'sold_out')
`;

const ORDER_BY = ` ORDER BY p.tag_label ASC NULLS LAST, p.id ASC`;

export const SQL_LIST_PRODUCTS = BASE_SELECT + ORDER_BY;

export const SQL_PRODUCT_BY_SLUG = BASE_SELECT + ` AND p.slug = $1` + ORDER_BY + ` LIMIT 1`;

export const SQL_PRODUCTS_BY_CATEGORY = BASE_SELECT + ` AND c.slug = $1` + ORDER_BY;

const CATEGORY_VALUES: ProductCategory[] = ["top", "bottom", "accessory", "shoes"];

function toCategory(value: string | null): ProductCategory {
  return CATEGORY_VALUES.includes(value as ProductCategory)
    ? (value as ProductCategory)
    : "top";
}

/**
 * 홈 코디 교차 슬라이드의 줄 배정.
 *
 * `kind` 는 원래 `category` 와 다른 축이지만 아직 전용 컬럼이 없다.
 * 상·하의만 줄에 태우고 나머지(가방·신발)는 `null` 로 빼는 규칙은 카테고리로
 * 그대로 표현되므로, 컬럼이 생기기 전까지는 카테고리에서 끌어온다.
 * (원장 37건 전량에서 이 유도가 `kind` 와 100% 일치하는 것을 확인했다.)
 */
function toKind(category: ProductCategory): ProductKind | null {
  return category === "top" || category === "bottom" ? category : null;
}

/**
 * 노출 상태 — `Product["status"]` 세 갈래를 DB 에서 유도한다.
 *
 * 우선순위가 중요하다:
 *  1. `is_preorder` 가 이기는 이유 — 예약주문은 사입 전이라 재고가 0이다.
 *     재고부터 보면 예약주문이 전부 "판매완료" 로 뒤집힌다.
 *  2. `sold_out` 또는 재고 0 → 판매완료. 재고가 실체라는 AGENTS.md 불변규칙 3에 따라
 *     조건부 UPDATE 로 재고가 0이 되면 **코드 수정 없이** 그 순간 품절로 보이게 된다.
 *  3. 나머지가 보유 재고(available).
 */
function toStatus(row: ProductRow): Product["status"] {
  if (row.is_preorder) return "preorder";
  if (row.db_status === "sold_out" || Number(row.stock_quantity ?? 0) <= 0) return "sold";
  return "available";
}

/**
 * 행 → Product.
 *
 * 기존 `src/data/products.ts` 의 Product 와 **똑같은 모양**을 돌려주는 것이 이 함수의 전부다.
 * NULL 은 빈 문자열로 낮춘다 — 화면이 옵셔널 처리를 하지 않기 때문이다.
 */
export function mapRow(row: ProductRow): Product {
  const images = row.images ?? [];
  const category = toCategory(row.category);
  const product: Product = {
    id: Number(row.id),
    slug: row.slug,
    tag: row.tag_label ?? "",
    image: images[0] ?? "",
    images,
    name: row.name,
    brand: row.brand ?? "",
    size: row.size ?? "",
    price: Number(row.price),
    condition: row.condition_note ?? "",
    hook: row.hook ?? "",
    fabric: row.fabric ?? "",
    fit: row.fit ?? "",
    measurements: row.measurements ?? "",
    stock: row.stock_note ?? "",
    recommendedFor: row.recommended_for ?? "",
    category,
    kind: toKind(category),
    shortMeasure: row.short_measure ?? row.measurements ?? "",
    tags: row.hashtags ?? "",
    status: toStatus(row),
  };
  // `note` 는 옵셔널이다. 없는 것과 빈 문자열이 화면에서 다르게 그려지므로
  // (빈 문자열이면 "판매자 고지" 제목만 남은 빈 칸이 생긴다) 있을 때만 넣는다.
  if (row.seller_note) product.note = row.seller_note;
  return product;
}

/**
 * 상품 조회 SQL 과 행→Product 매퍼.
 *
 * **이 파일은 `pg` 를 import 하지 않는다.** 일부러 그렇게 뒀다 —
 * DB 드라이버 없이도 SQL 과 매핑 규칙을 단독 검증할 수 있어야 하기 때문이다.
 * (`scripts/verify_product_queries.mjs` 가 psql 로 같은 SQL 을 돌려 결과를 대조한다.)
 *
 * 커넥션을 쓰는 쪽은 `src/lib/products.ts`.
 */
import type { Product, ProductCategory } from "@/data/products";

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
  availability: string | null;
  source_url: string | null;
  note: string | null;
  kind: string | null;
  short_measure: string | null;
};

/**
 * 공통 SELECT.
 *
 * - `deleted_at IS NULL AND status='published'` 를 항상 건다.
 * - 이미지는 sort_order 순으로 배열 집계한다. images[0] 이 대표 이미지(is_primary).
 * - 옵션(size)은 단벌 전제라 대표 1개만 뽑는다. 다옵션 상품이 생기면 B단계에서 바꾼다.
 * - 정렬은 아카이브 번호 오름차순 = 현재 화면에 보이는 순서.
 *   (인수인계 문서는 `published_at DESC` 를 적었지만, 시드 3건이 published_at 이 동일해
 *    그대로 쓰면 순서가 불안정해진다. A0 의 완료 기준은 "겉보기 변화 없음" 이므로
 *    화면 순서를 보존하는 tag_label 정렬을 택했다. — 근거는 인수인계 문서 1-7 4항)
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
    p.availability,
    p.source_url,
    p.note,
    p.kind,
    p.short_measure,
    COALESCE(img.urls, ARRAY[]::text[]) AS images
  FROM products p
  LEFT JOIN brands     b ON b.id = p.brand_id
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN LATERAL (
    SELECT pv.size
    FROM product_variants pv
    WHERE pv.product_id = p.id
    ORDER BY pv.id
    LIMIT 1
  ) v ON TRUE
  LEFT JOIN LATERAL (
    SELECT array_agg(pi.url ORDER BY pi.is_primary DESC, pi.sort_order, pi.id) AS urls
    FROM product_images pi
    WHERE pi.product_id = p.id
  ) img ON TRUE
  WHERE p.deleted_at IS NULL
    AND p.status = 'published'
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
 * 행 → Product.
 *
 * 기존 `src/data/products.ts` 의 Product 와 **똑같은 모양**을 돌려주는 것이 이 함수의 전부다.
 * 그래야 A1 에서 화면이 import 한 줄만 바꾸면 된다.
 * NULL 은 빈 문자열로 낮춘다 — 화면이 옵셔널 처리를 하지 않기 때문이다.
 * 단 note 는 타입상 옵셔널이므로 빈 값이면 키를 넣지 않는다.
 *
 * ⚠️ sourcePrice / sourceUrl 은 여기서 절대 내보내지 않는다 (#16).
 *    Product 는 "use client" 컴포넌트에 props 로 넘어가 RSC 페이로드로 직렬화되므로,
 *    매입가·원매물 링크가 HTML 소스 보기로 그대로 새어 나간다. 서버 전용으로 필요하면
 *    `src/data/product-sourcing.ts` 처럼 별도 경로로 가져갈 것. SELECT 에 남겨 둔 것은
 *    생존 체크 등 서버 작업이 같은 쿼리를 재사용할 수 있게 하기 위함이다.
 *
 * ⚠️ Product.status(available/preorder = 매입 상태)는 DB 의 products.availability 에서 온다.
 *    DB 의 products.status 는 노출 상태(draft/published/...)로 이름만 같고 뜻이 다르다. 섞지 말 것.
 */
export function mapRow(row: ProductRow): Product {
  const images = row.images ?? [];
  const category = toCategory(row.category);
  return {
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
    tags: row.hashtags ?? "",
    status: row.availability === "preorder" ? "preorder" : "available",
    // kind 는 "입는 위치". 가방·신발은 null 이고 코디 슬라이드에서 빠진다.
    kind: row.kind === "top" || row.kind === "bottom" ? row.kind : null,
    shortMeasure: row.short_measure ?? "",
    // note 는 옵셔널이다. 값이 없으면 키 자체를 넣지 않는다 —
    // 빈 문자열을 넣으면 화면이 "고지 있음" 으로 오해한다.
    ...(row.note ? { note: row.note } : {}),
  };
}

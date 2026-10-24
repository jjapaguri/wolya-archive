/**
 * 상품 1건을 등록하는 시드 SQL 조각 생성기. `/admin/products/new` 화면이 쓴다.
 *
 * `scripts/gen_seed_sql.mjs` 가 원장(`src/data/products.ts`) 37건 전체를 한 번에
 * SQL 로 뽑는 스크립트와 **판정 규칙은 같다**(조건 등급 정규식, 브랜드 slug 규칙,
 * INSERT 컬럼 목록). 다만 코드는 일부러 공유하지 않고 이 파일에 따로 옮겨 적었다 —
 * 이미 운영 DB 시드(009)를 만들어낸 검증된 스크립트를 이번 작업 때문에 건드리는
 * 위험을 지고 싶지 않았다. 두 규칙이 나중에 갈라지면 이 파일과 스크립트의
 * `gradeOf`/`brandSlug`/`DEFECT_RE` 를 나란히 맞춘다.
 *
 * **DB 접속을 하지 않는다.** 문자열만 만들어 돌려준다 — 실제 적용은 사람이 psql 로 한다
 * (`docs/BACKLOG.md` "관리자 상품 등록 화면" 항목, 006 마이그레이션 주석의 "어드민(B단계)").
 * pg 를 import 하지 않으므로 "use client" 컴포넌트에서 가져다 써도 빌드가 깨지지 않는다.
 */
import { CATEGORIES, CATEGORY_LABELS, type ProductCategory } from "@/data/products";

/** SQL 문자열 리터럴. 작은따옴표를 두 번으로 이스케이프한다. `gen_seed_sql.mjs` 와 동일 규칙. */
export function sqlString(v: string | null | undefined): string {
  return v === null || v === undefined || v === "" ? "NULL" : `'${v.replace(/'/g, "''")}'`;
}

/** SQL 숫자 리터럴. */
export function sqlNumber(v: number | null | undefined): string {
  return v === null || v === undefined ? "NULL" : String(v);
}

/**
 * 상태 서술문(`condition`)에서 하자 낱말을 찾아 등급을 매긴다.
 * "하자 없음" 처럼 부정이 뒤따르면 하자로 세지 않는다. `gen_seed_sql.mjs` 와 동일 정규식.
 */
export const DEFECT_RE =
  /(하자|탈락|오염|찢|데미지|손상|변색|스크래치|눌림|헤짐|얼룩|보풀|올풀림)(?![^.·,]{0,6}없)/;

export function gradeOf(condition: string): "used_good" | "used_fair" {
  return DEFECT_RE.test(condition) ? "used_fair" : "used_good";
}

/** 브랜드 표기 → slug. 한글 주석(`"(칼하트)"` 등)은 제거하고 라틴/숫자만 남긴다. */
export function brandSlug(name: string): string {
  return name
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type NewProductInput = {
  slug: string;
  tag: string;
  name: string;
  brand: string;
  category: ProductCategory;
  size: string;
  price: number;
  /** 매입가(원). 비우면 NULL — 내부 검산용, 화면에 노출되지 않는다 */
  sourcePrice: number | null;
  condition: string;
  hook: string;
  fabric: string;
  fit: string;
  measurements: string;
  stock: string;
  recommendedFor: string;
  shortMeasure: string;
  tags: string;
  /** 판매자 고지. 없으면 NULL(상세페이지에 "판매자 고지" 칸 자체가 안 뜬다) */
  note: string;
  /** true 면 사입 확인 전 예약주문 — 재고 0으로 등록한다 */
  isPreorder: boolean;
  /** 대표 이미지가 images[0] */
  images: string[];
};

/** 등록 전 최소 검증. 실패 사유를 그대로 화면에 보여줄 수 있게 문자열 배열로 돌려준다. */
export function validateNewProduct(input: NewProductInput): string[] {
  const errors: string[] = [];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input.slug)) {
    errors.push("slug 는 소문자·숫자·하이픈만 (예: brand-item-name-l)");
  }
  if (!input.tag.trim()) errors.push("아카이브 번호(tag)를 입력하세요 (예: ARCHIVE 038)");
  if (!/\d/.test(input.tag)) errors.push("아카이브 번호에 숫자가 없으면 SKU 를 만들 수 없습니다");
  if (!input.name.trim()) errors.push("상품명을 입력하세요");
  if (!brandSlug(input.brand)) errors.push("브랜드에서 slug 를 만들 수 없습니다(라틴 문자·숫자 필요)");
  if (!input.size.trim()) errors.push("사이즈를 입력하세요");
  if (!Number.isInteger(input.price) || input.price < 0) errors.push("가격은 0 이상의 정수(원)여야 합니다");
  if (input.sourcePrice !== null && (!Number.isInteger(input.sourcePrice) || input.sourcePrice < 0)) {
    errors.push("매입가는 비우거나 0 이상의 정수여야 합니다");
  }
  if (!input.condition.trim()) errors.push("상태 서술문(condition)을 입력하세요");
  if (input.images.length === 0 || input.images.some((u) => !u.trim())) {
    errors.push("이미지 URL을 최소 1개 입력하세요(빈 줄 없이)");
  }
  return errors;
}

/**
 * 신상품 1건 등록 SQL. `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f <파일>` 로 사람이 적용한다.
 * 전부 `ON CONFLICT DO NOTHING` / `NOT EXISTS` 가드 — 여러 번 돌려도 안전(멱등).
 */
export function buildProductSeedSql(input: NewProductInput): string {
  const bslug = brandSlug(input.brand);
  const sku = "WLY-" + input.tag.replace(/\D+/g, "");
  const stockQuantity = input.isPreorder ? 0 : 1;
  const out: string[] = [];
  const p = (s = "") => out.push(s);

  p(`-- ${input.tag} · ${input.name}`);
  p(`-- /admin/products/new 에서 생성. 적용 전에 사람이 직접 검토할 것.`);
  p(`BEGIN;`);
  p();
  p(`INSERT INTO categories (slug, name, sort_order) VALUES`);
  p(
    `  (${sqlString(input.category)}, ${sqlString(CATEGORY_LABELS[input.category])}, ${CATEGORIES.indexOf(input.category)})\nON CONFLICT (slug) DO NOTHING;`
  );
  p();
  p(`INSERT INTO brands (slug, name) VALUES`);
  p(`  (${sqlString(bslug)}, ${sqlString(input.brand)})\nON CONFLICT (slug) DO NOTHING;`);
  p();
  p(`INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  ${sqlString(input.slug)},
  (SELECT id FROM brands     WHERE slug = ${sqlString(bslug)}),
  (SELECT id FROM categories WHERE slug = ${sqlString(input.category)}),
  ${sqlString(input.name)},
  ${sqlNumber(input.price)},
  ${sqlNumber(input.sourcePrice)},
  ${sqlString(gradeOf(input.condition))},
  ${sqlString(input.condition)},
  'published',
  now(),
  ${sqlString(input.tag)},
  ${sqlString(input.hook)},
  ${sqlString(input.fabric)},
  ${sqlString(input.fit)},
  ${sqlString(input.measurements)},
  ${sqlString(input.stock)},
  ${sqlString(input.recommendedFor)},
  ${sqlString(input.tags)},
  ${sqlString(input.shortMeasure)},
  ${sqlString(input.note)},
  ${input.isPreorder ? "TRUE" : "FALSE"}
)
ON CONFLICT (slug) DO NOTHING;`);
  p();
  p(`INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, ${sqlString(sku)}, ${sqlString(input.size)}, '-', ${stockQuantity} FROM products WHERE slug = ${sqlString(input.slug)}
ON CONFLICT (sku) DO NOTHING;`);
  p();
  input.images.forEach((url, i) => {
    p(`INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, ${sqlString(url)}, ${sqlString(input.name)}, ${i === 0 ? "TRUE" : "FALSE"}, ${i}
FROM products p
WHERE p.slug = ${sqlString(input.slug)}
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = ${sqlString(url)}
  );`);
  });
  p();
  p(`COMMIT;`);

  return out.join("\n");
}

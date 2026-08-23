/**
 * db/migrations/007_seed_initial_products.up.sql 를 src/data/products.ts 에서 생성한다.
 *
 * 손으로 옮겨 적으면 한글 서술문 한 글자만 틀려도 A1 에서 화면이 달라진다.
 * 그래서 원본 데이터에서 기계로 뽑는다.
 *
 * 실행: node --experimental-strip-types scripts/gen_seed_sql.mjs > db/migrations/007_seed_initial_products.up.sql
 */
import { products, CATEGORY_LABELS, CATEGORIES } from "../src/data/products.ts";

/** SQL 문자열 리터럴. 작은따옴표를 두 번으로 이스케이프한다. */
const q = (v) => (v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const n = (v) => (v === null || v === undefined ? "NULL" : String(v));

/**
 * 상태 등급 매핑 — products.condition 은 CHECK 로 4개 값만 받는다.
 * (new / like_new / used_good / used_fair)
 * 자유 서술문은 condition_note 에 원문 그대로 들어간다.
 * 하자가 명시된 건은 used_fair, 나머지 중고는 used_good.
 */
const CONDITION_GRADE = {
  "yiyae-washed-denim-trucker": "used_good",
  "twiyo-shell-button-fur-bag": "used_fair", // 자개 단추 1개 탈락
  "hysteric-glamour-field-jacket-black": "used_good",
};

/** 브랜드 표기 → slug. 화면 표기(brand)는 brands.name 에 원문 그대로 보존한다. */
const BRAND_SLUG = {
  "yiyae (이예)": "yiyae",
  "The World Is Your Oyster": "the-world-is-your-oyster",
  "Hysteric Glamour": "hysteric-glamour",
};

/** 매입 시점. status='published' 이면 published_at 이 필수다(CHECK). */
const PUBLISHED_AT = "2026-08-20T00:00:00+09:00";

const out = [];
const p = (s = "") => out.push(s);

p(`-- 007_seed_initial_products.up.sql`);
p(`-- WOLYA ARCHIVE 스키마 7단계 — 최초 상품 3건 시드`);
p(`--`);
p(`-- ⚠️ 이 파일은 생성물이다. 직접 고치지 말 것.`);
p(`--    원본: src/data/products.ts`);
p(`--    재생성: node --experimental-strip-types scripts/gen_seed_sql.mjs > db/migrations/007_seed_initial_products.up.sql`);
p(`--`);
p(`-- 적용:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/007_seed_initial_products.up.sql`);
p(`-- 되돌리기: db/migrations/007_seed_initial_products.down.sql`);
p(`--`);
p(`-- 전제: 006_product_presentation.up.sql 이 먼저 적용돼 있어야 한다.`);
p(`-- 멱등: 전부 ON CONFLICT DO NOTHING / NOT EXISTS 가드 → 몇 번 돌려도 같은 결과.`);
p(`-- 파괴적 구문(DROP/DELETE/TRUNCATE/SET NOT NULL) 없음.`);
p();
p(`BEGIN;`);
p();

// ── 카테고리 ──────────────────────────────────────────────
p(`-- ── 카테고리 4분류 (top / bottom / accessory / shoes) ──────────`);
p(`INSERT INTO categories (slug, name, sort_order) VALUES`);
p(
  CATEGORIES.map((c, i) => `  (${q(c)}, ${q(CATEGORY_LABELS[c])}, ${i})`).join(",\n") +
    "\nON CONFLICT (slug) DO NOTHING;"
);
p();

// ── 브랜드 ────────────────────────────────────────────────
const brands = [...new Set(products.map((x) => x.brand))];
p(`-- ── 브랜드 ────────────────────────────────────────────────────`);
p(`-- name 은 화면 표기 원문을 그대로 보존한다("yiyae (이예)" 등).`);
p(`INSERT INTO brands (slug, name) VALUES`);
p(
  brands.map((b) => `  (${q(BRAND_SLUG[b])}, ${q(b)})`).join(",\n") +
    "\nON CONFLICT (slug) DO NOTHING;"
);
p();

// ── 상품 ──────────────────────────────────────────────────
p(`-- ── 상품 ──────────────────────────────────────────────────────`);
for (const x of products) {
  const grade = CONDITION_GRADE[x.slug];
  if (!grade) throw new Error(`CONDITION_GRADE 누락: ${x.slug}`);
  const bslug = BRAND_SLUG[x.brand];
  if (!bslug) throw new Error(`BRAND_SLUG 누락: ${x.brand}`);
  p(`-- ${x.tag} · ${x.name}`);
  p(`INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags
) VALUES (
  ${q(x.slug)},
  (SELECT id FROM brands     WHERE slug = ${q(bslug)}),
  (SELECT id FROM categories WHERE slug = ${q(x.category)}),
  ${q(x.name)},
  ${n(x.price)},
  ${n(x.sourcePrice)},
  ${q(grade)},
  ${q(x.condition)},
  'published',
  ${q(PUBLISHED_AT)}::timestamptz,
  ${q(x.tag)},
  ${q(x.hook)},
  ${q(x.fabric)},
  ${q(x.fit)},
  ${q(x.measurements)},
  ${q(x.stock)},
  ${q(x.recommendedFor)},
  ${q(x.tags)}
)
ON CONFLICT (slug) DO NOTHING;`);
  p();
}

// ── 옵션(재고) ────────────────────────────────────────────
p(`-- ── 옵션·재고 ─────────────────────────────────────────────────`);
p(`-- 전부 단벌이므로 stock_quantity = 1. color 는 단일 상품이라 '-' 로 둔다.`);
p(`-- sku 는 아카이브 번호에서 만든다(ARCHIVE 001 → WLY-001).`);
for (const x of products) {
  const sku = "WLY-" + x.tag.replace(/\D+/g, "");
  p(`INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, ${q(sku)}, ${q(x.size)}, '-', 1 FROM products WHERE slug = ${q(x.slug)}
ON CONFLICT (sku) DO NOTHING;`);
}
p();

// ── 이미지 ────────────────────────────────────────────────
p(`-- ── 이미지 ────────────────────────────────────────────────────`);
p(`-- images[0] 이 대표 이미지다. 상품당 is_primary=true 는 정확히 1장(부분 유니크 인덱스).`);
p(`-- url 에 UNIQUE 가 없으므로 NOT EXISTS 로 멱등성을 만든다.`);
for (const x of products) {
  x.images.forEach((url, i) => {
    p(`INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, ${q(url)}, ${q(x.name)}, ${i === 0 ? "TRUE" : "FALSE"}, ${i}
FROM products p
WHERE p.slug = ${q(x.slug)}
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = ${q(url)}
  );`);
  });
}
p();
p(`COMMIT;`);

process.stdout.write(out.join("\n") + "\n");

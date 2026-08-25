/**
 * db/migrations/009_seed_all_products.up.sql 를 src/data/products.ts 에서 생성한다.
 *
 * 손으로 옮겨 적으면 한글 서술문 한 글자만 틀려도 A1 에서 화면이 달라진다.
 * 그래서 원본 데이터에서 기계로 뽑는다.
 *
 * 실행: node --experimental-strip-types scripts/gen_seed_sql.mjs > db/migrations/009_seed_all_products.up.sql
 *
 * ── 007 과의 관계 ───────────────────────────────────────────────
 * 007 은 최초 3건만 시드했다(당시 원장이 3건이었다). 지금 원장은 37건이다.
 * 009 는 **37건 전부**를 같은 방식으로 시드한다. 007 이 이미 넣은 3건은
 * `ON CONFLICT (slug) DO NOTHING` 이 그대로 통과시키고, 008 이 새로 만든 컬럼
 * (short_measure / seller_note / is_preorder)만 뒤에서 **NULL 인 행에 한해** 채운다.
 * 그래서 007 을 돌린 DB 든 안 돌린 DB 든 009 하나로 같은 결과에 도달한다.
 */
import { products, CATEGORY_LABELS, CATEGORIES } from "../src/data/products.ts";
import { productSourcing } from "../src/data/product-sourcing.ts";

/** SQL 문자열 리터럴. 작은따옴표를 두 번으로 이스케이프한다. */
const q = (v) => (v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const n = (v) => (v === null || v === undefined ? "NULL" : String(v));

/**
 * 상태 등급 매핑 — products.condition 은 CHECK 로 4개 값만 받는다.
 * (new / like_new / used_good / used_fair)
 *
 * 이 등급은 **화면에 안 나온다.** 고객이 읽는 문장은 condition_note 에 원문 그대로 들어간다.
 * 그래서 서술문에서 기계로 뽑는다 — 37건을 손으로 매기면 그게 더 틀린다.
 * 하자 낱말이 있으면 used_fair, 다만 "하자 없음" 처럼 부정이 뒤따르면 제외한다.
 */
const DEFECT_RE = /(하자|탈락|오염|찢|데미지|손상|변색|스크래치|눌림|헤짐|얼룩|보풀|올풀림)(?![^.·,]{0,6}없)/;
const gradeOf = (x) => (DEFECT_RE.test(x.condition) ? "used_fair" : "used_good");

/**
 * 007 이 손으로 매겼던 3건. 위 자동 판정이 이것과 어긋나면 생성 자체를 멈춘다 —
 * 이미 운영 DB 에 들어간 값과 다른 등급을 만들어내는 것을 막는 안전장치다.
 */
const CONDITION_GRADE_007 = {
  "yiyae-washed-denim-trucker": "used_good",
  "twiyo-shell-button-fur-bag": "used_fair", // 자개 단추 1개 탈락
  "hysteric-glamour-field-jacket-black": "used_good",
};

/**
 * 브랜드 표기 → slug.
 *
 * 원장에는 같은 브랜드가 두 표기로 들어와 있다("Carhartt" 와 "Carhartt (칼하트)" 등).
 * 라틴 문자 부분만으로 slug 를 만들면 두 표기가 한 행으로 합쳐진다 — 그게 맞다.
 * 브랜드가 두 행으로 갈리면 나중에 브랜드별 집계·필터가 조용히 반씩 나온다.
 */
const brandSlug = (name) =>
  name
    .replace(/\s*\([^)]*\)\s*/g, " ") // "(칼하트)" 같은 한글 주석 제거
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * 화면에 쓸 브랜드 표기 1개를 고른다.
 *
 * 원장에 두 표기가 섞여 있으면 **더 많은 상품이 쓰는 쪽**을 canonical 로 삼는다.
 * (Carhartt 5 : Carhartt (칼하트) 1, Levi's 3 : 1, Polo Ralph Lauren 4 : 2, Patagonia 4 : 1)
 * 화면 문구가 바뀌는 상품 수를 최소로 만드는 선택이다 — 이 규칙으로 표기가 바뀌는 것은
 * 37건 중 5건이고, 전부 "이미 다수가 쓰던 표기" 로 맞춰지는 방향이다.
 *
 * 한글 주석이 붙은 표기("Carhartt (칼하트)")를 쓰고 싶으면 아래 비교를 뒤집으면 된다.
 * 그건 표기 정책이라 사람이 정할 일이다.
 */
function canonicalBrandNames() {
  const count = new Map();
  for (const x of products) count.set(x.brand, (count.get(x.brand) ?? 0) + 1);

  const bySlug = new Map();
  for (const x of products) {
    const s = brandSlug(x.brand);
    const prev = bySlug.get(s);
    if (!prev) {
      bySlug.set(s, x.brand);
      continue;
    }
    if (prev === x.brand) continue;
    // 더 많이 쓰이는 표기가 이긴다. 같으면 짧은 쪽(주석 없는 원문).
    const a = count.get(prev) ?? 0;
    const b = count.get(x.brand) ?? 0;
    if (b > a || (b === a && x.brand.length < prev.length)) bySlug.set(s, x.brand);
  }
  return bySlug;
}

/** 매입 시점. status='published' 이면 published_at 이 필수다(CHECK). */
const PUBLISHED_AT = "2026-08-20T00:00:00+09:00";

/**
 * 화면 상태 → DB 표현.
 *  - sold     : products.status='sold_out' + 재고 0. 목록에서 빠지고 상세는 살아있다
 *  - preorder : is_preorder=TRUE + 재고 0 (사입 전이라 물건이 없다)
 *  - available: status='published' + 재고 1 (전부 단벌)
 */
const dbStatusOf = (x) => (x.status === "sold" ? "sold_out" : "published");
const stockOf = (x) => (x.status === "available" ? 1 : 0);

const out = [];
const p = (s = "") => out.push(s);

// ── 자동 판정이 007 과 어긋나지 않는지 먼저 확인 ────────────────
for (const [slug, want] of Object.entries(CONDITION_GRADE_007)) {
  const x = products.find((it) => it.slug === slug);
  if (!x) continue; // 원장에서 빠졌다면 007 행은 그대로 두면 된다
  const got = gradeOf(x);
  if (got !== want) {
    throw new Error(
      `condition 등급이 007 과 어긋난다: ${slug} — 007 은 ${want}, 자동 판정은 ${got}. ` +
        `DEFECT_RE 를 고치거나 이 건을 예외로 둘 것.`
    );
  }
}

p(`-- 009_seed_all_products.up.sql`);
p(`-- WOLYA ARCHIVE 스키마 9단계 — 원장 ${products.length}건 전량 시드`);
p(`--`);
p(`-- ⚠️ 이 파일은 생성물이다. 직접 고치지 말 것.`);
p(`--    원본: src/data/products.ts`);
p(`--    재생성: node --experimental-strip-types scripts/gen_seed_sql.mjs > db/migrations/009_seed_all_products.up.sql`);
p(`--`);
p(`-- 적용:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/009_seed_all_products.up.sql`);
p(`-- 되돌리기: db/migrations/009_seed_all_products.down.sql`);
p(`--`);
p(`-- 전제: 006 · 008 이 먼저 적용돼 있어야 한다. 007 은 돌렸든 안 돌렸든 상관없다`);
p(`--       (007 의 3건은 ON CONFLICT 로 건너뛰고, 새 컬럼만 아래에서 채운다).`);
p(`-- 멱등: 전부 ON CONFLICT DO NOTHING / NOT EXISTS / IS NULL 가드 → 몇 번 돌려도 같은 결과.`);
p(`-- 파괴적 구문(DROP/DELETE/TRUNCATE/SET NOT NULL) 없음.`);
p(`--`);
p(`-- 노출 상태 내역: available ${products.filter((x) => x.status === "available").length}건 ` +
  `/ preorder ${products.filter((x) => x.status === "preorder").length}건 ` +
  `/ sold ${products.filter((x) => x.status === "sold").length}건`);
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
const brandNames = canonicalBrandNames();
p(`-- ── 브랜드 ────────────────────────────────────────────────────`);
p(`-- name 은 화면 표기 원문을 그대로 보존한다("yiyae (이예)" 등).`);
p(`-- 같은 브랜드의 두 표기("Carhartt" / "Carhartt (칼하트)")는 한 행으로 합친다.`);
p(`INSERT INTO brands (slug, name) VALUES`);
p(
  [...brandNames.entries()].map(([s, name]) => `  (${q(s)}, ${q(name)})`).join(",\n") +
    "\nON CONFLICT (slug) DO NOTHING;"
);
p();

// ── 상품 ──────────────────────────────────────────────────
p(`-- ── 상품 ──────────────────────────────────────────────────────`);
for (const x of products) {
  const bslug = brandSlug(x.brand);
  if (!bslug) throw new Error(`브랜드 slug 를 만들 수 없다: ${JSON.stringify(x.brand)} (${x.slug})`);
  p(`-- ${x.tag} · ${x.name} [${x.status}]`);
  p(`INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  ${q(x.slug)},
  (SELECT id FROM brands     WHERE slug = ${q(bslug)}),
  (SELECT id FROM categories WHERE slug = ${q(x.category)}),
  ${q(x.name)},
  ${n(x.price)},
  ${n(productSourcing[x.slug]?.sourcePrice)},
  ${q(gradeOf(x))},
  ${q(x.condition)},
  ${q(dbStatusOf(x))},
  ${q(PUBLISHED_AT)}::timestamptz,
  ${q(x.tag)},
  ${q(x.hook)},
  ${q(x.fabric)},
  ${q(x.fit)},
  ${q(x.measurements)},
  ${q(x.stock)},
  ${q(x.recommendedFor)},
  ${q(x.tags)},
  ${q(x.shortMeasure)},
  ${q(x.note)},
  ${x.status === "preorder" ? "TRUE" : "FALSE"}
)
ON CONFLICT (slug) DO NOTHING;`);
  p();
}

// ── 007 이 먼저 넣은 행의 새 컬럼 채우기 ───────────────────
p(`-- ── 007 이 먼저 넣은 행의 008 컬럼 채우기 ─────────────────────`);
p(`-- ON CONFLICT DO NOTHING 은 기존 행을 건드리지 않으므로, 007 로 들어간 3건은`);
p(`-- short_measure / seller_note / is_preorder 가 비어 있다. **NULL 인 것만** 채운다 —`);
p(`-- 사람이 DB 에서 직접 고친 값을 덮어쓰지 않기 위해서다.`);
for (const x of products) {
  p(`UPDATE products SET
  short_measure = COALESCE(short_measure, ${q(x.shortMeasure)}),
  seller_note   = COALESCE(seller_note,   ${q(x.note)})
WHERE slug = ${q(x.slug)}
  AND (short_measure IS NULL OR seller_note IS NULL);`);
}
p();

// ── 옵션(재고) ────────────────────────────────────────────
p(`-- ── 옵션·재고 ─────────────────────────────────────────────────`);
p(`-- 전부 단벌이므로 보유분은 stock_quantity = 1. color 는 단일 상품이라 '-' 로 둔다.`);
p(`-- sku 는 아카이브 번호에서 만든다(ARCHIVE 001 → WLY-001).`);
p(`-- sold·preorder 는 0 — 판매완료는 물건이 나갔고, 예약주문은 아직 사입 전이다.`);
for (const x of products) {
  const sku = "WLY-" + x.tag.replace(/\D+/g, "");
  p(`INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, ${q(sku)}, ${q(x.size)}, '-', ${stockOf(x)} FROM products WHERE slug = ${q(x.slug)}
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

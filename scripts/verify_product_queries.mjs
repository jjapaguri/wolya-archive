/**
 * A0 검증 — DB 조회 결과가 기존 정적 데이터와 **완전히 같은지** 대조한다.
 *
 * `pg` 드라이버 없이 psql 로 같은 SQL 을 돌려서, src/lib/product-queries.ts 의
 * SQL·매퍼를 그대로 태운다. 즉 검증 대상이 실제 출하될 코드와 동일하다.
 *
 * 실행: node --experimental-strip-types scripts/verify_product_queries.mjs
 * 필요: psql 로 접근 가능한 DB (PGPASSWORD/PGHOST/PGUSER/PGDATABASE)
 */
import { execFileSync } from "node:child_process";
import {
  SQL_LIST_PRODUCTS,
  SQL_PRODUCT_BY_SLUG,
  SQL_PRODUCTS_BY_CATEGORY,
  mapRow,
} from "../src/lib/product-queries.ts";
import { products as STATIC_PRODUCTS } from "../src/data/products.ts";

const PSQL = ["-h", process.env.PGHOST ?? "127.0.0.1", "-U", process.env.PGUSER ?? "wolya_app",
              "-d", process.env.PGDATABASE ?? "wolya", "-tAq", "-v", "ON_ERROR_STOP=1"];

/** SQL 을 돌려 행 배열을 돌려준다. $1 은 psql 에 없으므로 리터럴로 안전 치환한다(검증 전용). */
function run(sql, param) {
  const bound = param === undefined
    ? sql
    : sql.replace(/\$1/g, `'${String(param).replace(/'/g, "''")}'`);
  const wrapped = `SELECT coalesce(json_agg(t), '[]'::json) FROM (${bound}) t;`;
  const out = execFileSync("psql", [...PSQL, "-c", wrapped], { encoding: "utf8" });
  return JSON.parse(out.trim());
}

let failures = 0;
const check = (label, ok, detail = "") => {
  console.log(`${ok ? "  PASS" : "  FAIL"}  ${label}${detail && !ok ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

// ── 1. listProducts() 가 정적 데이터와 필드 단위로 일치하는가 ──────────────
console.log("=== 1. listProducts() vs src/data/products.ts ===");
const fromDb = run(SQL_LIST_PRODUCTS).map(mapRow);

// DB 에 아직 시드되지 않은 상품이 있을 수 있다(온라인 소싱분은 별도 항목).
// 그래서 "DB 에 있는 것"만 정적 데이터와 대조하고, 아직 안 들어온 건수는 따로 보고한다.
const bySlug = new Map(STATIC_PRODUCTS.map((p) => [p.slug, p]));
const notSeeded = STATIC_PRODUCTS.filter((p) => !fromDb.some((d) => d.slug === p.slug));

console.log(`  정적 ${STATIC_PRODUCTS.length}건 / DB ${fromDb.length}건 / 미시드 ${notSeeded.length}건`);
check("DB 상품이 전부 정적 데이터에도 있는지",
      fromDb.every((d) => bySlug.has(d.slug)),
      `정적에 없는 slug: ${fromDb.filter((d) => !bySlug.has(d.slug)).map((d) => d.slug).join(",")}`);

// id 는 DB 시퀀스가 정하므로 제외한다(내부 식별자, 화면 의미 없음).
const COMPARED = Object.keys(STATIC_PRODUCTS[0]).filter((k) => k !== "id");

for (let i = 0; i < fromDb.length; i++) {
  const got = fromDb[i];
  const want = bySlug.get(got.slug);
  if (!want) { check(`[${i}] ${got.slug}`, false, "정적 데이터에 없음"); continue; }
  const diffs = COMPARED.filter(
    (k) => JSON.stringify(want[k]) !== JSON.stringify(got[k])
  );
  check(`[${i}] ${want.slug} — ${COMPARED.length}개 필드`, diffs.length === 0,
        diffs.map((k) => `${k}: 기대 ${JSON.stringify(want[k])} / 실제 ${JSON.stringify(got[k])}`).join(" | "));
}

// ── 2. 정렬이 정적 배열 순서와 같은가 (겉보기 변화 없음 조건) ──────────────
console.log("\n=== 2. 정렬 순서 보존 ===");
const staticOrder = STATIC_PRODUCTS.filter((p) => fromDb.some((d) => d.slug === p.slug)).map((p) => p.slug);
check("DB 순서가 정적 배열 순서와 같은지",
      JSON.stringify(fromDb.map((p) => p.slug)) === JSON.stringify(staticOrder),
      `실제 ${fromDb.map((p) => p.slug).join(",")}`);

// ── 3. getProductBySlug ────────────────────────────────────────────────
console.log("\n=== 3. getProductBySlug() ===");
for (const want of fromDb.map((d) => bySlug.get(d.slug))) {
  const rows = run(SQL_PRODUCT_BY_SLUG, want.slug);
  const got = rows.length ? mapRow(rows[0]) : null;
  const diffs = got ? COMPARED.filter((k) => JSON.stringify(want[k]) !== JSON.stringify(got[k])) : ["(없음)"];
  check(want.slug, !!got && diffs.length === 0, diffs.join(" | "));
}
const missing = run(SQL_PRODUCT_BY_SLUG, "존재하지-않는-slug");
check("없는 slug → 0건", missing.length === 0);
check("SQL 인젝션 형태 입력에도 0건", run(SQL_PRODUCT_BY_SLUG, "x' OR '1'='1").length === 0);

// ── 4. listProductsByCategory ──────────────────────────────────────────
console.log("\n=== 4. listProductsByCategory() ===");
for (const cat of ["top", "bottom", "accessory", "shoes"]) {
  const got = run(SQL_PRODUCTS_BY_CATEGORY, cat).map(mapRow);
  const want = STATIC_PRODUCTS.filter((p) => p.category === cat && fromDb.some((d) => d.slug === p.slug));
  check(`${cat}: ${got.length}건`,
        JSON.stringify(got.map((p) => p.slug)) === JSON.stringify(want.map((p) => p.slug)),
        `기대 ${want.map((p) => p.slug).join(",")} / 실제 ${got.map((p) => p.slug).join(",")}`);
}

// ── 5. 대표 이미지 규칙 ────────────────────────────────────────────────
console.log("\n=== 5. 대표 이미지 ===");
for (const p of fromDb) {
  check(`${p.slug}: image === images[0]`, p.image === p.images[0]);
}

// ── 6. 매입 상태(availability) ─────────────────────────────────────────
console.log("\n=== 6. 매입 상태 ===");
for (const p of fromDb) {
  const want = bySlug.get(p.slug);
  check(`${p.slug}: status=${p.status}`, p.status === want.status,
        `기대 ${want.status} / 실제 ${p.status}`);
}
check("status 값이 available/preorder 뿐인지",
      fromDb.every((p) => p.status === "available" || p.status === "preorder"));
check("값 없는 note 는 키가 없어야 함",
      fromDb.every((p) => !("note" in p) || !!p.note));

// #16 회귀 방지 — 매입가·원매물 링크는 Product 에 실려선 안 된다.
// 실리면 "use client" 컴포넌트로 넘어가 RSC 페이로드에 직렬화되고 HTML 소스로 샌다.
check("sourcePrice / sourceUrl 이 조회 결과에 없어야 함 (#16)",
      fromDb.every((p) => !("sourcePrice" in p) && !("sourceUrl" in p)),
      "조회 계층이 매입가·원매물 링크를 내보내고 있다");

console.log(`\n${failures === 0 ? "전부 통과" : `${failures}건 실패`}`);
process.exit(failures === 0 ? 0 : 1);

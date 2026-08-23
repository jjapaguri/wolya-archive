/**
 * db/migrations/009_backfill_availability_fields.up.sql 을 src/data/products.ts 에서 생성한다.
 *
 * 008 이 만든 새 컬럼(availability / source_url / note / kind / short_measure)에
 * 값을 채운다. 007 은 **이미 서버에 적용된 마이그레이션이라 고치지 않는다** —
 * 적용된 파일을 수정하면 서버와 레포가 어긋난다(ops 규칙).
 *
 * slug 로 UPDATE 하므로 아직 DB 에 없는 상품은 조용히 건너뛴다(0행). 재실행해도 같다.
 *
 * 실행: node --experimental-strip-types scripts/gen_backfill_sql.mjs > db/migrations/009_backfill_availability_fields.up.sql
 */
import { products } from "../src/data/products.ts";
// sourceUrl 은 #16 이후 Product 가 아니라 여기 있다 (클라이언트 누출 방지).
import { productSourcing } from "../src/data/product-sourcing.ts";

const q = (v) => (v === null || v === undefined || v === "" ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);

const out = [];
const p = (s = "") => out.push(s);

p(`-- 009_backfill_availability_fields.up.sql`);
p(`-- WOLYA ARCHIVE — 008 이 추가한 컬럼에 값 채우기`);
p(`--`);
p(`-- ⚠️ 이 파일은 생성물이다. 직접 고치지 말 것.`);
p(`--    원본: src/data/products.ts`);
p(`--    재생성: node --experimental-strip-types scripts/gen_backfill_sql.mjs > db/migrations/009_backfill_availability_fields.up.sql`);
p(`--`);
p(`-- 전제: 008_product_availability.up.sql 이 먼저 적용돼 있어야 한다.`);
p(`-- 멱등: slug 기준 UPDATE 라 몇 번 돌려도 같다. DB 에 없는 상품은 0행 갱신되고 넘어간다.`);
p(`-- 파괴적 구문(DROP/DELETE/TRUNCATE/SET NOT NULL) 없음.`);
p(`--`);
p(`-- 총 ${products.length}건 중 현재 DB 에 시드된 것만 실제로 갱신된다.`);
p();
p(`BEGIN;`);
p();

for (const x of products) {
  p(`-- ${x.tag ?? x.slug} · ${x.name}`);
  p(`UPDATE products SET
  availability  = ${q(x.status)},
  kind          = ${q(x.kind)},
  short_measure = ${q(x.shortMeasure)},
  source_url    = ${q(productSourcing[x.slug]?.sourceUrl)},
  note          = ${q(x.note)}
WHERE slug = ${q(x.slug)};`);
  p();
}

p(`COMMIT;`);
process.stdout.write(out.join("\n") + "\n");

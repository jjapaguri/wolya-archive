/**
 * 원본 매물(fruitsfamily.com) 생존 체크.
 *
 * `product-sourcing.ts` 의 `sourceUrl` 을 하나씩 fetch 해서 원본이 아직 판매중인지 확인한다.
 * 기본은 `--dry-run`(사실상 아무 플래그도 안 주는 것과 같다) — 결과만 보고하고 아무것도 쓰지 않는다.
 * `--write` 를 주면 dead 로 판정된 slug 의 `src/data/products.ts` `status` 를 `"sold"` 로 바꾼다.
 *
 * 판정 신호는 실측으로 확정했다(2026-08-23, `docs/BACKLOG.md`). `GET fruitsfamily.com/product/{id}`
 * 는 서버 렌더 HTML이라 JS 실행 없이 정규식으로 충분하다.
 *
 *   alive   — <meta property="product:availability" content="in stock">
 *   dead    — 같은 meta 가 "out of stock" (품절)
 *   dead    — 본문에 "숨김 처리된 상품입니다" (판매자가 숨김)
 *   dead    — 본문에 "해당 상품이 존재하지 않습니다" (삭제됨, HTTP 200 인 soft-404)
 *   dead    — HTTP 404 (없는 slug)
 *   unknown — 그 외 전부 (네트워크 오류·타임아웃·5xx·meta 없음)
 *
 * `unknown` 은 절대 내리지 않는다 — 신호가 없다는 것과 팔렸다는 것은 다르다.
 * 현재가는 같은 응답의 `<meta property="product:price:amount">` 에서 읽는다.
 *
 * 안전밸브: 한 회차 dead 판정이 확인 대상의 40% 를 넘으면 (--write 라도) 아무것도 쓰지 않고
 * 비정상 종료한다. 그 정도면 매물이 아니라 후루츠 쪽 구조가 바뀌었거나 우리가 차단된 것이다.
 *
 * 실행: node --experimental-strip-types scripts/check-source-availability.mjs [--write] [--json]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { productSourcing } from "../src/data/product-sourcing.ts";

const WRITE = process.argv.includes("--write");
const AS_JSON = process.argv.includes("--json");
const TIMEOUT_MS = 15_000;
const DELAY_BETWEEN_REQUESTS_MS = 500;
const DEAD_RATIO_SAFETY_VALVE = 0.4;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 실제 마크업은 <meta data-rh="true" property="..." content="..."/> 처럼 속성 순서에
// data-rh 가 끼어 있어 태그 시작부터 앵커링하지 않는다.
const AVAILABILITY_RE = /property="product:availability" content="(in stock|out of stock)"/;
const PRICE_RE = /property="product:price:amount" content="(\d+)"/;
const HIDDEN_TEXT = "숨김 처리된 상품입니다";
const DELETED_TEXT = "해당 상품이 존재하지 않습니다";

async function checkOne(slug, sourceUrl, sourcePrice) {
  const result = { slug, sourceUrl, sourcePrice };
  let res;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      res = await fetch(sourceUrl, { signal: controller.signal, redirect: "follow" });
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    result.httpStatus = null;
    result.error = err instanceof Error ? err.message : String(err);
    result.judgement = "unknown";
    result.verdict = "확인 실패 — 네트워크 오류/타임아웃";
    return result;
  }

  result.httpStatus = res.status;

  if (res.status === 404) {
    result.judgement = "dead";
    result.verdict = "HTTP 404 — 없는 slug";
    return result;
  }
  if (!res.ok) {
    result.judgement = "unknown";
    result.verdict = `원본 응답 이상 (HTTP ${res.status})`;
    return result;
  }

  const html = await res.text();

  if (html.includes(HIDDEN_TEXT)) {
    result.judgement = "dead";
    result.verdict = "판매자가 숨김 처리함";
    return result;
  }
  if (html.includes(DELETED_TEXT)) {
    result.judgement = "dead";
    result.verdict = "삭제됨 (soft-404, HTTP 200)";
    return result;
  }

  const priceMatch = html.match(PRICE_RE);
  if (priceMatch) result.priceOnPage = Number(priceMatch[1]);

  const availMatch = html.match(AVAILABILITY_RE);
  if (!availMatch) {
    result.judgement = "unknown";
    result.verdict = "availability meta 를 못 찾음 (fruitsfamily 마크업 변경 가능성)";
    return result;
  }

  if (availMatch[1] === "out of stock") {
    result.judgement = "dead";
    result.verdict = "품절 (meta out of stock)";
    return result;
  }

  result.judgement = "alive";
  const priceChanged = result.priceOnPage != null && result.priceOnPage !== sourcePrice;
  result.verdict = priceChanged
    ? `판매중, 가격 변동 있음: 매입가 ${sourcePrice.toLocaleString()}원 → 현재 ${result.priceOnPage.toLocaleString()}원`
    : "판매중, 가격 동일";
  return result;
}

/** slug 로 해당 상품 블록을 찾아 status 를 "sold" 로 바꾼다. 이미 sold 면 그대로 둔다. */
function markSoldInSource(src, slug) {
  const blockRe = new RegExp(
    `(slug:\\s*"${slug}"[\\s\\S]*?status:\\s*")(available|preorder|sold)(")`,
  );
  const match = src.match(blockRe);
  if (!match) {
    throw new Error(`slug "${slug}" 의 status 필드를 products.ts 에서 못 찾음 — 구조 확인 필요`);
  }
  if (match[2] === "sold") return { src, changed: false };
  return { src: src.replace(blockRe, `$1sold$3`), changed: true };
}

function writeSoldStatuses(deadSlugs) {
  const filePath = fileURLToPath(new URL("../src/data/products.ts", import.meta.url));
  let src = readFileSync(filePath, "utf8");
  const changed = [];

  for (const slug of deadSlugs) {
    const result = markSoldInSource(src, slug);
    src = result.src;
    if (result.changed) changed.push(slug);
  }

  if (changed.length > 0) writeFileSync(filePath, src);
  return changed;
}

async function main() {
  const entries = Object.entries(productSourcing).filter(([, v]) => v.sourceUrl);
  const results = [];

  for (const [slug, { sourceUrl, sourcePrice }] of entries) {
    results.push(await checkOne(slug, sourceUrl, sourcePrice));
    await sleep(DELAY_BETWEEN_REQUESTS_MS);
  }

  const skipped = Object.keys(productSourcing).length - entries.length;
  const dead = results.filter((r) => r.judgement === "dead");
  const unknown = results.filter((r) => r.judgement === "unknown");
  const deadRatio = results.length > 0 ? dead.length / results.length : 0;

  if (deadRatio > DEAD_RATIO_SAFETY_VALVE) {
    console.error(
      `안전밸브 — dead 판정 ${dead.length}/${results.length}건 (${Math.round(deadRatio * 100)}%) 이 40% 를 넘었다.`,
    );
    console.error(
      "매물이 아니라 후루츠 쪽 구조가 바뀌었거나 우리가 차단됐을 가능성 — 아무것도 쓰지 않고 종료한다.",
    );
    process.exitCode = 1;
    return;
  }

  let changedSlugs = [];
  if (WRITE && dead.length > 0) {
    changedSlugs = writeSoldStatuses(dead.map((r) => r.slug));
  }

  if (AS_JSON) {
    console.log(
      JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          skippedNoSourceUrl: skipped,
          wrote: WRITE,
          changedSlugs,
          results,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(
    `원본 매물 생존 체크 — ${entries.length}건 확인 (sourceUrl 없어 건너뜀: ${skipped}건)${WRITE ? " [--write]" : " [dry-run]"}\n`,
  );
  for (const r of results) {
    console.log(`[${r.slug}] (${r.judgement}) ${r.verdict}`);
  }
  console.log(
    `\ndead: ${dead.length}건 / unknown: ${unknown.length}건 / alive: ${results.length - dead.length - unknown.length}건 / 총 ${results.length}건`,
  );
  if (WRITE) {
    if (changedSlugs.length > 0) {
      console.log(`→ status 를 "sold" 로 바꾼 slug (${changedSlugs.length}건): ${changedSlugs.join(", ")}`);
    } else if (dead.length > 0) {
      console.log("→ dead 판정된 slug 는 이미 전부 sold 상태였다. 바꾼 것 없음.");
    }
  } else if (dead.length > 0) {
    console.log('→ dry-run 이라 아무것도 쓰지 않았다. --write 로 다시 실행하면 위 dead 항목의 status 를 "sold" 로 바꾼다.');
  }
  if (unknown.length > 0) {
    console.log("→ unknown 은 자동으로 내리지 않는다. 사람이 직접 확인.");
  }
}

main();

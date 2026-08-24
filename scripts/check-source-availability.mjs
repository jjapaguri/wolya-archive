/**
 * 원본 매물(fruitsfamily.com) 생존 체크 — 읽기 전용.
 *
 * `product-sourcing.ts` 의 `sourceUrl` 을 하나씩 fetch 해서 원본이 아직 판매중인지,
 * 가격이 매입 당시(`sourcePrice`)와 달라졌는지 확인한다. **사이트에 아무것도 쓰지 않는다** —
 * 결과를 사람(또는 ops 큐)이 읽고 판단하도록 보고만 한다.
 *
 * 자동으로 상품을 비공개 처리하는 것은 이 스크립트의 범위가 아니다. 지금 사이트는
 * `src/data/products.ts` 정적 데이터라 "비공개 처리" 는 곧 그 파일을 고쳐 재배포하는
 * 것이고, 그건 코드 변경이라 사람 검토가 필요하다(`ops/automation.json` 의 `writes` 도
 * 아직 `false` — 자동화가 사이트 데이터에 쓰기를 하면 안 되는 상태).
 *
 * fruitsfamily.com 페이지 안에 Next.js RSC 데이터로 상품 정보가 박혀 있고, 그중
 * "이 상품 자신"의 항목만 `price`/`original_price` 바로 뒤에 `status`(또는 `is_visible`) 가
 * 붙어 나온다(추천 상품들은 `status` 만 있고 `price` 가 없다) — 실제 응답을 여러 건 떠서 확인한
 * 패턴이다. 페이지마다 그 뒤에 `status` 가 오기도 하고 `is_visible` 이 오기도 해서 둘 다 본다.
 * "selling" 이 아니거나 `is_visible:false` 면 팔렸거나 내려간 것으로 보고 사람 확인이 필요하다고
 * 표시한다. 어느 쪽 패턴도 못 찾으면 억지로 판정하지 않고 그대로 "확인 필요" 로 남긴다 —
 * fruitsfamily 가 마크업을 또 바꾸면 이 휴리스틱도 깨질 수 있으니, 모르는 경우 확신하지 않는
 * 쪽이 안전하다. 그럴 때도 `httpStatus` 만으로는 최소한 "링크 자체가 죽었는지" 는 알 수 있다.
 *
 * 실행: node --experimental-strip-types scripts/check-source-availability.mjs [--json]
 */
import { productSourcing } from "../src/data/product-sourcing.ts";

const AS_JSON = process.argv.includes("--json");
const TIMEOUT_MS = 15_000;
const DELAY_BETWEEN_REQUESTS_MS = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 원본 상품 자신의 JSON 조각 — price/original_price 뒤에 status 또는 is_visible 이 붙는 두 형태를 본다. */
const OWN_PRODUCT_STATUS_RE = /"price":(\d+),"original_price":(null|\d+),"status":"([a-z_]+)"/;
const OWN_PRODUCT_VISIBLE_RE = /"price":(\d+),"original_price":(null|\d+),"is_visible":(true|false)/;

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
    result.verdict = "확인 실패 — 네트워크 오류";
    return result;
  }

  result.httpStatus = res.status;

  if (res.status === 404) {
    result.verdict = "원본 삭제됨 (404) — 사람 확인 필요";
    return result;
  }
  if (!res.ok) {
    result.verdict = `원본 응답 이상 (HTTP ${res.status}) — 사람 확인 필요`;
    return result;
  }

  const html = await res.text();
  const statusMatch = html.match(OWN_PRODUCT_STATUS_RE);
  const visibleMatch = !statusMatch && html.match(OWN_PRODUCT_VISIBLE_RE);

  if (!statusMatch && !visibleMatch) {
    result.verdict = "상품 정보 패턴을 못 찾음 (fruitsfamily 마크업 변경 가능성) — 사람 확인 필요";
    return result;
  }

  const match = statusMatch ?? visibleMatch;
  const priceOnPage = Number(match[1]);
  result.priceOnPage = priceOnPage;

  const notSelling = statusMatch
    ? statusMatch[3] !== "selling"
    : visibleMatch[3] !== "true";
  if (statusMatch) result.pageStatus = statusMatch[3];
  if (visibleMatch) result.isVisible = visibleMatch[3] === "true";

  const priceChanged = priceOnPage !== sourcePrice;

  if (notSelling) {
    const reason = statusMatch ? `상태 "${statusMatch[3]}" (selling 아님)` : "is_visible: false";
    result.verdict = `원본 ${reason} — 팔렸거나 내려갔을 가능성, 사람 확인 필요`;
  } else if (priceChanged) {
    result.verdict = `판매중, 가격 변동 있음: 매입가 ${sourcePrice.toLocaleString()}원 → 현재 ${priceOnPage.toLocaleString()}원`;
  } else {
    result.verdict = "판매중, 가격 동일";
  }
  return result;
}

async function main() {
  const entries = Object.entries(productSourcing).filter(([, v]) => v.sourceUrl);
  const results = [];

  for (const [slug, { sourceUrl, sourcePrice }] of entries) {
    results.push(await checkOne(slug, sourceUrl, sourcePrice));
    await sleep(DELAY_BETWEEN_REQUESTS_MS);
  }

  const skipped = Object.keys(productSourcing).length - entries.length;

  if (AS_JSON) {
    console.log(JSON.stringify({ checkedAt: new Date().toISOString(), skippedNoSourceUrl: skipped, results }, null, 2));
    return;
  }

  console.log(`원본 매물 생존 체크 — ${entries.length}건 확인 (sourceUrl 없어 건너뜀: ${skipped}건)\n`);
  const needsAttention = results.filter((r) => r.verdict.includes("사람 확인 필요") || r.verdict.includes("가격 변동"));
  for (const r of results) {
    console.log(`[${r.slug}] ${r.verdict}`);
  }
  console.log(`\n주의 필요: ${needsAttention.length}/${results.length}건`);
  if (needsAttention.length > 0) {
    console.log("→ 위 목록에서 재확인하고, 필요하면 src/data/products.ts 를 사람이 직접 고친다.");
  }
}

main();

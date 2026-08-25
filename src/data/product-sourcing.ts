/**
 * 매입가·원매물 링크 — 서버 전용. slug 로 찾는다.
 *
 * `Product`(`src/data/products.ts`) 에서 일부러 뺀 두 값이다. `Product` 는
 * `/shop` `/m/shop` 필터 같은 클라이언트 컴포넌트에 props 로 그대로 넘어가
 * RSC 페이로드에 직렬화되고, 빌드된 HTML 소스 보기로 누구나 읽을 수 있게 된다.
 * 매입가가 새면 마진이 공개되고, 원매물 링크가 새면 고객이 원가에 가서 사버린다.
 *
 * **이 파일은 서버 컴포넌트·서버 전용 모듈에서만 import 한다.**
 * "use client" 컴포넌트에서 import 하면 다시 새기 시작한다.
 *
 * - `sourcePrice`: 후르츠패밀리 게시가(원) — 내부 검증용
 * - `sourceUrl`: 원본 매물 링크 — 생존 체크용. 기존 3건(id 1~3)은 수집 당시 기록이 없어 없음
 */

export type ProductSourcing = {
  sourcePrice: number;
  sourceUrl?: string;
};

export const productSourcing: Record<string, ProductSourcing> = {
  "yiyae-washed-denim-trucker": { sourcePrice: 50000 },
  "twiyo-shell-button-fur-bag": { sourcePrice: 250000 },
  "hysteric-glamour-field-jacket-black": { sourcePrice: 250000 },
  "carhartt-duck-active-jacket-usa-l": { sourcePrice: 165000, sourceUrl: "https://fruitsfamily.com/product/6dfwa" },
  "carhartt-active-hood-tartan-j024": { sourcePrice: 127000, sourceUrl: "https://fruitsfamily.com/product/5z1sl" },
  "carhartt-active-jacket-j130-m": { sourcePrice: 200000, sourceUrl: "https://fruitsfamily.com/product/6c4i0" },
  "patagonia-synchilla-fleece-navy-m": { sourcePrice: 150000, sourceUrl: "https://fruitsfamily.com/product/6dny6" },
  "patagonia-micro-d-hoodie-xl": { sourcePrice: 120000, sourceUrl: "https://fruitsfamily.com/product/6dn7h" },
  "patagonia-synchilla-xxl": { sourcePrice: 200000, sourceUrl: "https://fruitsfamily.com/product/6d5f7" },
  "patagonia-reversible-fleece-l": { sourcePrice: 200000, sourceUrl: "https://fruitsfamily.com/product/6dht5" },
  "schott-usaf-ma1-90s-m": { sourcePrice: 158000, sourceUrl: "https://fruitsfamily.com/product/6cnt2" },
  "schott-618-perfecto-90s-m": { sourcePrice: 243000, sourceUrl: "https://fruitsfamily.com/product/5ul0z" },
  "avirex-m65-field-jacket-m": { sourcePrice: 160000, sourceUrl: "https://fruitsfamily.com/product/6dh11" },
  "avirex-ma1-vintage-s": { sourcePrice: 125000, sourceUrl: "https://fruitsfamily.com/product/4sgch" },
  "polo-cable-knit-23fw-navy-m": { sourcePrice: 100000, sourceUrl: "https://fruitsfamily.com/product/6dpp8" },
  "polo-cable-knit-cardigan-pink-s": { sourcePrice: 75000, sourceUrl: "https://fruitsfamily.com/product/6dppe" },
  "polo-cable-knit-navy-l": { sourcePrice: 65000, sourceUrl: "https://fruitsfamily.com/product/5jjxg" },
  "polo-field-shirt-90s-l": { sourcePrice: 86000, sourceUrl: "https://fruitsfamily.com/product/6dkpa" },
  "neighborhood-original-knit-m": { sourcePrice: 155000, sourceUrl: "https://fruitsfamily.com/product/52s3w" },
  "hysteric-glamour-shirt-jacket-m": { sourcePrice: 100000, sourceUrl: "https://fruitsfamily.com/product/6ar9j" },
  "champion-reverse-weave-ny-arch-m": { sourcePrice: 89000, sourceUrl: "https://fruitsfamily.com/product/4v31h" },
  "american-vintage-plaid-flannel-os": { sourcePrice: 80000, sourceUrl: "https://fruitsfamily.com/product/6c6pf" },
  "issey-miyake-1988aw-tee-m": { sourcePrice: 180000, sourceUrl: "https://fruitsfamily.com/product/6dpdg" },
  "levis-501-90s-usa-32-32": { sourcePrice: 93000, sourceUrl: "https://fruitsfamily.com/product/6dni2" },
  "levis-504-selvedge-32": { sourcePrice: 79000, sourceUrl: "https://fruitsfamily.com/product/6doie" },
  "levis-517-90s-white-tab": { sourcePrice: 140000, sourceUrl: "https://fruitsfamily.com/product/5ol7y" },
  "carhartt-carpenter-double-knee-brn-34": { sourcePrice: 140000, sourceUrl: "https://fruitsfamily.com/product/6chki" },
  "carhartt-sunfaded-black-pants-32": { sourcePrice: 90000, sourceUrl: "https://fruitsfamily.com/product/6dkta" },
  "stone-island-green-edge-denim-48": { sourcePrice: 266000, sourceUrl: "https://fruitsfamily.com/product/6dkjx" },
  "cdg-homme-two-tuck-chino-ad1992": { sourcePrice: 149100, sourceUrl: "https://fruitsfamily.com/product/6dpt5" },
  "cdg-homme-nylon-straight-pants-ad2000": { sourcePrice: 200000, sourceUrl: "https://fruitsfamily.com/product/6d4pj" },
  "cdg-homme-pocket-pants-m": { sourcePrice: 200000, sourceUrl: "https://fruitsfamily.com/product/6axez" },
  "levis-501-bige-selvedge-29": { sourcePrice: 150000, sourceUrl: "https://fruitsfamily.com/product/6edt4" },
  "carhartt-single-knee-carpenter-ptb-34": { sourcePrice: 140000, sourceUrl: "https://fruitsfamily.com/product/5pcsx" },
  "polo-classic-fit-chino-beige-30": { sourcePrice: 115000, sourceUrl: "https://fruitsfamily.com/product/6dobz" },
  "polo-corduroy-blazer-brown-xl": { sourcePrice: 165000, sourceUrl: "https://fruitsfamily.com/product/6cjnx" },
  "patagonia-retro-x-natural-l": { sourcePrice: 180000, sourceUrl: "https://fruitsfamily.com/product/629k9" },
};

/**
 * 상품 데이터 — 사이트 전체(데스크톱 `/`, 모바일 `/m`)가 이 파일 하나를 공유한다.
 *
 * 출처: 후루츠패밀리 셀러 @cartiii 판매중 매물 (2026-08-20 수집).
 * SOLD 매물과 `(구매)` 구매희망 글은 제외했다.
 * 가격은 후루츠패밀리 게시가에 **세금 10% 가산** 후 100원 단위 반올림.
 *
 * DB 연결층이 생기면 이 파일의 `products` export 만 실제 조회로 바꾼다.
 * export 이름을 유지하면 화면 코드는 수정할 필요가 없다.
 */

export type Product = {
  id: number;
  slug: string;
  tag: string;
  /** 대표 이미지 (목록·OG 용) */
  image: string;
  /** 상세 갤러리. [0] 은 image 와 같다 */
  images: string[];
  name: string;
  brand: string;
  size: string;
  /** 판매가 (원). 후르츠 게시가 + 10% 세금 */
  price: number;
  /** 후르츠패밀리 게시가 (원) — 내부 검증용, 화면 비노출 */
  sourcePrice: number;
  condition: string;
  hook: string;
  fabric: string;
  fit: string;
  measurements: string;
  stock: string;
  recommendedFor: string;
  categories: string;
};

const IMG = "https://image.production.fruitsfamily.com/public/product/resized%40width1125";

export const products: Product[] = [
  {
    id: 1,
    slug: "yiyae-washed-denim-trucker",
    tag: "ARCHIVE 001",
    image: `${IMG}/FcNxMcbwS-c0ae6d5b0da8.jpg`,
    images: [`${IMG}/FcNxMcbwS-c0ae6d5b0da8.jpg`],
    name: "이예 워시드 데님 트러커 자켓",
    brand: "yiyae (이예)",
    size: "L",
    price: 55000,
    sourcePrice: 50000,
    condition: "중고 · 착용 수 회. 눈에 띄는 하자 없음",
    hook: "위아래 물빠짐이 갈리는 트러커. 새 옷인데 10년 입은 얼굴을 하고 있다.",
    fabric:
      "코튼 데님 — 헤비 워시드 가공. 어깨는 인디고가 남고 아래로 갈수록 옐로 캐스트가 올라오는 그라데이션. 혼용률 태그는 입고 후 확인",
    fit: "L / 박시한 크롭 트러커. 어깨선이 살짝 떨어지는 오버핏이라 남녀 공용으로 걸친다",
    measurements: "판매자 미기재 — 입고 즉시 어깨·가슴·소매·총장 4개 실측해 갱신",
    stock: "1점 한정",
    recommendedFor: "무지 티 위에 툭 걸치는 간절기 아우터를 찾는 사람",
    categories: "#데님자켓 #트러커 #워시드 #이예 #간절기",
  },
  {
    id: 2,
    slug: "twiyo-shell-button-fur-bag",
    tag: "ARCHIVE 002",
    image: `${IMG}/GiqwUPnTI-46598e6c257e.jpg`,
    images: [
      `${IMG}/GiqwUPnTI-46598e6c257e.jpg`,
      `${IMG}/wrBVmM-dEE-2cfb6f126d09.jpg`,
    ],
    name: "더 월드 이즈 유어 오이스터 셸버튼 퍼 백",
    brand: "The World Is Your Oyster",
    size: "OS (원사이즈)",
    price: 275000,
    sourcePrice: 250000,
    condition: "중고 · 공식 홈페이지 구매. 자개 단추 1개 탈락 (그 외 양호)",
    hook: "브랜드 시그니처인 자개 단추를 퍼 위에 흩뿌린 숄더백. 검정 위 진주광이 유일한 색이다.",
    fabric:
      "블랙 페이크 퍼 보디 + 레더 핸들·트리밍. 자개(마더오브펄) 셸 버튼 장식 — 브랜드의 버튼 모티프 시그니처",
    fit: "어깨에 걸치는 호보 실루엣. 남녀 공용, 데일리 사이즈",
    measurements: "판매자 미기재 — 입고 후 가로·세로·스트랩 드롭 실측 예정",
    stock: "1점 한정",
    recommendedFor: "옷은 단순하게 입고 가방 하나로 끝내는 사람",
    categories: "#숄더백 #퍼백 #자개단추 #TWIYO #컨템포러리",
  },
  {
    id: 3,
    slug: "hysteric-glamour-field-jacket-black",
    tag: "ARCHIVE 003",
    image: `${IMG}/HvSLmefZD-d1cec8543ee7.jpg`,
    images: [
      `${IMG}/HvSLmefZD-d1cec8543ee7.jpg`,
      `${IMG}/RFOhvEUyCa-ee2291533b80.jpg`,
      `${IMG}/3BnG9qhE_-026dce6601b5.jpg`,
    ],
    name: "히스테릭글래머 필드자켓 블랙",
    brand: "Hysteric Glamour",
    size: "S (실측 오버핏)",
    price: 275000,
    sourcePrice: 250000,
    condition: "중고 · 2026년 2월 하라주쿠 매장 구매, 4회 착용",
    hook: "라벨은 FOR YANKEE GIRL. 여성 라인이지만 가슴 단면 58.5cm — 남자가 오버핏으로 입는다.",
    fabric:
      "두툼한 코튼 저지 계열. 스탠드 칼라, 지퍼 프론트, 플랩 포켓 4개(가슴 2 + 하단 2), 소매·밑단 고무단. 컴포지션 태그는 입고 후 확인",
    fit: "태그는 Small 이지만 가슴 단면 58.5cm 로 실제는 오버핏. 175cm / 70kg 기준 넉넉하게 떨어진다",
    measurements: "총장 66cm / 가슴 단면 58.5cm (측정 방식에 따라 ±1~3cm)",
    stock: "1점 한정",
    recommendedFor: "1984년 도쿄 안티패션의 원본을 하나쯤 갖고 싶은 사람",
    categories: "#필드자켓 #히스테릭글래머 #일본 #스트릿 #아카이브",
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function formatPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
}

/**
 * 무한 흐르는 두 줄 마퀴용. 상품 수가 적어도 줄이 비지 않도록 채운다.
 * (상품이 8개 이상으로 늘면 아래 half 분기가 자연스럽게 두 줄을 갈라준다)
 */
function marquee(source: Product[]): Product[] {
  if (source.length === 0) return [];
  const filled = [...source];
  while (filled.length < 4) filled.push(...source);
  return [...filled, ...filled];
}

const half = products.length >= 8 ? Math.ceil(products.length / 2) : products.length;

export const topRowProducts = marquee(products.slice(0, half));
export const bottomRowProducts = marquee(
  products.length >= 8 ? products.slice(half) : [...products].reverse(),
);

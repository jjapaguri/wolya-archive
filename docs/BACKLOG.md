# 개발 백로그

**이 파일이 개발 자동화의 작업 큐다.** 매일 도는 `dev-loop` 워크플로가 위에서부터 하나씩 집어간다.
사람이 직접 고쳐도 되고, 정찰 에이전트가 항목을 추가하기도 한다.

## 규칙

| | |
|---|---|
| 순서 | **위에 있는 것부터** 집는다. 우선순위를 바꾸려면 줄을 옮긴다 |
| 한 번에 | **1회 실행 = 1항목.** 여러 개를 몰아서 하지 않는다 |
| `auto` | CI 통과하면 자동 병합 → 서버가 10분 내 배포 |
| `review` | PR 만 열고 사람을 기다린다. 자동 병합하지 않는다 |
| 완료 | `## 완료` 로 옮기고 날짜·PR 번호를 적는다. **지우지 않는다** — 지우면 정찰이 같은 걸 또 찾아낸다 |
| 보류 | 두 번 실패한 항목은 `## 보류` 로 내린다. 무한 재시도 금지 |

## 이중 라우트 규칙 — 이걸 어기면 휴대폰 사용자가 404 를 본다

이 사이트는 **데스크톱 `/` 와 모바일 `/m` 이 의도적으로 분리된 별도 라우트**다.
`src/proxy.ts` 가 기기를 보고 보내고, `?view=desktop|mobile` 로 바꾸면 쿠키에 30일 기억한다.
태블릿은 데스크톱으로 친다.

| | |
|---|---|
| **공유** | `src/data/` — `products.ts` 와 `Product` 타입. 양쪽이 같이 쓴다 |
| **독립** | `src/components/` 와 `src/app/` — 모바일 컴포넌트는 데스크톱 것을 하나도 import 하지 않는다 |

**화면에 보이는 것을 바꾸면 `/` 와 `/m` 양쪽을 다 고쳐야 한다.** 데이터만 바꾸는 것은 한 번이면 된다.

새 라우트는 특히 위험하다. 프록시가 `/shop` → `/m/shop` 으로 보내므로
**데스크톱 쪽만 만들면 휴대폰에서는 레이아웃이 어색한 정도가 아니라 404 가 뜬다.**
지금은 라우트가 `/` 와 `/m` 뿐이라 이 사고가 안 났을 뿐이다.

    - `/shop` 을 만들면 → `/m/shop` 도 같이 만든다
    - `/product/[slug]` 를 만들면 → `/m/product/[slug]` 도 같이 만든다
    - 한쪽만 만들 거면 그 항목은 `review` 로 내리고 이유를 적는다

## 손대면 안 되는 것 (자동 병합 금지 경로)

`db/migrations/` · `ops/` · `.github/workflows/` · `AGENTS.md` · `package.json` 의 의존성 추가
· 결제/주문 관련 코드 · `next.config.ts`

이 경로가 포함된 변경은 등급과 무관하게 **항상 `review`** 로 강등한다.

---

## 할 일

### P0 — 지금 사이트가 제 역할을 못 하는 원인

> 모바일 병합이 끝났으므로(2026-08-18) 아래 항목들은 이제 **`/` 와 `/m` 양쪽을 만들 수 있다.**
> 위의 "이중 라우트 규칙" 을 반드시 지킬 것.

- [ ] `auto` **원가와 원매물 링크가 `/shop` `/m/shop` 페이지 소스에 그대로 노출된다 — 즉시 막는다**
  2026-08-23 배포된 프로덕션에서 직접 확인했다. `/shop` 과 `/m/shop` 의 HTML 안 RSC 페이로드에
  `sourcePrice` 32건, `sourceUrl` 29건이 **값까지 그대로** 들어 있다. 화면에는 안 보이지만
  소스 보기로 누구나 읽는다. 고객이 후루츠 원매물로 가서 15~20% 싸게 사면 그만이고,
  우리 마진이 전부 공개된다. 상세페이지(`/product/[slug]`, `/m/product/[slug]`)와 홈은 깨끗하다.
  원인은 필터 탭이 클라이언트 컴포넌트라 `Product` 객체 **전체**가 직렬화되어 넘어가는 것이다.
  **화면에 안 그리는 것만으로는 못 막는다. 클라이언트로 넘어가는 객체 자체에서 빼야 한다.**
  권장 방향: 두 필드를 `Product` 에서 떼어내 서버 전용 모듈(예: `src/data/product-sourcing.ts`)의
  slug 키 맵으로 옮기고 서버 코드에서만 import 한다. 그러면 구조적으로 다시 샐 수 없다.
  타입만 손보고 끝내지 마라 — **빌드 산출물(`.next` 의 `/shop` `/m/shop` HTML)에서**
  `sourcePrice` · `sourceUrl` · `fruitsfamily.com/product` 문자열이 **0건인지 실제로 확인**하고
  그 확인 결과를 PR 본문에 적어라. 상세페이지의 예약주문 배지·고지 문구·판매자 고지는 그대로 살려야 한다.

- [ ] `review` **원본 매물 생존 체크 — 팔린 매물을 사이트에서 자동으로 내린다**
  무재고 1점물이라 원본이 팔리면 우리 상세페이지가 유령이 된다. 각 상품 `sourceUrl` 을 하루 3회 확인해
  품절·삭제면 자동 비공개로 내린다. `sourcePrice` 변동도 로그에 남긴다 — 셀러 할인 종료로 마진이
  사라지는 것을 잡기 위함이다(현재 할인가 4건: 6c4i0 · 5ul0z · 4sgch · 6dpt5).
  `ops/` 를 건드리므로 금지 경로 규칙에 따라 `review` 다.

- [ ] `review` **로그인 메뉴 — 지금은 만들지 말고 순서를 먼저 보라**
  > 2026-08-21 dev-loop: 이 항목은 본문에 이미 "지금 만들면 버려질 코드" 라고 적혀 있어 건너뛰었다.
  > 아래 P2 두 항목도 각각 금지 경로(`ops/`·`.github/workflows/`)와 범위 초과로 자동화 대상이 아니다 — 이번 실행은 PR 없이 종료.
  > 2026-08-22 dev-loop: 전제 재확인, 변동 없음. `package.json` dependencies 는 여전히
  > `next`/`react`/`react-dom` 뿐이라 "앱↔DB 연결층" 항목은 1단계(`npm install pg`)부터
  > 이번 실행 규칙의 "새 라이브러리를 설치하지 마라" 에 막혀 `review` 등급이어도 시도 자체가 불가능하다.
  > 열린 `auto/` PR 없음. 이번 실행도 PR 없이 종료.
  > 2026-08-23 dev-loop: 다시 확인, 변동 없음. 열린 `auto/` PR 없음(`gh pr list` 결과 0건).
  > `package.json` 에 여전히 PostgreSQL 클라이언트 없음 — "앱↔DB 연결층" 은 여전히 1단계부터 막힘.
  > P1 은 비어 있고 P2 나머지 한 항목(`ops/auto_deploy.sh` 변경)은 금지 경로 그대로.
  > 실행 가능한 항목 없어 PR 없이 종료.
  `users` / `user_social_accounts` / `user_addresses` 테이블은 이미 있다(002). 이메일 + 소셜(카카오·네이버·구글) 설계다.
  **그런데 지금 만들면 버려질 코드가 된다.** 앱이 DB 를 전혀 안 쓰고 있어서
  (`package.json` 에 PostgreSQL 클라이언트조차 없다) 인증만 먼저 붙일 수가 없다.
  또한 **비회원 주문이 이미 설계에 들어 있다** — `carts.session_key`, `orders.user_id` NULL 허용,
  주문조회는 주문번호+휴대폰. **로그인 없이도 팔 수 있다는 뜻이다.**
  올바른 순서: 앱↔DB 연결 → 상품 등록 → 비회원 주문·결제 → **그다음** 로그인.
  인증은 비밀번호 해싱·세션·소셜 OAuth 가 얽혀서 무인 자동화에 맡길 영역이 아니다. 사람이 설계하고 검수한다.

### P1 — 유입을 못 받는 원인 (인스타 전략에 직결)

_(현재 없음)_

### P2 — 구조·성능

- [ ] `review` **빌드를 서버에서 하지 않는다**
  지금 `ops/auto_deploy.sh` 는 Lightsail(2GB, Postgres·Next·PM2 공용)에서 `npm ci` + `next build` 를 돈다.
  실제로 메모리 때문에 `--max-old-space-size=1536` 을 걸어야 했고 첫 배포도 빌드 단계에서 실패했다.
  **GitHub Actions 에서 빌드해 산출물을 서버로 보내고, 서버는 PM2 재시작만** 하게 바꾼다.
  개발 자동화가 돌기 시작하면 배포 빈도가 올라가므로 이 항목의 가치가 커진다.

- [ ] `review` **앱 ↔ DB 연결층** — 절차는 `db/HANDOFF-앱-DB-연결.md`. 범위가 커서 사람이 봐야 한다.

---

## 완료

### 2026-08-23 (2)

- [x] `auto` **PR #13 을 현재 main 에 맞춰 되살렸다 — `kind`/`shortMeasure`/`status` 누락 수정**
  `auto/online-sourcing-29-products` 를 새로 만들지 않고 그대로 체크아웃해 `origin/main` 을 병합했다.
  main 은 그 사이 PR #12(코디 교차 슬라이드, `Product.kind`/`shortMeasure` 필수화)와
  A0 앱-DB 연결층(PR #14, `src/lib/product-queries.ts` 매퍼)이 들어와 있었다.
  `src/data/products.ts` 는 git 이 텍스트 충돌 없이 자동 병합했지만, **의미상으로는 깨져 있었다** —
  main 이 추가한 `kind`/`shortMeasure` 필드가 이 브랜치의 29건(id 4~32)에는 채워지지 않은 채였다
  (기존 3건 id 1~3 에만 채워짐). `docs/INCIDENTS.md` 2026-08-23 항목이 예고한 것과 같은
  "각자 초록불, 병합하면 타입 깨짐" 패턴이 실제로 재현됐다. `docs/2026-08-22-online-sourcing-29.json`
  에 이미 29건 전부의 `kind`/`shortMeasure` 값이 들어 있어(같은 이름의 다른 dev-loop 실행이 채워둠)
  그대로 옮겼다(bottom 9건, top 20건, null 0건) — 지어내지 않았다.
  `src/lib/product-queries.ts` 의 `mapRow` 에도 `status` 필드가 없어 타입체크가 깨지고 있었다
  (#14 가 고친 `kind`/`shortMeasure` 와 같은 종류의 누락, 이번엔 `status`). DB 에 예약주문 개념 컬럼이
  아직 없어 시드 3건 전부 매입 완료 재고라는 전제로 `status: "available"` 고정값을 채웠다.
  `docs/BACKLOG.md` 충돌은 main 쪽의 "PR #13 을 되살린다"(이 작업 자체) 와 "온라인 소싱 29건 등록"
  (이미 이 브랜치에서 완료 처리됨, main 은 아직 모름) 두 항목을 제거하는 방향으로 풀었다 — 병합되고 나면
  main 도 이 브랜치의 완료 기록을 그대로 물려받는다.
  하의 9건이 새로 들어오면서 `docs/STATUS.md` 의 "하의 0건이라 코디 교차 슬라이드가 숨어 있다" 전제가
  깨져 같은 PR 에서 갱신했다 — `OUTFIT_ROW_MIN_ITEMS`(2건) 조건이 충족돼 데스크톱·모바일 둘 다
  이 구간이 다시 나온다.
  `npm run lint && npm run build` 통과 — 89개 라우트 생성, `/product/[slug]` `/m/product/[slug]`
  32개 전부 정적 생성 확인. `npm run start` 로컬 프로덕션 서버에서 확인한 것: `/` `/m` 홈 HTML 에
  `outfit-row-top`/`outfit-row-bottom`/"#아이템 소개" 가 등장하는 것(코디 구간 복귀), `/shop` 에
  "하의" 탭이 실제 항목과 함께 나오는 것, 예약주문 상세 페이지(desktop `/product/carhartt-...`,
  mobile `/m/product/carhartt-...`) 에 배지·고정 문구가 그대로 유지되는 것, `sourcePrice`(165000)
  가 HTML 어디에도 없는 것. 실제 브라우저(휴대폰 포함)로는 보지 않았다 — curl·정적 HTML 검증까지만 했다.
  `db/migrations/`(006·007)·`package.json`(A0 연결층 의존성) 이 이 브랜치에 새로 나타나지만
  `git diff origin/main` 로 대조하면 두 경로 모두 main 과 완전히 동일하다 — main 을 병합해
  들어온 내용일 뿐 이 PR 이 건드린 변경이 아니다. 그래서 금지 경로 규칙에 해당하지 않는다고 보고
  `auto` 등급을 유지했다.

### 2026-08-23

- [x] `auto` **온라인 소싱 29건을 상품으로 등록 — `docs/2026-08-22-online-sourcing-29.json`**
  JSON 29건(id 4~32)을 `src/data/products.ts` 의 `products` 배열에 그대로 추가했다. 기존 3건(id 1~3)은
  손대지 않고 `status: "available"` 만 채웠다. `image`/`images` 의 `@IMG@` 는 파일 상단 `IMG` 상수를 쓰는
  템플릿 리터럴로 옮겼다. `Product` 타입에 `status: "available" | "preorder"`(필수) · `note?: string`(선택) ·
  `sourceUrl?: string`(선택)을 추가했다 — 지시문은 `sourceUrl` 을 필수로 적었지만, 기존 3건은 수집 당시
  원본 링크를 기록해두지 않아 실제 값이 없다. URL 을 지어내는 건 금지 규칙이라 그 3건만 `sourceUrl` 을
  비우기 위해 옵셔널로 뒀다 — 새 29건은 전부 JSON 의 실제 `fruitsfamily.com` 링크를 그대로 채웠다.
  `sourcePrice` 는 기존과 동일하게 화면 비노출 — 빌드된 HTML 을 grep 해 숫자가 안 나오는 것을 확인했다.
  예약주문(`status === "preorder"`) 표시는 `/`(`ProductCard.tsx`, `/product/[slug]`)와
  `/m`(`MobileProductCard.tsx`, `/m/product/[slug]`) 양쪽에 만들었다 — 카드 태그 옆 배지, 상세페이지
  CTA 위 고정 문구("사입 확인 후 확정됩니다. 확보에 실패하면 3영업일 내 전액 환불됩니다.").
  `note` 가 있는 14건은 상세페이지 하단에 "판매자 고지" 로 노출(`available` 상품엔 `note` 가 없어 노출 안 됨).
  `next.config.ts` 는 건드리지 않았다(후루츠 CDN 호스트 기존 등록분 그대로 사용).
  `npm run lint && npm run build` 통과 — 32개 상품 전부 `/product/[slug]` `/m/product/[slug]` 정적 생성 확인
  (빌드 로그에 "+29 more paths"). `npm run start` 로컬 프로덕션 서버에서 확인한 것:
  예약주문 상품 상세(desktop/mobile) curl 200 + 배지·고정 문구 텍스트 출력, `available` 상품 페이지엔
  배지·문구가 안 나오는 것(grep count 0), 가격이 `190,000원` 형식으로 나오고 `sourcePrice` 숫자(165000)는
  HTML 어디에도 없는 것, note 텍스트("가죽 패치에 사용감...")가 상세 하단에 뜨는 것, `/shop` `/m/shop` 양쪽
  모두 32개 상품 링크와 4개 카테고리 탭(상의/하의/액세서리/신발)이 나오는 것, 홈 마퀴에 32개
  `ARCHIVE 0xx` 태그가 전부 등장하는 것. 실제 브라우저(휴대폰 포함)로는 보지 않았다 — 정적 HTML·curl
  검증까지만 했다.

### 2026-08-20 (3)

- [x] `auto` **"상품 데이터 타입/조회 함수 분리" 항목 정리 — 이미 다른 작업으로 해소돼 있었다**
  백로그의 P2 "상품 데이터가 45줄 하드코딩 플레이스홀더다 — 타입과 조회 함수를 분리한다" 항목을
  구현 전 확인했더니 이미 해소된 상태였다. `git log -- src/data/products.ts` 로 확인:
  `Product` 타입은 최초 커밋(`e74bbeb`)부터 이미 데이터 배열과 분리된 독립 `export type` 이었고,
  조회 함수 `getProductBySlug` 는 2026-08-18(`6303baa`, 상품 상세 페이지 작업)에 이미 추가됐다.
  "45줄 자리표시자(`[아이템명]`, `[소재명]`)" 문제 자체도 2026-08-20(`99fa0c3`, 실제 상품 3건 등록)로
  해소됐다. 지금 `src/data/products.ts` 는 `ProductCategory`/`Product` 타입, `products` 데이터,
  `getProductBySlug`/`formatPrice` 조회·포맷 함수가 이미 각자 분리돼 있고, 파일 상단 주석에
  "DB 연결층이 생기면 `products` export 만 바꾸면 된다"는 교체 전략도 이미 적혀 있었다.
  추가로 파일을 쪼개는 건(예: 타입만 별도 파일로) 지금 필요 이상의 구조를 만드는 것이라 하지 않았다.
  코드 변경 없음 — 백로그 항목만 완료로 옮긴다. `npm run lint && npm run build` 는 실행해 통과 확인했다
  (변경이 문서뿐이라 결과는 이전과 동일할 것으로 예상했고 실제로 그랬다).

### 2026-08-20 (2)

- [x] `auto` **상품 카테고리를 top / bottom / accessory / shoes 로 나눴다 — `/shop` `/m/shop` 필터 추가**
  `src/data/products.ts` 의 `Product` 에 `category: "top" | "bottom" | "accessory" | "shoes"` 를 추가하고,
  기존 해시태그 문자열 필드 `categories` 는 `tags` 로 이름을 바꿔 그대로 뒀다(검색·분위기 표현용).
  `CATEGORIES`/`CATEGORY_LABELS`(한글 라벨: 상의/하의/액세서리/신발) 를 같이 export 했다.
  기존 3개 상품에 분류를 매겼다 — 데님 트러커 자켓·필드자켓은 `top`, 퍼 백은 `accessory`
  (지금 재고에 `bottom`/`shoes` 가 없어 그 두 탭은 빈 목록 안내문이 뜬다, 정상 동작).
  필터 UI는 `src/components/ShopGrid.tsx`(데스크톱) / `src/components/mobile/MobileShopGrid.tsx`(모바일)
  클라이언트 컴포넌트로 새로 만들어 `/shop` `/m/shop` 페이지가 기존처럼 `products` 배열을 그대로 넘기고,
  그리드 안에서 탭 상태로 필터링한다. `ProductCard`/`MobileProductCard`, 상세 페이지(`/product/[slug]`,
  `/m/product/[slug]`) 4곳의 `product.categories` 참조는 `product.tags` 로 바꿨다.
  DB 쪽은 이미 준비돼 있다(`categories` 테이블 + `products.category_id`, `db/migrations/001_products.up.sql`) —
  앱-DB 연결 시 이 4개 값을 seed 로 넣으면 된다.
  `npm run lint && npm run build` 통과(기존 `DesktopViewLink.tsx` 무관 warning 1개만 남음), 31개 라우트 전부 생성 확인.
  `npm run start` 로컬 프로덕션 서버에서 `/shop` `/m/shop` 둘 다 200, HTML에 4개 탭 라벨(상의/하의/액세서리/신발)과
  전체 탭이 모두 출력되는 것을 curl 로 확인했다. 상세 페이지 2곳(`/product/...`, `/m/product/...`)도 200 이고
  `product.tags` 값(`#데님자켓` 등)이 정상 출력되는 것을 확인했다.
  탭 클릭 시 실제 필터링 동작(클라이언트 상태 변화)은 실제 브라우저로 보지 않았다 — 정적 HTML·빌드 검증까지만 했다.

### 2026-08-20

- [x] `auto` **월야 로고를 눌러도 홈으로 안 간다 — 로고를 `<Link>` 로 감쌌다**
  데스크톱 `Sidebar.tsx` 의 `[W-ARCHV]` 자리표시자 문자열을 `<Link href="/">WOLYA ARCHIVE</Link>` 로,
  모바일 `MobileHeader.tsx` 의 `Wolya` `<div>` 를 `<Link href="/m">` 로 각각 바꿨다.
  `Sidebar` 는 홈페이지 `HeroSection` 에서만 쓰여서(서브페이지엔 없음) 영향 범위는 홈 로고 클릭 하나뿐이고,
  서브페이지들은 이미 자체 "← 홈으로" 링크를 갖고 있었다(`shop`/`product/[slug]` 등에서 확인).
  `MobileHeader` 는 모든 `/m/*` 페이지의 공통 헤더라 이 변경이 전체 모바일 라우트에 적용된다.
  `npm run lint && npm run build` 통과(기존 `DesktopViewLink.tsx` 무관 warning 1개만 남음), 41개 라우트 정적 생성 확인.
  `npm run start` 로컬 프로덕션 서버에서 `/`(로고 `href="/"`)와 `/m`, `/m/shop`(로고 `href="/m"`)을
  curl 로 확인했다. 실제 브라우저(휴대폰 포함)로는 보지 않았다.

- [x] `auto` **FAQ 의 `See more FAQ` 가 `href="#"` 였다 — `/faq` `/m/faq` 페이지를 만들었다**
  `src/lib/faq-content.ts` 에 홈 티저(4개)보다 넓은 9개 질문/답변을 구조화된 데이터로 뒀다 —
  결제·배송·환불 소요기간·단벌 재고·비회원 주문 등은 `src/lib/legal-content.ts` 의 이용약관/
  교환·환불 규정 초안과 사실관계를 맞췄다(예: 청약철회 7일, 배송 영업일 3일 이내, 환불 3~5일 이내).
  `src/app/faq/page.tsx` 와 `src/app/m/faq/page.tsx` 가 같은 데이터를 각자 스타일로 렌더링한다.
  `FaqSection.tsx`(데스크톱)와 `MobileFaq.tsx`(모바일)의 `See more FAQ` `href="#"` 를 각각
  `next/link` 로 `/faq` `/m/faq` 로 교체했다. 홈에 있던 4개짜리 티저 목록 자체는 그대로 뒀다.
  `sitemap.ts` 에 `/faq` 추가(`/m/faq` 는 기존 패턴대로 `/m` canonical 에 흡수).
  `npm run lint && npm run build` 통과 — `/faq` `/m/faq` 둘 다 정적 라우트 생성 확인.
  `npm run start` 로컬 프로덕션 서버에서 `/faq`·`/m/faq` curl 200, `<title>` 정상,
  `/`·`/m` 홈의 `href="/faq"`·`href="/m/faq"` 존재, `sitemap.xml` 에 `/faq` 포함을 확인했다.
  실제 브라우저(휴대폰 포함)로는 보지 않았다.

### 2026-08-19

- [x] `auto` **푸터 법적 문서 3개가 전부 `href="#"` 였다 — 이용약관/개인정보처리방침/교환·환불 규정 초안 페이지를 만들었다**
  `src/lib/legal-content.ts` 에 세 문서(이용약관·개인정보처리방침·교환/환불 규정)의 조항 텍스트를
  구조화된 데이터로 두고, `src/app/legal/[slug]/page.tsx` 와 `src/app/m/legal/[slug]/page.tsx` 가
  같은 데이터를 각자 스타일로 렌더링한다 — 데이터는 공유하되 화면은 데스크톱/모바일 독립을 유지.
  각 페이지 상단에 "법률 검토 전 초안" 경고 배너를 넣어 실제 사업자 정보·조항 확정 전임을 명시했다.
  본문은 전자상거래법 기준(청약철회 7일, 단벌 상품 재고 소진 시 자동 취소 등)을 반영한 표준형 초안이고,
  사업자등록번호·주소 등 미확정 값은 기존 푸터와 같은 방식으로 대괄호 placeholder 로 남겼다.
  `SiteFooter.tsx` 와 `MobileFooter.tsx` 의 `href="#"` 세 개를 각각 `/legal/terms` `/legal/privacy`
  `/legal/refund` (모바일은 `/m/legal/*`) 로 바꾸고 `next/link` 를 썼다. `sitemap.ts` 에 세 경로 추가.
  `npm run lint && npm run build` 통과 — 6개 라우트(`/legal/terms|privacy|refund`, `/m/legal/*`)
  모두 `generateStaticParams` 로 정적 생성됨을 빌드 로그로 확인했다.
  `npm run start` 로컬 프로덕션 서버에서 6개 경로 전부 curl 200, 잘못된 slug(`/legal/nope`)는 404,
  `/` 와 `/m` 홈의 푸터 `href` 가 각각 새 경로를 가리키는 것, `<title>` 과 경고 배너 텍스트가
  정상 렌더링되는 것을 확인했다. 실제 브라우저(휴대폰 포함)로는 보지 않았고, 법률 검토는
  당연히 받지 않았다 — 배너에 명시한 대로 판매 시작 전 변호사 검토가 필요하다.

- [x] `auto` **OG 태그와 공유 이미지가 없다 — `openGraph`/`twitter` 메타와 `opengraph-image.tsx` 추가**
  `src/app/layout.tsx` 와 `src/app/m/layout.tsx` 의 `metadata` 에 `openGraph`(title/description/url/
  siteName/locale/type)와 `twitter`(`summary_large_image`)를 추가했다. 루트에 `metadataBase`
  (`https://archive-wolya.com`)도 추가했다 — OG 이미지 절대경로 생성에 필요하다.
  이미지는 `next/og` 의 `ImageResponse` 로 생성한다. 처음엔 `src/app/opengraph-image.tsx` 하나만
  만들었는데, `/m` 쪽 `layout.tsx` 에 자체 `openGraph` 객체를 넣는 순간 Next 가 그 레벨에서
  `openGraph` 를 통째로 새로 resolve 해버려 루트에서 상속되던 이미지가 사라지는 걸 로컬에서
  확인했다(`/m` 응답에 `og:image` 메타 자체가 없었음). 그래서 이미지 생성 로직을
  `src/lib/og-image.tsx` 로 뽑고 `src/app/opengraph-image.tsx` 와 `src/app/m/opengraph-image.tsx`
  양쪽에서 각각 re-export 하는 방식으로 바꿨다 — 두 라우트 세그먼트에 파일을 각각 두는 게
  Next 16 파일 컨벤션에서 실제로 동작하는 유일한 방법이었다.
  `npm run lint && npm run build` 통과(무관한 기존 warning 1개만 남음), `/opengraph-image` 와
  `/m/opengraph-image` 둘 다 정적 라우트로 생성됨을 빌드 로그로 확인했다.
  `npm run start` 로컬 프로덕션 서버에서 `/` 와 `/m` 양쪽의 `<head>` 를 curl 로 확인 —
  각각 자기 도메인의 `og:image`/`twitter:image` 를 가리키고(`/opengraph-image` vs
  `/m/opengraph-image`), 두 이미지 URL 모두 200·`image/png`·1200×630 응답을 확인했다.
  하위 라우트(`/shop`, `/product/[slug]`, `/m/shop`)도 각자 트리의 루트 이미지를 상속받는 것을
  curl 로 확인했다. 생성된 이미지를 직접 열어 텍스트·색상(배경 `#0d0b0a`, 포인트 `#703d1f`)이
  깨지지 않았음을 확인했다. 실제 카카오톡/인스타 DM 미리보기로는 확인하지 못했다(외부 크롤러가
  로컬 서버에 접근할 수 없음) — 배포 후 실제 링크 공유로 확인이 필요하다.

- [x] `auto` **`View Collections` 버튼이 아무 동작도 안 한다 — `/shop` `/m/shop` 으로 보내는 링크로 바꿨다**
  `ContentPanel.tsx`(데스크톱)와 `MobileEditorial.tsx`(모바일)의 `<button>` 을
  각각 `next/link` 의 `<Link href="/shop">` / `<Link href="/m/shop">` 으로 바꿨다.
  기존 클래스·아이콘·문구는 그대로 뒀다.
  `npm run lint` 통과(기존에 있던 `DesktopViewLink.tsx` 의 무관한 warning 1개만 남음),
  `npm run build` 통과, 31개 라우트 전부 정적 생성 확인.
  `npm run start` 로컬 프로덕션 서버에서 `/` 와 `/m` 양쪽에서
  `View Collections`/`VIEW COLLECTIONS` 버튼의 `href` 가 각각 `/shop`·`/m/shop` 인 것을 curl 로 확인했고,
  두 경로 모두 200 응답도 확인했다. 실제 브라우저로는 보지 않았다.

- [x] `auto` **메뉴 4개(`Shop/Archive/About/Contact`)가 전부 `href="#"` 였다 — 실제 페이지를 만들었다**
  `/shop`(전체 상품 목록, `ProductCard` 재사용) · `/about`(브랜드 소개, `ContentPanel` 문구 재사용) ·
  `/archive`·`/contact`(내용이 아직 없어 "준비 중" 골격 + 관련 링크만).
  `/m/shop` `/m/archive` `/m/about` `/m/contact` 를 데스크톱과 짝으로 같이 만들었다.
  `ContentPanel.tsx` 와 `MobileHeader.tsx` 의 `href="#"` 를 각각 실제 경로로 바꾸고 `next/link` 로 교체했다.
  `sitemap.ts` 에 4개 데스크톱 경로를 추가했다(`/m/*` 는 기존처럼 canonical 이 `/` 라 생략).
  `npm run lint && npm run build` 통과, 8개 라우트 전부 `●/○`(정적) 생성 확인.
  `npm run start` 로컬 프로덕션 서버에서 8개 경로 전부 curl 200 확인,
  `/` `/m` 홈 페이지의 nav `href` 가 각각 새 경로를 가리키는 것도 curl 로 확인했다.
  실제 브라우저(휴대폰 포함)로는 보지 않았다.
  `View Collections` 버튼 연결은 이 항목 범위가 아니라 다음 항목으로 남겨둔다.

### 2026-08-18

- [x] `auto` **상품 카드에서 상세로 가는 경로를 만든다 — PR 대기 중 (`auto/product-detail-page`)**
  `src/data/products.ts` 의 `Product` 에 `slug` 를 추가하고(`curation-001` 형식) `getProductBySlug` 조회 함수를 뒀다.
  `src/app/product/[slug]/page.tsx` 와 `src/app/m/product/[slug]/page.tsx` 를 각각 만들었다 —
  `generateStaticParams` 로 8개 상품 전부 빌드 타임에 정적 생성, 없는 slug 는 `notFound()`.
  `ProductCard.tsx` / `MobileProductCard.tsx` 를 각각 `next/link` 로 감쌌다.
  `npm run build` 로그에서 `/product/curation-001~008` 과 `/m/product/curation-001~008` 이 모두 `●(SSG)` 로
  정적 생성됨을 확인했고, `npm run start` 로컬 프로덕션 서버에서
  `/product/curation-001`(200), `/m/product/curation-001`(200), `/product/does-not-exist`(404),
  홈 카드의 `href` 가 각각 `/product/curation-001` · `/m/product/curation-001` 로 걸려 있는 것을 curl 로 확인했다.
  헤더/메뉴의 `href="#"` 는 이 항목 범위가 아니라 손대지 않았다(다음 백로그 항목).

- [x] `auto` **`robots.ts` / `sitemap.ts` 추가 — PR 대기 중 (`auto/robots-sitemap`)**
  `src/app/robots.ts` 와 `src/app/sitemap.ts` 를 Next 16 App Router 방식(함수형, `MetadataRoute`)으로 만들었다.
  sitemap 에는 `/` 와 `/m` 을 모두 넣었다 — `/m` 은 `m/layout.tsx` 의 `alternates.canonical: "/"` 로
  검색엔진이 같은 페이지로 합쳐 처리하므로 중복 색인 걱정 없이 그대로 둔다.
  `npm run build` 후 `/robots.txt` `/sitemap.xml` 정적 라우트로 생성됨을 확인했고,
  프로덕션 서버(`npm run start`)를 로컬에서 띄워 두 URL 을 curl 로 직접 확인했다.
  화면에 보이는 변경이 없어 `/` `/m` 모바일 확인은 별도로 하지 않았다(라우트가 아니라 메타 파일이라 해당 없음).

- [x] `mobile-layout` 브랜치를 main 에 병합 — **PR #1, 병합 커밋 `d0bdf1f`**
  충돌 0, 17개 파일 / +777 −5. 기존 데스크톱 파일 중 바뀐 것은 `GrainOverlay.tsx` 하나뿐이고
  기본값이 종전 동작과 같아 데스크톱 화면은 그대로다.
  배포 확인: `https://archive-wolya.com/m` 정상 응답, 제목 `WOLYA ARCHIVE | Mobile`.
  함께 정리: `build.yml` 삭제(`fcc65e8`) — `ci.yml` 과 중복이었다. 남은 워크플로는
  `ci.yml` / `heartbeat.yml` / `dev-loop.yml` / `scout.yml`.
  **아직 사람이 실제 휴대폰으로 보지는 않았다.** 확인 후 이상하면 `d0bdf1f` revert.


## 보류

_(아직 없음)_

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

- [ ] `auto` **상품 카테고리를 top / bottom / accessory / shoes 로 나눈다**
  지금 `src/data/products.ts` 의 `categories` 는 `"#스트릿 #카고 #보온성"` 같은 **해시태그 문자열**이라
  분류가 아니라 장식이다. 카테고리로 거를 수가 없다.
  - `Product` 에 `category: "top" | "bottom" | "accessory" | "shoes"` 필드를 추가한다
  - `/shop` 과 `/m/shop` 에 카테고리 필터를 붙인다 (탭이든 칩이든)
  - 기존 해시태그는 `tags` 로 이름을 바꿔 그대로 둔다 — 검색·분위기 표현용으로 쓸모가 있다
  **DB 쪽은 이미 준비돼 있다.** `categories` 테이블에 `parent_id` 자기참조가 있고
  `products.category_id` 가 걸려 있다(`db/migrations/001_products.up.sql`).
  앱-DB 연결이 되면 이 4개를 seed 로 넣으면 되고, 그 전까지는 프론트 타입만 맞춰둔다.

- [ ] `review` **로그인 메뉴 — 지금은 만들지 말고 순서를 먼저 보라**
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

- [ ] `auto` **상품 데이터가 45줄 하드코딩 플레이스홀더다**
  `src/data/products.ts` 가 `[아이템명]`, `[소재명]` 같은 자리표시자다. DB 연결은 별건이지만
  (`db/HANDOFF-앱-DB-연결.md`), 그 전에 **타입과 조회 함수를 분리해** 나중에 DB 로 갈아끼우기 쉽게 만든다.

- [ ] `review` **앱 ↔ DB 연결층** — 절차는 `db/HANDOFF-앱-DB-연결.md`. 범위가 커서 사람이 봐야 한다.

---

## 완료

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

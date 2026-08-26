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

- [ ] `review` **비밀번호 재설정 (로그인 후속 — 이번 PR 범위 밖)**
  로그인 PR 이 회원가입·로그인·로그아웃·세션·내 정보(주소록)까지 만들었지만 **비밀번호
  재설정은 못 넣었다.** 막힌 이유가 코드가 아니라 경로다 — 재설정은 "본인 메일함으로
  일회용 링크를 보낸다" 가 전제인데 이 레포에는 **메일 발송 수단이 하나도 없다**
  (SMTP 설정도, 발송 라이브러리도 없고 새 라이브러리 설치는 금지다).
  지금은 로그인 화면이 카카오톡 채널로 문의하라고 안내한다.
  먼저 사람이 정할 것: 발송 채널(SES/Resend/카카오 알림톡 중 무엇인지)과 그 자격증명.
  정해지면 `password_reset_tokens` 테이블(토큰은 해시로 저장, 1회용, 30분 만료) +
  `/reset` `/m/reset` 짝을 만든다. 토큰 검증·소비는 조건부 UPDATE 로 — 조회 후 삭제는
  같은 링크를 두 번 쓸 수 있다.

- [ ] `review` **로그인 시 비회원 장바구니 병합 (주문 쪽 작업 — 인증 PR 이 일부러 안 건드림)**
  `carts.session_key`(비회원)와 `carts.user_id`(회원)가 나뉘어 있어서, 담아둔 채로
  로그인하면 세션 장바구니를 회원 장바구니로 옮기고 세션 쪽을 지워야 한다(`db/README.md`
  3단계 요점). 이건 장바구니 스키마를 아는 쪽이 해야 해서 인증 PR 은 손대지 않았다 —
  붙일 자리는 `src/lib/auth/actions.ts` 의 `loginAction`·소셜 콜백에서 세션을 만든 직후다.

- [ ] `review` **이메일 변경 (내 정보에서 지금은 못 바꾼다)**
  내 정보는 이름·휴대폰·마케팅 수신만 고칠 수 있다. 이메일은 소셜 계정 연결과 주문 조회가
  걸려 있어 본인확인 없이 바꾸면 계정을 넘겨줄 수 있다 — 비밀번호 재설정과 같은 메일 발송
  경로가 생긴 뒤에 같이 만든다.


- [ ] `review` **A2 — 원장 폴백 걷어내기 (A1 후속, 운영 DB 확인이 선행)**
  A1 은 DB 가 비었거나 안 읽히면 `src/data/products.ts` 원장으로 폴백한다. 그래서 마이그레이션
  적용 전에 배포돼도 사이트가 비지 않는다. **운영 DB 에 008·009 가 적용되고 37건이 보이는 것을
  사람이 확인한 뒤** 폴백과 원장 배열을 같이 걷어낸다. 확인 전에 걷어내면 안전망이 사라진다.
  선행 조건: 관리자 상품 등록 화면(아래) — 원장을 지우면 상품을 넣을 창구가 없어진다.
  > 2026-08-26 dev-loop (이번 실행, 사람이 직접 지정): 착수 전 확인 결과 이 항목 원문의 두 선행
  > 조건이 모두 이번 실행에서 충족 불가능하다. (1) "운영 DB 에 008·009 적용 확인"은 이 세션이
  > GitHub Actions 러너라 `DATABASE_URL`·SSH 모두 없어 구조적으로 검증 불가(`ssh wolya` 는
  > 호스트 이름 해석조차 안 됨) — 노트북 세션에서만 가능하다. (2) 관리자 상품 등록 화면이 아직
  > 없다(별도 `review` 항목, 미착수) — 걷어내면 상품 등록 창구가 사라진다. 두 선행 조건 중
  > 하나라도 안 풀리면 폴백을 걷어내는 코드 변경 자체가 안전하지 않아 시도하지 않았다.
  > 코드 변경 없음, PR 없이 종료. 다음 실행이 같은 조사를 반복하지 않도록 여기 남긴다.

- [ ] `review` **품절 판정을 DB 로 직접 반영 (A1 이 남긴 구조적 빈틈)**
  원본 매물 생존 체크(`source-watch.yml`, 3시간마다)는 GitHub Actions 에서 돌고,
  운영 DB 는 `listen_addresses=localhost` 라 **Actions 에서 DB 에 닿을 수 없다.**
  그래서 지금은 그 판정이 `src/data/products.ts` 의 `status` 를 고쳐 커밋하고,
  `src/lib/products.ts` 가 DB 결과 위에 덮어쓰는 방식으로 화면에 반영된다(배포 필요).
  제대로 하려면 판정 결과를 서버가 DB 에 반영하는 경로가 필요하다 — `ops/` 를 건드리므로
  자동화가 아니라 사람이 설계할 일이다. A2 는 이 항목이 끝나야 안전하다.

- [ ] `review` **입금 확인 → 주문 상태 진행 절차 (무통장 주문의 나머지 절반)**
  주문은 `pending` + `payments.status='ready'` 로 시작한다. 통장에 돈이 들어온 것을 **사람이
  확인해서** 결제 완료로 올려야 하는데 그 창구가 아직 없다. 004 의 `payments_paid_needs_proof`
  CHECK 가 `status='paid'` 로 올릴 때 `pg_transaction_id` 와 `paid_at` 을 요구하므로,
  입금 건 식별자(은행 거래고유번호 등)를 그때 채워야 한다. 상태를 바꾸는 트랜잭션에서는
  `SET LOCAL wolya.actor = 'admin'` 을 먼저 실행한다(이력에 누가 바꿨는지 남는다).
  기한 초과 미입금 주문 조회는 `010` 의 `idx_payments_deposit_due` 가 받쳐 준다.
  **취소 시 재고 복원**(`stock_quantity` 증가)과 예약주문 자리 해제도 이 절차의 일부다 —
  주문 상태를 `cancelled` 로 두면 예약 자리는 자동으로 풀린다(`SQL_PREORDER_ALREADY_RESERVED`
  가 `cancelled`/`refunded` 를 제외한다). 관리자 화면을 만들지, psql 절차로 버틸지가 먼저다.

- [ ] `review` **전역 내비게이션에 장바구니·주문조회 진입점**
  지금 `/cart` 는 상세페이지에서 담은 뒤에 뜨는 링크와 직접 URL 로만 닿고, `/order-lookup` 은
  장바구니·주문 완료 화면에서만 닿는다. 헤더·푸터(`SiteFooter.tsx`, `MobileHeader.tsx`,
  `MobileFooter.tsx`)에 진입점이 필요하다. **이번 주문 작업에서 일부러 건드리지 않았다** —
  같은 파일을 로그인 메뉴 작업이 만지고 있어 충돌이 뻔했다. 로그인 메뉴가 정해진 뒤에 같이 넣는다.

- [ ] `review` **배송비 정책 확정 (지금은 정액 3,500원)**
  `src/lib/orders/shared.ts` 의 `SHIPPING_FEE` 상수 하나다. 무료배송 기준선은 프로모션 결정이라
  (AGENTS.md 4절) 자동화가 넣지 않았다. 기준선을 두려면 `calcShippingFee()` 한 곳만 고치면
  화면과 주문 양쪽이 같이 바뀐다. 제주·도서산간 추가 배송비도 같은 함수 자리다.

- [ ] `review` **PG 연동 — 결제 수단 두 번째 구현체**
  `src/lib/payment/provider.ts` 의 `PaymentProvider` 를 하나 더 구현하고 `PROVIDERS` 에 등록하면
  주문 생성 코드(`checkout.ts`)는 고치지 않는다. 웹훅은 provider 별로 따로 만들고
  **`payments.pg_transaction_id` UNIQUE 를 멱등 키로** 쓴다 — 중복 웹훅은 200 "이미 처리됨"
  (불변규칙 5). 004 의 `pg_provider` CHECK 목록에 새 값이 있는지 먼저 확인한다.

- [ ] `review` **관리자 상품 등록 화면 — A1 이후 상품을 넣을 창구가 없다**
  A1 전에는 `src/data/products.ts` 에 항목을 추가하면 그게 곧 등록이었다(개발 루프가 그렇게 했다).
  A1 이후 화면의 정본은 DB 라, 원장에만 추가하면 폴백이 걷힌 뒤에는 사이트에 안 나온다.
  당분간은 `scripts/gen_seed_sql.mjs` 로 시드 SQL 을 만들어 사람이 적용하는 방식으로 버틴다.

### P1 — 유입을 못 받는 원인 (인스타 전략에 직결)

_(현재 없음)_

### P2 — 구조·성능

- [ ] `review` **빌드를 서버에서 하지 않는다**
  지금 `ops/auto_deploy.sh` 는 Lightsail(2GB, Postgres·Next·PM2 공용)에서 `npm ci` + `next build` 를 돈다.
  실제로 메모리 때문에 `--max-old-space-size=1536` 을 걸어야 했고 첫 배포도 빌드 단계에서 실패했다.
  **GitHub Actions 에서 빌드해 산출물을 서버로 보내고, 서버는 PM2 재시작만** 하게 바꾼다.
  개발 자동화가 돌기 시작하면 배포 빈도가 올라가므로 이 항목의 가치가 커진다.

---

## 완료

### 2026-08-26

- [x] `review` **무통장 입금 기반 비회원 주문·결제 플로우 (클라우드 세션, 사람이 직접 지정) — PR #30, 2026-08-26**
  장바구니(비회원 세션키) → 주문서 → 주문번호 발급 → 무통장 입금 안내 → 주문조회까지
  **로그인 없이 전 구간**이 돈다. PG 계약·심사 전이라 결제 수단은 `payments.pg_provider='manual'`
  하나이고, 나중에 provider 만 갈아끼울 수 있도록 `src/lib/payment/provider.ts` 로 추상화했다
  (무통장이 그 첫 구현체 `manual.ts`).
  새 라우트는 **`/` 와 `/m` 짝을 전부 만들었다** — `/cart` `/checkout` `/order/[orderNo]`
  `/order-lookup` 과 `/m/…` 네 쌍, 전부 `force-dynamic`. API(`/api/cart`, `/api/orders`,
  `/api/orders/lookup`)는 화면 둘이 같이 쓴다(`src/proxy.ts` matcher 가 `/api` 를 제외한다).
  불변규칙 이행: 금액은 전부 `INTEGER` 원 단위이고 **서버가 DB 가격으로 재계산**한다
  (클라이언트가 보낸 `expectedTotal` 은 "화면 금액과 지금 금액이 다른가" 대조에만 쓰고 저장하지 않는다).
  재고 차감은 조건부 UPDATE 한 방(`SQL_DEDUCT_STOCK`), 영향 행 0이면 주문 전체 롤백.
  주문서는 상품명·옵션·단가·배송지 전부 스냅샷. 동의는 boolean 이 아니라 시각
  (`orders.terms_agreed_at` / `privacy_agreed_at`, 마이그레이션 010).
  SQL 은 전부 파라미터 바인딩, ORM 없음.
  **무재고 예약주문 27건**: `is_preorder` 인 항목은 재고 차감을 건너뛰어 주문을 받고 안내 문구를
  달리 그린다(재고 0을 품절로 막으면 팔 물건이 3개만 남는다). 대신 단벌이라 중복 예약을 막으려고
  `pg_advisory_xact_lock` 으로 옵션별 자리를 잡고 살아 있는 주문의 예약 여부를 본다.
  주문 조회는 **주문번호 + 휴대폰번호**다. 주문 완료 화면도 같은 규칙을 지킨다 —
  주문번호만 아는 사람에게는 열리지 않고(httpOnly 쿠키에 주문번호 + 휴대폰 **해시**를 담아
  본인 확인), 조회 API 는 IP 당 10분 10회로 막았다.
  마이그레이션 `010_manual_payment_orders`(up/down/verify) 추가 — 전부 `ADD COLUMN IF NOT EXISTS`
  / `CREATE INDEX IF NOT EXISTS`, 파괴적 구문 없음. **운영 적용은 사람이 한다**(PR 본문에 명령 그대로).
  로컬 PostgreSQL 16 에 001~010 을 적용해 실제로 돌려 확인한 것: 정상 주문 1건 생성(재고 1→0,
  장바구니 비워짐, 결제 `manual`/`transfer`/`ready`, 상태 이력 `customer` 기록), 금액 위조
  (`expectedTotal` 1000원) 거부, 동의 누락 거부, **같은 재고 1개에 3세션 동시 주문 → 1건만 성공·
  재고 0(음수 없음)**, **같은 예약주문에 3세션 동시 → 1건만 성공**, 조회 오답 404·정답 200·
  11회째 429, 쿠키 없는 세션에서 주문 상세 비공개 확인. `DATABASE_URL` 없이 빌드 통과 및
  전 라우트 200(장바구니는 "사용할 수 없습니다" 안내, 상세페이지는 종전대로 카카오톡 문의만),
  상품 0건 DB 에서도 전 라우트 200.
  실제 브라우저(휴대폰 포함)로는 보지 않았다 — curl·정적 HTML·DB 검증까지만 했다.
  인증·세션 관련 파일은 건드리지 않았다(로그인 세션과 병행 작업 중).

- [x] `review` **로그인 기능 (사람이 직접 지정) — PR #31, 2026-08-26**
  회원가입·로그인·로그아웃·세션 유지·내 정보(주소록)까지. `/login` `/signup` `/account` 와
  `/m/login` `/m/signup` `/m/account` 를 **짝으로** 만들었고 헤더 메뉴(데스크톱 `ContentPanel`,
  모바일 `MobileHeader`)와 양쪽 푸터에 진입점을 넣었다.
  아래 원문의 "지금 만들면 버려질 코드" 라는 전제는 **A1(#27) 병합으로 풀렸다** — 앱이
  DB 를 읽게 됐고 `pg` 도 들어와 있다. 다만 원문의 다른 판단("로그인 없이도 팔 수 있다")은
  그대로 지켰다: **구매 경로 어디에도 로그인 벽을 세우지 않았다.** `/account` 만 로그인을
  요구하고 공개 라우트 14개는 비로그인으로 전부 200 이다.
  비밀번호는 새 라이브러리 없이 **Node 내장 crypto 의 scrypt**(계정마다 다른 솔트,
  `timingSafeEqual` 비교). 세션은 난수 토큰을 쿠키(httpOnly·secure·sameSite=lax)에 두고
  DB 에는 SHA-256 만 저장해 로그아웃이 서버 쪽에서 실제로 죽인다. 로그인 시도에는
  이메일·IP 두 축의 속도 제한이 걸린다. 소셜(카카오·네이버·구글)은 코드까지 다 있고
  **앱 키가 없으면 버튼이 안 보인다** — 사람이 `.env.local` 을 채우고 재시작하면 코드 수정
  없이 켜진다(등록 항목은 PR 본문 인수인계 목록).
  마이그레이션 `011_auth_sessions` 추가(파괴적 구문 없음·멱등) — **운영 적용은 사람이 한다.**
  못 넣은 것: 비밀번호 재설정(메일 발송 수단이 없다), 장바구니 병합, 이메일 변경 — 셋 다
  위 "할 일" 에 항목으로 남겼다.

  <details><summary>원래 항목 원문 (지우지 않는다)</summary>

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
    > 2026-08-24 dev-loop: 재확인, 변동 없음. 열린 `auto/` PR 1건(#17, 원본 매물 생존 체크 —
    > 이 항목 자체를 다루는 PR 이라 오늘은 건드리지 않고 그대로 둠). `package.json` 에 `pg` 는
    > 설치돼 있으나(A0, `cda2889`) `src/app`·`src/components` 의 `product-queries`/`lib/db` import 는
    > 여전히 0건 — 화면은 아직 DB 를 안 쓴다. 이 항목의 전제("앱이 DB 를 전혀 안 쓴다")는 그대로 유효.
    > P2 두 항목도 재확인: "서버에서 빌드 안 함" 은 단순 리팩터가 아니다 — `ops/auto_deploy.sh` 상단
    > 주석이 지금의 pull 방식(서버가 스스로 당겨와 빌드)을 고른 이유를 명시한다("GitHub 에 서버 SSH 키를
    > 저장하지 않아도 된다", "킬스위치 한 곳으로 확실히 멈출 수 있다"). Actions 가 push 하는 방식으로
    > 바꾸면 이 보안 판단을 뒤집는 것이라 무인 자동화가 결정할 범위가 아니다. "앱↔DB 연결층 A1" 은
    > 이 항목 원문 그대로 사람 확인 3가지가 남아 있어 여전히 범위 밖. 실행 가능한 항목 없어 PR 없이 종료.
    > 2026-08-25 dev-loop: 재확인, 변동 없음. 열린 `auto/` PR 0건. `src/app`·`src/components` 의
    > `product-queries`/`lib/db` import 는 여전히 0건, `package.json` dependencies 도 `next`/`pg`/
    > `react`/`react-dom` 그대로 — A1 은 여전히 사람 확인 3가지가 막고 있다. P2 "서버에서 빌드 안 함"
    > 은 `.github/workflows/` 변경이 필요한데, 같은 이유(GitHub App 토큰에 `workflows` 권한 없음)로
    > 지난 회차(source-watch, #17 계열) 자동화 시도가 두 번 구조적으로 실패한 전례가 있어 이번에도
    > 시도하지 않았다. 실행 가능한 항목 없어 PR 없이 종료.
    > 2026-08-25 dev-loop (2): 같은 날 재확인, 변동 없음. 열린 `auto/` PR 0건(`gh pr list` 0건 —
    > 오늘 있던 매물 후보 5건 등록·모바일 푸터 아이콘 PR 은 이미 병합됐고 둘 다 사람이 이번 실행에
    > 직접 지정한 항목이라 BACKLOG "## 할 일" 큐 소진과는 무관). `src/app`·`src/components` 의
    > `product-queries`/`lib/db` import 는 여전히 0건, `package.json` dependencies 도 `next`/`pg`/
    > `react`/`react-dom` 그대로 — A1 은 여전히 사람 확인 3가지가 막고 있다. P2 "서버에서 빌드 안 함"
    > 도 `.github/workflows/` 금지 경로 그대로. 실행 가능한 항목 없어 PR 없이 종료.
    > 2026-08-25 dev-loop (3): 사람이 이번 실행에 "앱↔DB 연결층"을 직접 지정해 P2 항목을 순서를
    > 건너뛰고 먼저 조사했다 — 구현을 시도했으나 착수 전 확인만으로 **이번 세션에서 완료 불가능한
    > 새로운 구체적 근거 3가지**를 확인해 코드 변경 없이 멈췄다.
    > (1) `.github/workflows/` 어디에도 `DATABASE_URL` 이 없다(`grep -rn DATABASE_URL
    > .github/workflows/` 결과 0건). `src/data/products.ts` 를 DB 조회로 바꾸면 상세페이지
    > `generateStaticParams`(빌드타임 SSG)가 DB 접속을 시도하는데, PR 을 열면 도는 CI(`npm run
    > build`)엔 이 값이 없다 — 즉 지금 구조 그대로 스위치를 넘기면 **이 dev-loop 가 완료 기준으로
    > 요구하는 `npm run build` 통과 자체가 CI 에서 구조적으로 불가능**하다. 이 문제를 풀려면
    > 상세페이지를 SSG 에서 런타임 동적 렌더링으로 바꾸거나(운영 서버는 로컬 DB 접속이 되므로
    > 이 경로는 가능) GitHub Actions 에 운영 DB 접속 경로를 새로 열어야 하는데 후자는 `listen_
    > addresses=localhost` 를 깨는 보안 판단이라 무인 자동화가 결정할 범위가 아니다.
    > (2) 이 Claude Code 세션 자체에 `DATABASE_URL` 도 로컬 DB 도 없다(env 확인·`~/.ssh/config`
    > 확인 둘 다 비어 있음) — 코드를 바꿔도 이번 세션에서 로컬로 실제 조회 결과를 확인할 방법이
    > 없다. `db/HANDOFF-앱-DB-연결.md` 완료 기준 2번("로컬에서 실제 DB 상품이 뜬다")을 이 세션은
    > 원천적으로 만족시킬 수 없다.
    > (3) `src/lib/product-queries.ts` 의 `mapRow` 를 다시 읽었다 — `status` 를 항상 `"available"`
    > 로 고정하고 `note`/`sourceUrl` 은 아예 매핑하지 않는다(006/007 마이그레이션에 해당 컬럼이
    > 없음). 지금 `products.ts` 는 37건 중 10건이 `preorder`/`sold`(그중 5건은 `note` 판매자
    > 고지 포함)다. 게다가 `007_seed_initial_products.up.sql` 은 최초 3건만 시드한다 — DB 에
    > 실제로 몇 건이 들어있든 지금 매퍼로 화면을 그대로 전환하면 예약주문·품절·판매자 고지 표시가
    > 전부 사라지고 상품 수도 37→3 근처로 급감한다. "상품 0건일 때 안 깨지는지" 가 아니라
    > "34건이 소리 없이 사라지는" 훨씬 심각한 회귀다 — 사람이 데이터 이관 계획(컬럼 추가 또는
    > 마이그레이션 확장)을 먼저 정해야 코드를 안전하게 짤 수 있다.
    > 위 세 가지는 모두 "범위가 커서 사람이 봐야 한다"는 기존 메모보다 한 단계 더 구체적인,
    > 이번에 새로 확인한 차단 사유다. `db/HANDOFF-앱-DB-연결.md` 에 (1)·(3) 을 반영해 다음
    > 시도가 같은 조사를 반복하지 않게 해야 한다(이번 실행 범위 밖이라 문서 자체는 고치지 않음).
    > 코드·문서(BACKLOG 제외) 변경 없음, PR 없이 종료.
    > 2026-08-25 dev-loop (4): 열린 PR 확인 결과 `auto/` 는 아니지만 클라우드 세션이 연 PR #27
    > (`claude/a1-app-db-connection-e70l9y`, "A1 — 화면이 DB 를 읽는다")이 정확히 이 항목(P2 의
    > 앱↔DB 연결층 A1)을 이미 구현해 열어둔 상태다 — 006~009 마이그레이션, DB 실패 시 원장
    > 폴백, 6개 상품 라우트 동적 렌더링 전환까지 포함하고 `NEEDS-REVIEW`(금지 경로 2곳 포함)로
    > 스스로 표시돼 있다. 같은 작업을 중복하지 않으려 건너뛰었다. 이게 병합돼도 로그인 메뉴는
    > 여전히 순서상 비회원 주문·결제가 먼저라 이 항목 자체는 안 풀린다. P2 "서버에서 빌드 안 함"
    > 도 `.github/workflows/` 금지 경로 그대로. 실행 가능한 항목 없어 PR 없이 종료.
    > 2026-08-26 dev-loop: 재확인, 변동 없음. 열린 PR `#27`(`claude/a1-app-db-connection-e70l9y`,
    > A1 앱↔DB 연결층) 그대로 열려 있음 — 이 항목이 다루는 바로 그 작업이라 건너뛰었다.
    > `package.json` dependencies 는 `next`/`pg`/`react`/`react-dom` 그대로, `src/app`·`src/components`
    > 의 `product-queries`/`lib/db` import 는 여전히 0건(PR #27 이 아직 main 에 병합되지 않았다는 뜻),
    > `.github/workflows/` 에 `DATABASE_URL` 도 여전히 0건. P2 "서버에서 빌드 안 함" 도
    > `.github/workflows/` 금지 경로 그대로. 실행 가능한 항목 없어 PR 없이 종료.
    `users` / `user_social_accounts` / `user_addresses` 테이블은 이미 있다(002). 이메일 + 소셜(카카오·네이버·구글) 설계다.
    **그런데 지금 만들면 버려질 코드가 된다.** 앱이 DB 를 전혀 안 쓰고 있어서
    (`package.json` 에 PostgreSQL 클라이언트조차 없다) 인증만 먼저 붙일 수가 없다.
    또한 **비회원 주문이 이미 설계에 들어 있다** — `carts.session_key`, `orders.user_id` NULL 허용,
    주문조회는 주문번호+휴대폰. **로그인 없이도 팔 수 있다는 뜻이다.**
    올바른 순서: 앱↔DB 연결 → 상품 등록 → 비회원 주문·결제 → **그다음** 로그인.
    > 2026-08-26: 이 순서 중 **비회원 주문·결제(무통장)까지 끝났다**(위 완료 항목 #30). 이제 로그인은
    > "없으면 못 파는 것" 이 아니라 "있으면 편한 것" 이다 — 세션 장바구니(`carts.session_key`)를
    > 회원 장바구니로 옮기는 병합 로직이 로그인 작업의 범위에 포함된다(003 주석).
    >
    > 2026-08-26 (로그인 PR #31): 위 메모대로 로그인을 "편한 것" 으로 만들었다. 다만 **장바구니 병합은
    > 넣지 않았다** — 장바구니 스키마는 #30 이 같은 시각에 만들고 있어서 건드리면 충돌한다.
    > 별도 항목으로 "할 일" 에 올렸다.
    인증은 비밀번호 해싱·세션·소셜 OAuth 가 얽혀서 무인 자동화에 맡길 영역이 아니다. 사람이 설계하고 검수한다.

  </details>

- [x] `auto` **솔드아웃 상품을 목록에서 감추지 말고 SOLD OUT 으로 표시 (사람이 직접 지정)**
  지시문은 "지금 `/shop`·`/m/shop` 은 `listListedProducts()` 를 써서 판매완료 상품이
  통째로 빠진다" 는 전제였는데, 착수해 보니 바로 전 커밋(#28, Shop↔Archive 역할 맞바꿈)으로
  이미 사실이 아니었다 — `/shop``/m/shop` 은 `listShopProducts()`(채널 `shop` 필터)를 쓰고
  지금 실물 재고 37건은 전부 채널 `archive` 라 `/archive``/m/archive` 의 `listArchiveProducts()`
  가 실제로 sold 를 숨기고 있었다(`listShopProducts` 는 이미 존재하는 이름이라 그대로 새로
  만들면 기존 채널 필터 함수와 충돌하기도 했다). 그래서 지시문의 실제 의도(판매완료를
  목록에서 감추지 말 것)를 두 목록 함수 모두에 반영했다 — `listArchiveProducts`·
  `listShopProducts` 를 `listListedProducts`(sold 제외) 대신 `listProducts`(전체) 기반으로
  바꾸고, 새 `sortSoldLast()` 로 판매중(available·preorder)을 앞, sold 를 뒤로 안정
  정렬했다(각 그룹 내부 순서 유지). 홈 코디 슬라이드(`listOutfitRows`, `/` `/m`)는 여전히
  `listListedProducts` 를 쓰므로 sold 는 그대로 0건이다 — 지시문의 "첫인상 영역엔 솔드아웃을
  넣지 않는다" 는 그대로 지켜졌다.
  `ProductCard.tsx`(데스크톱)·`MobileProductCard.tsx`(모바일) 양쪽에 기존 예약주문 배지와
  같은 자리·같은 톤(`border-accent`/`text-accent`)으로 "SOLD OUT" 배지를 추가하고, 상품
  이미지 필터를 `grayscale(90%)_contrast(1.05)_brightness(0.55)`(기존 판매중 상품은
  `grayscale(30%)_contrast(1.1)_brightness(0.85)` 그대로)로 갈아끼워 확실히 죽어 보이게 했다.
  카드 링크는 그대로 살려뒀다 — 인스타에 올라간 링크가 죽지 않는다.
  필터 탭은 새로 만들지 않았다(기존 상의/하의/액세서리/신발 4개 그대로, `전체` 포함 grep 확인).
  상세페이지(`/product/[slug]``/m/product/[slug]`)는 손대지 않았다.
  `db/migrations/`·`ops/`·`.github/workflows/`·`AGENTS.md`·`next.config.ts`·결제/주문 코드·
  `package.json` 의존성 어느 것도 건드리지 않았다.
  `npm run lint && npm run build` 통과(기존 `DesktopViewLink.tsx` 무관 warning 1개만 남음),
  여섯 상품 라우트 전부 `ƒ (Dynamic)` 유지 확인.
  `npm run start` 로컬 프로덕션 서버에서 확인한 것: `/archive`·`/m/archive` 양쪽 다 상품 링크
  37개(sold 7건 포함 전량)·"SOLD OUT" 배지 7개·grayscale(90%) 필터 7개 등장, sold 7건이 모두
  판매중 30건 뒤로 정렬됨(스크립트로 순서 검증), `/shop`·`/m/shop` 은 지금도 채널 `shop`
  상품이 0건이라 "새 재고 준비 중" 안내만 그대로(변경으로 인한 부작용 없음 확인), 홈 `/`·`/m`
  에는 "SOLD OUT" 문자열 0건, sold 상품 상세페이지(`levis-504-selvedge-32`) curl 200 유지.
  실제 브라우저(휴대폰 포함)로는 보지 않았다 — curl·정적 HTML 검증까지만 했다.

### 2026-08-25

- [x] `review` **앱 ↔ DB 연결층 A1 — 화면이 DB 를 읽는다 (클라우드 세션, 사람이 직접 지정)**
  `src/app`·`src/components` 가 `src/data/products.ts` 하드코딩 대신 `src/lib/products.ts`
  조회 계층을 쓴다. 바뀐 라우트는 `/` `/m` `/shop` `/m/shop` `/product/[slug]` `/m/product/[slug]`
  여섯 개 전부(데스크톱·모바일 짝 유지). 상품 라우트는 전부 `force-dynamic` 으로 돌린다 —
  빌드 때 굳히면 1점 1재고 품절이 다음 배포까지 안 반영되고, DB 없는 CI 빌드에서는 빈 결과가
  HTML 에 박제된다. 빌드 산출물의 라우트 표에서 여섯 개가 전부 `ƒ (Dynamic)` 인 것을 확인했다.
  DB 가 비었거나 안 읽히면 원장으로 폴백하므로 마이그레이션 적용 전에 배포돼도 사이트가 비지 않는다.
  마이그레이션 008(short_measure·seller_note·is_preorder)·009(원장 37건 전량 시드)를 같이 낸다 —
  **배포 전에 사람이 적용해야 한다.** 후속은 위 A2·품절 반영·관리자 화면 3건.
  아래는 이 항목이 "## 할 일" 에 있던 원문이다(지우지 않고 옮김):

  - [ ] `review` **앱 ↔ DB 연결층 — A1(마지막 단계)만 남음.**
    A0(읽기 연결층: `pg` 설치, `src/lib/db.ts`, `src/lib/product-queries.ts`, 마이그레이션 006·007)는
    2026-08-23 이미 병합됐다(`cda2889`). 그런데 `src/app`·`src/components` 어디서도 이 계층을
    import 하지 않는다(전체 검색 0건) — 화면은 여전히 `src/data/products.ts` 하드코딩을 쓴다.
    절차는 `db/HANDOFF-앱-DB-연결.md`. **여전히 범위가 커서 사람이 봐야 한다** — 라이브 커머스
    사이트의 상품 데이터 소스를 바꾸는 일이라 (1) 007 시드가 실제 운영 DB에 적용됐는지,
    (2) 빌드 타임 SSG(`generateStaticParams`)가 DB 접속 가능한 환경(GitHub Actions CI)에서
    도는지, (3) 상품 0건일 때 빈 상태가 안 깨지는지 세 가지를 사람이 직접 확인해야 안전하다.
    (과거 dev-loop 메모 중 "`package.json` 에 PostgreSQL 클라이언트가 없어 막힌다"는 표현은
    이제 사실이 아니다 — `pg` 는 이미 있다. 막힌 이유는 새 라이브러리 설치 금지가 아니라 위 세 가지다.)

- [x] `auto` **매물 후보 5건을 상품으로 등록 — `docs/2026-08-25-candidates-5.json`**
  사람이 이번 실행에 직접 지정한 항목. JSON 5건(id 33~37)을 `src/data/products.ts` 의
  `products` 배열에 그대로 추가했다(기존 32건은 손대지 않음, `Product` 타입 변경 없음).
  `image`/`images` 의 `@IMG@` 는 파일 상단 `IMG` 상수를 쓰는 템플릿 리터럴로 옮겼다.
  지시대로 `sourcePrice`·`sourceUrl` 두 값은 `products.ts` 에 넣지 않고 서버 전용 모듈
  `src/data/product-sourcing.ts` 의 `productSourcing` 맵에 slug 키로만 추가했다(기존 5건
  분량 그대로 이어붙임, JSON 의 실제 값 그대로 — 지어내지 않음). 배열 삽입 위치는 기존
  id 32(꼼데가르송 포켓 팬츠) 바로 뒤, id 순서(1~37)가 끊기지 않게 정리했다.
  전 5건 `status: "preorder"` — 데스크톱·모바일 상세페이지에 기존 예약주문 배지·고정 문구가
  그대로 적용됨을 확인했다. 하의 3(리바이스 501 빅E, 칼하트 싱글니 카펜터, 폴로 치노) /
  상의 2(폴로 코듀로이 블레이저, 파타고니아 레트로X)라 홈 코디 교차 슬라이드 조건
  (`OUTFIT_ROW_MIN_ITEMS`=2)에 영향 없음.
  `note` 5건 전부 상세페이지 하단 "판매자 고지" 로 그대로 노출되는 것을 확인했다 — 33번
  (리바이스 501, 허리 새깅 리폼 이력), 35·36번(폴로 치노·블레이저, 라벨 미확인 경고)
  포함 전부 텍스트가 빠지지 않고 나옴.
  `db/migrations/`·`ops/`·`.github/workflows/`·`AGENTS.md`·`next.config.ts`·결제/주문 코드·
  `package.json` 의존성 어느 것도 건드리지 않았다.
  `npm run lint && npm run build` 통과 — 99개 라우트, 37개 상품 `/product/[slug]`
  `/m/product/[slug]` 전부 정적 생성 확인(빌드 로그 "+34 more paths", 기존 3 + 34 = 37).
  `npm run start` 로컬 프로덕션 서버에서 확인한 것: `/shop`·`/m/shop` HTML 양쪽에서
  `sourcePrice`·`sourceUrl`·`fruitsfamily.com/product` 문자열이 **0건**(grep 카운트 0),
  두 목록 페이지 HTML에 신규 5건 slug 가 전부 등장, 5건의 상세페이지가 desktop `/product/*`·
  mobile `/m/product/*` 양쪽 모두 curl 200, 홈(`/`)의 `outfit-row-top`/`outfit-row-bottom`
  구간이 그대로 유지되는 것도 확인했다. 실제 브라우저(휴대폰 포함)로는 보지 않았다 —
  curl·정적 HTML 검증까지만 했다.

### 2026-08-24 (2)

- [x] `review` **원본 매물 생존 체크 (2/2) — 3시간 간격 자동 실행 (`.github/workflows/source-watch.yml`)**
  dev-loop 이 두 번 시도했지만 **GitHub App 토큰에 `workflows` 권한이 없어 구조적으로 불가능했다**
  (`refusing to allow a GitHub App to create or update workflow`). 사람 세션(브라우저)에서 직접 만들어 커밋했다.
  `bdc9277`. 앞으로도 `.github/workflows/` 변경은 dev-loop 에 맡기지 말 것 — 시도 자체가 실패한다.
  - cron `30 */3 * * *` — 3시간 간격. KST 09:30/12:30/15:30/18:30/21:30/00:30/03:30/06:30.
    UTC 30분에 걸어 dev-loop(UTC 18/2/10 정각)와 겹치지 않게 했다. `concurrency` 로 중복 실행도 막는다.
  - `killswitch` 잡이 `ops/automation.json` 의 `enabled` 를 먼저 읽는다. 꺼져 있으면 no-op.
  - `node --experimental-strip-types scripts/check-source-availability.mjs --write` 실행 →
    `src/data/products.ts` 에 변경이 있을 때만 커밋한다(`git diff --quiet` 가드). 빈 커밋 안 만든다.
  - 안전밸브는 스크립트가 담당한다 — dead 40% 초과 시 아무것도 쓰지 않고 `exitCode 1`,
    그러면 이 스텝이 실패하고 커밋 스텝은 아예 돌지 않는다.
  - **검증(첫 수동 실행 #1, 1m 9s, 성공)**: 킬스위치 통과 → 체크 51s → `바뀐 매물 없음 — 커밋하지 않습니다`.
    직전에 7건이 이미 `sold` 로 반영돼 있어 no-op 이 정답이었다. 프로덕션 재확인: `/shop` 카드 25개
    (32 − sold 7), 예약주문 배지 22개, sold 상품 상세는 200 + 판매완료 표시 유지.
  - 원가 변동은 로그로만 남는다. 자동으로 판매가를 바꾸지 않는다 — 마진 판단은 사람 몫.

### 2026-08-24 (3)

- [x] `auto` **원본 매물 생존 체크 (1/2) — 판정을 meta 태그로 바꾸고 `sold` 상태를 만듦**
  `scripts/check-source-availability.mjs` 의 판정 함수를 백로그에 적힌 표대로 완전히 새로 짰다 —
  `<meta property="product:availability" content="in stock|out of stock">`, 본문의
  `숨김 처리된 상품입니다`/`해당 상품이 존재하지 않습니다`, HTTP 404 다섯 신호로 alive/dead/unknown
  세 갈래만 판정한다. 기존 `is_visible`/`status` JSON 조각 파싱은 완전히 버렸다.
  **표에 적힌 정규식(`<meta property="..." content="...">`)을 그대로 쓰면 실제로는 안 걸렸다** —
  실측해보니 실제 마크업이 `<meta data-rh="true" property="..." content="...">` 로 `data-rh` 속성이
  중간에 끼어 있어 태그 시작(`<meta `)에 앵커링하는 정규식은 전부 놓쳤다(첫 dry-run에서 29건 중
  27건이 unknown으로 나와 발견함). `<meta ` 앵커를 버리고 `property="..." content="..."` 부분만
  매칭하도록 고쳐서 해결 — 이후 실행은 alive 22 / dead 7 / unknown 0 으로, 사람이 직접 확인해
  백로그에 적어둔 "29건 중 7건이 죽어 있었다" 와 정확히 일치했다.
  `--dry-run`(기본, 아무 플래그 없이) / `--write` 플래그를 만들었다(이전엔 `--json` 만 있었다).
  안전밸브(dead 40% 초과 시 아무것도 안 쓰고 비정상 종료)를 추가했다 — 이번 실행은 24%(7/29)라
  걸리지 않았다.
  `Product.status` 에 `"sold"` 를 추가하고 `src/data/products.ts` 에 `listedProducts`
  (status가 sold 가 아닌 것만) export 를 새로 만들어 `/shop` `/m/shop` 페이지와 홈 코디 슬라이드
  (`tops`/`bottoms`)가 이걸 쓰도록 바꿨다 — sold 상품은 목록·슬라이드에서 빠진다.
  상세 페이지(`/product/[slug]` `/m/product/[slug]`)는 `getProductBySlug` 가 전체 `products` 를
  그대로 쓰므로 sold 여도 404 가 아니다 — 태그 옆 "판매완료" 배지, "구매 문의" 버튼 대신 비활성
  "판매완료" 표시, CTA 아래 "판매완료된 상품입니다. 같은 옷은 1점만 있어 재입고되지 않습니다."
  고지문을 데스크톱·모바일 양쪽에 추가했다.
  `--write` 로 실제 실행해 7건의 status 를 `sold` 로 바꿨다 — `carhartt-duck-active-jacket-usa-l`
  (품절), `patagonia-synchilla-fleece-navy-m`(품절), `patagonia-micro-d-hoodie-xl`(삭제됨,
  soft-404), `patagonia-reversible-fleece-l`(판매자 숨김), `american-vintage-plaid-flannel-os`
  (품절), `levis-501-90s-usa-32-32`(품절), `levis-504-selvedge-32`(품절). 나머지 22건은 판매중
  (가격 변동 있던 건도 있으나 원가는 자동으로 안 바꿈 — 지시대로 마진 판단은 사람 몫으로 남김).
  unknown 은 이번 회차 0건이라 되돌린 것 없음.
  `.github/workflows/`·`ops/` 는 건드리지 않았다 — 다음 항목(2/2, 스케줄 자동 실행)의 범위다.
  `npm run lint && npm run build` 통과 — 89개 라우트, 32개 상품 상세(`sold` 7건 포함) 전부
  정적 생성 확인. `npm run start` 로컬 프로덕션 서버에서 확인한 것: `/shop` `/m/shop` HTML에
  sold 7건 slug 가 전부 0건(grep), 판매중 상품은 그대로 나옴, 홈(`/` `/m`) 코디 슬라이드에도
  sold 품목(원래 kind:"top" 이던 `carhartt-duck-active-jacket-usa-l`)이 0건. sold 상세 페이지
  (desktop/mobile 둘 다) curl 200 + "판매완료" 텍스트 존재 + "구매 문의" 텍스트 0건(비활성 표시로
  교체됨) 확인. 실제 브라우저(휴대폰 포함)로는 보지 않았다 — curl·정적 HTML 검증까지만 했다.

### 2026-08-24 (2)

- [x] `auto` **`src/data/business.ts` 빈 값을 실제 값으로 채움**
  사람이 이번 실행에 직접 지정한 항목. PR #19 에서 만든 `businessInfo` 상수의 구조는 그대로
  두고 값만 채웠다 — 상호 "아카이브월야", 대표자명 "전종민", 사업자등록번호 "385-35-01969",
  사업장주소 "인천광역시 연수구 컨벤시아대로42번길 96", 연락처 "010-2814-9773".
  통신판매업신고번호(`mailOrderLicenseNumber`)는 아직 접수 대기라 지시대로 빈 문자열 그대로
  두었다 — 지어내거나 "준비중" 같은 문구를 넣지 않았다. `SiteFooter.tsx`·`MobileFooter.tsx`
  자체는 건드리지 않았다(둘 다 이미 `businessInfo` 를 읽어 빈 값은 `.filter()` 로 걸러내는
  구조였다).
  `npm run start` 로컬 프로덕션 서버로 확인: `/`(데스크톱 UA)와 `/m`(iPhone UA, `/` 요청 시
  307 리다이렉트 확인) 양쪽의 HTML을 curl 로 받아 5개 값 문자열이 각각 2회씩(desktop 배열
  객체 마크업 + RSC 페이로드) 나오는 것을 grep 으로 확인했다. `통신판매업` 문자열이 남아있는
  자리는 전부 상단 고지 안내문(disclaimer) 텍스트뿐이고, 필드 행 라벨("통신판매업 신고번호"
  단독)로는 등장하지 않아 빈 값 필터링이 정상 동작함을 확인했다. 실제 브라우저로는 보지
  않았다.
  `db/migrations/`·`ops/`·`.github/workflows/`·`AGENTS.md`·`next.config.ts`·결제/주문 코드·
  `package.json` 의존성 어느 것도 건드리지 않았다. `npm run lint && npm run build` 통과
  (lint 는 기존에도 있던 `DesktopViewLink.tsx` 무관 warning 1개만 남음).

### 2026-08-24

- [x] `auto` **사업자 정보 표기 블록 — `src/data/business.ts` 로 데스크톱·모바일 푸터 통합**
  사람이 이번 실행에 직접 지정한 항목. 전자상거래법 통신판매업자 표시 의무 대응이다.
  `src/data/business.ts` 를 새로 만들어 상호·대표자명·사업자등록번호·사업장주소·연락처·
  통신판매업신고번호 6개 값을 상수(`businessInfo`)로 모았다 — 지시대로 지금은 전부 빈 문자열이다
  (통신판매업신고번호는 접수 대기라 특히 그렇다). `SiteFooter.tsx`(데스크톱)와
  `MobileFooter.tsx`(모바일)가 각자 스타일은 그대로 두고 이 값을 읽어 렌더한다 — 값이
  빈 문자열인 필드는 배열에서 `.filter()` 로 걸러 그 줄 자체를 렌더하지 않는다(빈 라벨만
  남는 것 방지). 기존에 두 푸터에 하드코딩돼 있던 대괄호 placeholder(`[000-00-00000]` 등)와
  대표자 실명("전종민")은 이 상수 도입으로 제거됐다 — 지시문이 "지금은 전부 빈 문자열" 이라고
  명시했기 때문이다("전종민"은 `/about` `/m/about` 페이지에는 이 작업과 무관하게 그대로 남아있다).
  사업자등록번호에 걸려 있던 "[사업자정보 확인] (공정위 표준 링크)" 외부 링크(`href="#"`)도
  실제 번호가 없는 상태에서 의미가 없어 같이 제거했다 — 번호가 채워지면 별도로 다시 붙일 수 있다.
  모바일 푸터 상단 브랜드명이 "[브랜드/샵 이름]" 이었던 것도 이번에 데스크톱과 맞춰
  "WOLYA ARCHIVE" 로 고쳤다(같은 블록을 만지는 김에 바로 옆 줄이라 함께 정리).
  `고객센터`/`이메일`/`개인정보관리책임자`/`교환·반품 문의`/`반품 주소` 등 나머지 placeholder
  필드는 이번 지시 범위(6개 필드)가 아니라 손대지 않았다.
  새 라이브러리 없음, `db/migrations/`·`ops/`·`.github/workflows/`·`AGENTS.md`·`next.config.ts`·
  결제/주문 코드·`package.json` 의존성 중 어느 것도 건드리지 않았다.
  `npm run lint && npm run build` 통과 — 89개 라우트, lint 는 기존에도 있던 `DesktopViewLink.tsx`
  무관 warning 1개만 남음(이번 변경과 무관).
  `npm run start` 로컬 프로덕션 서버에서 확인한 것: `/`·`/m` 둘 다 curl 200. 두 푸터 HTML 모두
  상호/대표자/사업자등록번호/통신판매업 신고번호/사업장 소재지/연락처 행 자체가 나오지 않는 것을
  `<span class="min-w-[120px]...">`(데스크톱)·`text-[9px]...text-accent uppercase`(모바일) 라벨
  마크업 grep 으로 확인(현재 값이 전부 빈 문자열이므로 6개 라벨 모두 결과에 없음, 무관한
  `고객센터`/`이메일` 등 기존 필드만 남음). 대괄호 placeholder 문자열(`[000-00-00000]` 등)이
  완전히 사라진 것, 모바일 브랜드명이 "WOLYA ARCHIVE" 로 나오는 것도 grep 으로 확인했다.
  실제 브라우저(휴대폰 포함)로는 보지 않았다 — curl·정적 HTML 검증까지만 했다. 값을 채운 뒤
  실제로 줄이 나타나는 것까지는 이번 세션에서 확인하지 못했다(값이 비어 있어 검증 불가) —
  사람이 `business.ts` 를 채운 뒤 한 번 더 화면 확인을 권장한다.

### 2026-08-23 (3)

- [x] `auto` **원가와 원매물 링크가 `/shop` `/m/shop` 페이지 소스에 그대로 노출됐다 — 막았다**
  사람이 이번 실행에 직접 지정한 항목. 원인은 지시문에 적힌 그대로였다 — `ShopGrid.tsx`/
  `MobileShopGrid.tsx` 가 `"use client"` 컴포넌트인데 `/shop` `/m/shop` 의 서버 컴포넌트가
  `products` 배열 **전체**를 그 컴포넌트에 prop 으로 넘기고 있었다. Next 는 서버→클라이언트
  경계를 넘는 prop 을 RSC 페이로드로 전부 직렬화해 초기 HTML 에 심는다 — 화면에 그리지 않는
  필드까지 값째로 나간다는 뜻이다.
  권장된 방향 그대로 했다: `sourcePrice`·`sourceUrl` 두 필드를 `Product` 타입(`src/data/products.ts`)
  에서 완전히 떼어내 새 서버 전용 모듈 `src/data/product-sourcing.ts` 로 옮겼다 — slug 를 키로 하는
  `Record<string, { sourcePrice: number; sourceUrl?: string }>` 맵이다. 32건 전부 기존 `products.ts`
  에 박혀 있던 실제 값을 스크립트로 그대로 추출해 옮겼다(지어낸 값 없음). `Product` 타입에 이 두
  필드가 아예 없으므로 어떤 클라이언트 컴포넌트에 prop 으로 넘기든 구조적으로 다시 샐 수 없다.
  파일 상단 주석에 "이 파일은 서버 전용, use client 에서 import 금지" 를 명시했다(`docs/MAP.md` 에도
  한 줄 추가).
  연쇄 수정: `scripts/gen_seed_sql.mjs`(DB 시드 SQL 생성기)는 `x.sourcePrice` 를 직접 읽던 걸
  `productSourcing[x.slug]?.sourcePrice` 로 바꿨다. `src/lib/product-queries.ts` 의 `mapRow` 와
  `src/lib/products.ts` 헤더 주석도 `Product` 에 `sourcePrice` 가 없다는 전제에 맞춰 정리했다
  (이 두 파일은 A0 DB 연결층 코드로 아직 실제 페이지에서 안 쓰이지만 `npm run build` 의 타입체크
  대상이라 손대지 않으면 빌드가 깨진다).
  `npm run lint && npm run build` 통과 — 89개 라우트, 32개 상품 `/product/[slug]` `/m/product/[slug]`
  전부 정적 생성 확인. `npm run start` 로컬 프로덕션 서버에서 확인한 것: `/shop`·`/m/shop` HTML
  전체에서 `sourcePrice`·`fruitsfamily.com/product`·개별 매입가 숫자(149100 등)·원매물 slug
  (`6dpt5` 등) 문자열이 **0건**(grep 카운트 0). 예약주문 상세 페이지(desktop/mobile
  `carhartt-duck-active-jacket-usa-l`)의 "예약주문" 배지·"사입 확인 후 확정됩니다..." 고지 문구,
  판매자 고지가 있는 상품(`carhartt-active-jacket-j130-m`)의 "판매자 고지" 문구는 desktop/mobile
  둘 다 그대로 나오는 것을 확인했다. 홈(`/`, `/m`)에도 원가·원매물 링크 문자열이 없는 것을 확인했다
  (홈의 코디 교차 슬라이드는 이번 원인과 다른 경로 — prop 이 아니라 클라이언트 컴포넌트가 데이터를
  직접 import 하는 방식이라 애초에 RSC 페이로드로는 안 새지만, 같은 타입을 쓰므로 겸사겸사 확인).
  실제 브라우저(휴대폰 포함)로는 보지 않았다 — curl·정적 HTML 검증까지만 했다.

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

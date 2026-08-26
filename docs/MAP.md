# 레포 지도

작업 시작 전에 이 파일부터 읽는다. **여기 없는 디렉터리는 뒤지지 않는다.**
파일 개수·목록은 세지 않는다 — 개발 루프가 매일 파일을 추가하므로 목록의 정본은 git 이다.
여기는 **구조와 규칙**만 적는다.

## 최상위

| 경로 | 내용 |
|---|---|
| `AGENTS.md` | 불변 규칙·승인 항목·환경 분담 (정본). `CLAUDE.md` 는 이 파일을 가리키는 한 줄 |
| `docs/STATUS.md` | **현재 전제·결정 대기 (정본).** 계획 전에 읽는다 |
| `docs/BACKLOG.md` | **개발 자동화 작업 큐.** 이중 라우트 규칙·자동 병합 금지 경로도 이 파일 상단 |
| `docs/DEV-LOOP.md` | 개발 자동화 루프 설명 (매일 03:00 + 주간 정찰) |
| `docs/INCIDENTS.md` | 사건·부검 기록. 이상 증상이 낯익으면 먼저 검색 |
| `db/` | 스키마 정본 (`db/README.md`) + 앱-DB 연결 인수인계 |
| `ops/` | 24시간 서버 자동화 (`ops/README.md` 정본, `automation.json` = 킬스위치) |
| `.github/workflows/` | `ci.yml`(lint+build) · `heartbeat.yml`(cron 감시) · 개발 루프 |
| `scripts/pg_backup.sh` | 서버 백업 cron (04:00 KST) |
| `.claude/agents/` | 역할 에이전트 4종 (Claude Code 전용) |

## 읽지 않는다 (탐색 대상 아님)

`node_modules/` · `.next/` · `.git/` · `public/` 이미지 · `package-lock.json`

예외 — Next 16은 학습 데이터와 다르므로 API가 헷갈리면 `node_modules/next/dist/docs/` 의
해당 가이드 **한 편만** 읽는다.

## `src/` — 데스크톱 `/` 와 모바일 `/m` 은 별도 라우트다 (main 병합 완료)

```
src/proxy.ts              기기 판별 → /m 리다이렉트. middleware.ts 아님 (Next 16에서 deprecated)
src/app/                  데스크톱 라우트 — /shop /archive /about /contact /faq /product/[slug] /legal/[slug]
                          + 주문 /cart /checkout /order/[orderNo] /order-lookup
                          + 회원 /login /signup /account
src/app/m/                모바일 라우트 — 데스크톱과 1:1 짝 (/m/shop /m/archive /m/about /m/contact /m/faq /m/product/[slug] /m/legal/[slug]
                          /m/cart /m/checkout /m/order/[orderNo] /m/order-lookup
                          /m/login /m/signup /m/account)
src/app/api/              라우트 핸들러 — **데스크톱·모바일이 같이 쓴다**(proxy matcher 가 /api 제외).
                          /api/cart · /api/orders · /api/orders/lookup ·
                          /api/auth/social/[provider]/{start,callback}(소셜 로그인 왕복).
                          쿠키를 세우는 일은 전부 여기서 한다 — **/m 짝을 만들지 않는다**
src/components/           데스크톱 컴포넌트
src/components/mobile/    모바일 컴포넌트 — 데스크톱 것을 import 하지 않는다
src/data/                 ★ 공유 타입·상수. products.ts 의 배열은 **화면의 정본이 아니다**(A1 이후) —
                          DB 시드 원본이자 DB 를 못 읽을 때의 폴백 원장이다.
                          여기서 @/lib/db 를 import 하면 pg 가 브라우저 번들로 끌려가 빌드가 깨진다
                          product-sourcing.ts 는 매입가·원매물 링크 — 서버 전용,
                          클라이언트 컴포넌트에서 import 금지(원가 노출 방지)
src/lib/auth/             ★ 인증 전부. **서버 전용**(validation.ts·form-state.ts·types.ts 만 예외 —
                          클라이언트에서 import 해도 되게 pg 를 안 끌어온다).
                          password.ts(scrypt) · session.ts(쿠키+user_sessions) · queries.ts(SQL) ·
                          rate-limit.ts · social.ts(제공자 설정, 키 없으면 버튼이 안 보인다) ·
                          actions.ts(Server Action). 로그인은 **구매의 관문이 아니다** —
                          여기 코드는 장바구니·주문·결제를 건드리지 않는다
src/lib/                  ★ 화면이 상품을 읽는 곳. products.ts(조회 계층, 서버 전용) +
                          db.ts(pg 풀, 지연 생성) + product-queries.ts(SQL·매퍼).
                          라우트 컨벤션 파일(`opengraph-image.tsx` 등)이 공유하는 로직도 여기.
                          `og-image.tsx` 는 데스크톱·모바일 opengraph-image 가 같이 쓰는 생성기.
                          `legal-content.ts` 는 이용약관/개인정보처리방침/교환·환불 규정 텍스트
                          (데스크톱·모바일 /legal/[slug] 페이지가 같이 씀, 법률 검토 전 초안)
                          `faq-content.ts` 는 /faq, /m/faq 전체 질문/답변 목록(홈 티저보다 넓음)
src/lib/orders/           ★ 장바구니·주문. `shared.ts`(타입·검증·금액 정책 — pg 없음, 클라이언트도 씀)
                          + `queries.ts`(SQL, pg 없음) + `cart.ts`·`checkout.ts`·`lookup.ts`(서버 전용)
                          + `session.ts`(비회원 세션키 쿠키) + `order-no.ts`(주문번호 발급).
                          **금액 재계산·재고 차감(조건부 UPDATE)·예약주문 자리 잠금은 전부 `checkout.ts`
                          의 한 트랜잭션 안에 있다** — 여기 말고 다른 곳에서 주문을 만들지 않는다
src/lib/payment/          ★ 결제 수단 추상화. `provider.ts`(계약·등록소) + `manual.ts`(무통장, 첫 구현체).
                          PG 가 붙으면 여기 파일 하나 추가 + PROVIDERS 등록이고 주문 코드는 안 고친다.
                          입금 계좌는 코드에 없다 — `WOLYA_BANK_NAME`/`_ACCOUNT`/`_HOLDER` 환경변수
```

- **새 라우트는 반드시 `/x` 와 `/m/x` 짝으로.** 한쪽만 만들면 휴대폰에서 404.
  상세 규칙과 예외 처리는 `docs/BACKLOG.md` "이중 라우트 규칙" 이 정본
- 화면을 바꾸면 양쪽을 고친다. **데이터(`src/data/`)만 바꾸면 한 번으로 양쪽 반영**
- **상품 라우트 6개(`/` `/m` `/shop` `/m/shop` `/product/[slug]` `/m/product/[slug]`)는
  `force-dynamic` 이다.** 1점 1재고라 빌드 때 굳히면 품절이 다음 배포까지 안 붙는다.
  상품을 쓰는 새 라우트를 만들면 같은 설정을 붙인다
- **주문 라우트 8개(`/cart` `/checkout` `/order/[orderNo]` `/order-lookup` + `/m/…`)도
  `force-dynamic` + `robots: noindex` 다.** 쿠키를 읽고 재고를 다시 보므로 캐시하면 안 되고,
  개인 상태가 담긴 화면이라 검색에 걸릴 이유가 없다
- **회원 라우트 6개(`/login` `/signup` `/account` + `/m/…`)도 `force-dynamic` + `robots: noindex` 다.**
  로그인 여부(쿠키)와 소셜 키(환경변수)를 요청 때 봐야 한다 — 빌드 때 굳히면 사람이 `.env.local` 에
  키를 넣어도 다음 배포까지 버튼이 안 나온다
- "use client" 컴포넌트는 `@/lib/products` 를 import 하지 않는다. 서버 컴포넌트(페이지)가
  `await` 해서 props 로 내려준다 — 안 그러면 `pg` 가 브라우저 번들에 들어가 빌드가 깨진다.
  주문 쪽도 같다: 폼·장바구니 화면은 `@/lib/orders/shared` (타입·검증만) 까지만 import 하고
  `cart.ts`/`checkout.ts`/`lookup.ts` 는 서버 컴포넌트와 `src/app/api/` 만 쓴다
- 공용 컴포넌트는 `GrainOverlay.tsx` 하나뿐. 모바일 함정 목록은
  `.claude/agents/builder.md` "모바일 전용 레이아웃" 절

## `db/`

| 경로 | 내용 |
|---|---|
| `db/README.md` | **스키마·마이그레이션 절차·단계표 정본** |
| `db/HANDOFF-앱-DB-연결.md` | 앱-DB 연결 작업 인수인계 |
| `db/migrations/00N_*.{up,down,verify}.sql` | 단계별 3종 세트 |

**컬럼명을 추측하지 않는다.** 실제 정의는 해당 `*.up.sql` 을 연다.

## 자주 쓰는 명령

```bash
npm run dev                       # 로컬 미리보기 (CMD/Git Bash — PowerShell 불가)
npm run lint && npm run build     # 완료 기준. 출력이 길면 2>&1 | tail -20
ssh wolya                         # 서버 (~/.ssh/config 별칭)
ssh wolya 'tail -20 ~/ops/logs/$(date +%F).log'   # 자동화 로그
```

DB 조회(서버 안): `cd ~/app && set -a && . ./.env.local && set +a && psql "$DATABASE_URL"`
— `DATABASE_URL` 값은 출력하지 않는다.

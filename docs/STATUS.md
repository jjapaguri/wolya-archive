# 현재 상황 (정본)

**최종 갱신: 2026-08-29 (dev-loop — 로그인 시 장바구니 병합)**

**여기엔 기계가 추적하지 못하는 것만 적는다.** 다음은 여기 다시 적지 않는다:

- 무엇이 배포됐나 → `docs/BACKLOG.md` 의 `## 완료` + `git log`
- 서버·자동화 지금 상태 → 상태 피드 (조작법: Cowork 문서 `자동화-운영-핸드북`)
- 사건·부검 기록 → `docs/INCIDENTS.md`

상황이 바뀌면 여기만 고친다. 역할 파일·Cowork 문서에 상태를 하드코딩하지 않는다.
**전제를 바꾸는 PR은 같은 PR에서 이 파일을 고친다** (개발 루프 포함).

## 한 줄 요약

사이트(`/`+`/m`)와 24시간 자동화는 돌고 있다. A1(앱↔DB 연결층)은 병합됐고 운영 DB 에
006~009 가 적용돼 상품 37건이 들어가 있다.
**이제 로그인 없이 물건을 팔 수 있는 코드가 있다** — 장바구니 → 주문서 → 주문번호 → 무통장
입금 안내 → 주문조회까지 `/` 와 `/m` 양쪽에 있다(#30 병합). 그 위에 **로그인이 편의 기능으로
얹혔다**(#31) — 구매 경로에는 벽이 없다.

**남은 것은 사람이 하는 절차다.**
1. 운영 DB 에 **마이그레이션 010**(무통장 주문) 적용 — 없으면 주문 생성 자체가 실패한다
2. 운영 DB 에 **마이그레이션 011**(로그인) 적용 — 없으면 회원 기능만 안내 문구로 막힌다
   (사이트 나머지와 주문은 영향 없다)
3. 입금 계좌 환경변수(`WOLYA_BANK_*`) 설정 — 없으면 완료 화면이 "카카오톡으로 안내" 로 대체된다
4. 입금 확인 → 주문 상태 진행 절차 정하기
5. (선택) 소셜 로그인 앱 키 — 없으면 그 버튼만 안 보인다. 나머지는 그대로 돈다

## 지금 참인 것

- 사이트 archive-wolya.com 운영 중. 모바일 `/m` **main 병합·배포 완료** (PR #1)
- 24시간 자동화 가동 중 — 서버 cron(치유·배포·점검·피드) + 개발 루프(03:00) + 정찰(월 04:00).
  `writes` 스위치만 `false`
- CI: `.github/workflows/` 는 `ci.yml`(lint+build) + `heartbeat.yml`(cron 감시) + 자동화 루프용.
  브랜치 시절 `build.yml` 은 정리됨
- 홈(`/`·`/m`)은 상의×하의 코디 교차 슬라이드. 줄 배정은 `products.ts` 의 `kind`
  (가방·신발처럼 상·하의가 아닌 품목은 `null` — 이 구간에서 제외).
  **온라인 소싱 29건 등록(PR #13)으로 하의 9건이 들어와 이 구간이 데스크톱·모바일 둘 다 다시 나온다**
  (상의·하의 각각 `OUTFIT_ROW_MIN_ITEMS`=2건 이상 조건 충족, 코드 수정 없음)
- 앱↔DB: A0(읽기 계층)에 이어 **A1 완료** — `/` `/m` `/shop` `/m/shop` `/product/[slug]`
  `/m/product/[slug]` 여섯 라우트가 `src/lib/products.ts` 를 거쳐 DB 를 읽는다.
  상품 라우트는 전부 `force-dynamic`(요청마다 렌더) — 1점 1재고라 빌드 때 굳히면 안 된다.
  `src/data/products.ts` 는 **화면의 정본이 아니라** 공유 타입 + DB 시드 원본 + 폴백 원장이 됐다.
  마이그레이션 008(short_measure·seller_note·is_preorder) · 009(37건 전량 시드) 추가.
  **006~009 는 운영 DB 에 적용 완료**(상품 37건 — published 30 / sold_out 7, 그중 예약주문 27).
  폴백은 안전망으로 남아 있다 — 걷어내는 것은 `docs/BACKLOG.md` 의 A2 항목이다.
- **비회원 주문·결제(무통장)**: 장바구니는 `carts.session_key`(httpOnly 쿠키), 주문은
  `orders.user_id IS NULL`, 조회는 주문번호+휴대폰. 결제 수단은
  `src/lib/payment/provider.ts` 로 추상화했고 구현체는 `manual`(무통장) 하나다 —
  PG 가 붙으면 provider 를 하나 더 등록하고 `checkout.ts` 는 고치지 않는다.
  **예약주문 27건은 재고가 0이라 재고 차감을 건너뛰고 주문을 받는다**(안내 문구가 다르다).
  단벌이라 중복 예약은 `pg_advisory_xact_lock` 으로 막는다.
  새 라우트 여덟 개(`/cart` `/checkout` `/order/[orderNo]` `/order-lookup` + `/m/…`)는
  전부 `force-dynamic`, 검색 노출 안 함(`robots: noindex`).
  배송비는 정액 3,500원(`src/lib/orders/shared.ts` 의 `SHIPPING_FEE`) — 무료배송 기준선은
  프로모션 결정이라 넣지 않았다(아래 "사람 결정 대기").
- **로그인은 편의 기능이지 관문이 아니다.** `/login` `/signup` `/account` 와 `/m/` 짝이
  생겼고 헤더 메뉴·푸터에 진입점이 있다. **구매 경로에는 로그인 벽이 없다** —
  공개 라우트는 비로그인으로 전부 열린다. `/account` 만 로그인을 요구한다.
  비밀번호는 Node 내장 crypto 의 scrypt(계정별 솔트), 세션은 난수 토큰 쿠키 +
  `user_sessions` 서버 원장(로그아웃이 실제로 무효화). 로그인 시도에 속도 제한.
  **마이그레이션 011 이 운영 DB 에 적용되기 전까지는 회원 기능이 안내 문구로 막힌다**
  (화면은 뜨지만 가입·로그인이 "지금은 회원 기능을 쓸 수 없습니다" 로 끝난다).
  적용 명령은 `db/README.md` 절차 그대로. 소셜(카카오·네이버·구글)은 코드가 다 있고
  앱 키가 없으면 버튼이 아예 안 보인다 — 키를 채우고 재시작하면 코드 수정 없이 켜진다.
  비밀번호 재설정은 아직 없다(메일 발송 수단이 레포에 없다). `docs/BACKLOG.md` 참고
  **로그인 시 세션 장바구니는 회원 장바구니로 옮겨간다**(PR #33) — `signupAction`·
  `loginAction`·소셜 콜백이 세션을 만든 직후 `mergeSessionCartIntoUser` 를 부른다. 겹치는
  옵션은 수량을 더하되 `MAX_LINE_QUANTITY`(10)에서 clamp 되고, 실패해도 로그인 자체는
  막지 않는다(best-effort). 주문은 여전히 로그인 여부와 무관하게 그대로 동작한다.
- 품절 자동 반영의 빈틈: `source-watch.yml` 은 Actions 에서 돌아 운영 DB(localhost 전용)에
  닿지 못한다. 그래서 판정은 여전히 원장 `status` 를 고쳐 커밋하고, 조회 계층이 DB 결과 위에
  덮어써서 화면에 반영한다 — **배포를 거쳐야 반영된다.** 정리 항목은 `docs/BACKLOG.md`
- 노트북: 레포 `C:\Users\chunp\wolya-archive`, 빌드·SSH 가능. `ssh wolya` 별칭 등록됨.
  PowerShell 에서 npm 불가 → CMD 또는 Git Bash

- **Shop 과 Archive 는 역할이 다르다.** `/archive` `/m/archive` = 주인장 개인 소장
  중고·1점 한정(현재 카탈로그 전량), `/shop` `/m/shop` = 도매 소싱한 재입고 가능한
  신상품(아직 0건이라 "준비 중" 안내만 뜬다). 구분은 `Product.channel` — 생략하면
  `archive`. 신상품을 넣는 쪽이 `channel: "shop"` 을 명시하면 코드 수정 없이 Shop 에 뜬다.
  홈 코디 슬라이드는 채널로 거르지 않는다(양쪽 다 흐른다)

## 확정된 전제 (뒤집으려면 사용자 승인)

- **비회원 주문 허용** — 장바구니 `session_key`, 주문조회 주문번호+휴대폰
- 반품·교환은 `order_returns`/`order_return_items` 별도 테이블
- 로그인: 이메일 + 소셜(카카오·네이버·구글)
- 재고의 실체는 `product_variants.stock_quantity` (사이즈·색상 단위)
- DB collate `C.UTF-8` — 정렬 문제 시 쿼리에서 `COLLATE "ko-KR-x-icu"`, DB 재생성 안 함
- ORM 안 쓴다. 특히 `prisma migrate` 금지 — 스키마 정본은 `db/migrations/`
- 상품 화면은 정적 생성하지 않는다(`force-dynamic`). 재고 정확도가 캐시 이득보다 먼저다
- 서버(2GB)에서 빌드하지 않는 방향으로 전환 예정 (백로그 P2, Actions 빌드로 이관)

## 사람 결정 대기

| 항목 | 상태 |
|---|---|
| 결제(PG) | 통신판매업 신고번호 발급됨(`src/data/business.ts` 의 `mailOrderLicenseNumber` 는 아직 빈 문자열 — 번호를 받으면 채운다). PG 계약·심사는 대기. 그동안은 `pg_provider='manual'` 무통장으로 판다 |
| 입금 계좌 (`WOLYA_BANK_NAME`/`_ACCOUNT`/`_HOLDER`) | 서버 `.env.local` 미설정. **설정 전에는 주문 완료 화면이 계좌 대신 "카카오톡 채널로 안내" 를 그린다** — 틀린 계좌를 보여주지 않기 위해 일부러 그렇게 했다 |
| 배송비 | 지금 정액 3,500원. 무료배송 기준선·도서산간 추가비는 미정 (`calcShippingFee()` 한 곳) |
| 무통장 입금 확인 절차 | 사람이 통장을 보고 `payments.status='paid'` 로 올려야 한다. 관리자 화면을 만들지 psql 절차로 버틸지 미정 (`docs/BACKLOG.md`) |
| 상품 사진 저장 위치 | 미결정. S3 분리 권장 (`product_images.url` 형태에 직결) |
| `automation.json` 의 `writes` | 앱-DB 연결 후 사용자가 직접 켠다 (A1 코드는 끝났고, 008·009 적용 확인이 남았다) |
| 마이그레이션 011 운영 적용 | 대기. 적용 전에는 회원 기능이 안내 문구로 막힌다(사이트 나머지는 영향 없음) |
| 소셜 로그인 앱 키 | 대기. `.env.local` 에 넣기 전까지 해당 버튼이 안 보인다. 등록 항목은 로그인 PR([#31](https://github.com/jjapaguri/wolya-archive/pull/31)) 본문 |
| 브랜드 표기 통일 | 009 가 `Carhartt (칼하트)` → `Carhartt` 처럼 다수 표기로 합쳤다(5건 문구 변경). 반대로 하려면 `scripts/gen_seed_sql.mjs` 의 canonical 규칙을 뒤집는다 |

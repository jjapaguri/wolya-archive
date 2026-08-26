# 현재 상황 (정본)

**최종 갱신: 2026-08-25 (클라우드 세션)**

**여기엔 기계가 추적하지 못하는 것만 적는다.** 다음은 여기 다시 적지 않는다:

- 무엇이 배포됐나 → `docs/BACKLOG.md` 의 `## 완료` + `git log`
- 서버·자동화 지금 상태 → 상태 피드 (조작법: Cowork 문서 `자동화-운영-핸드북`)
- 사건·부검 기록 → `docs/INCIDENTS.md`

상황이 바뀌면 여기만 고친다. 역할 파일·Cowork 문서에 상태를 하드코딩하지 않는다.
**전제를 바꾸는 PR은 같은 PR에서 이 파일을 고친다** (개발 루프 포함).

## 한 줄 요약

사이트(`/`+`/m`)와 24시간 자동화는 돌고 있다.
**앱↔DB 연결층(A1)은 코드상 끝났다** — 화면 여섯 라우트가 `src/lib/products.ts` 조회 계층을 쓴다.
**남은 것은 사람이 하는 절차다: 운영 DB 에 마이그레이션 008·009 를 적용하는 것.**
적용 전에는 조회가 0건이라 원장(`src/data/products.ts` 37건) 폴백으로 지금과 똑같이 보인다 —
사이트가 비지는 않지만, 그동안 DB 는 아직 정본이 아니다.

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
  **007/008/009 가 실제 운영 DB에 적용됐는지는 이 세션에서 DB 접속이 없어 확인 못 함**
  (노트북에서 `psql` 로 적용·확인 필요). 적용 전까지는 폴백이 화면을 지금 상태로 유지한다.
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
| 결제(PG) | 통신판매업 신고 접수, 확정 대기. `pg_provider='manual'` 무통장은 지금도 가능 |
| 상품 사진 저장 위치 | 미결정. S3 분리 권장 (`product_images.url` 형태에 직결) |
| `automation.json` 의 `writes` | 앱-DB 연결 후 사용자가 직접 켠다 (A1 코드는 끝났고, 008·009 적용 확인이 남았다) |
| 브랜드 표기 통일 | 009 가 `Carhartt (칼하트)` → `Carhartt` 처럼 다수 표기로 합쳤다(5건 문구 변경). 반대로 하려면 `scripts/gen_seed_sql.mjs` 의 canonical 규칙을 뒤집는다 |

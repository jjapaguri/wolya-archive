# 현재 상황 (정본)

**최종 갱신: 2026-08-23 (클라우드 세션)**

**여기엔 기계가 추적하지 못하는 것만 적는다.** 다음은 여기 다시 적지 않는다:

- 무엇이 배포됐나 → `docs/BACKLOG.md` 의 `## 완료` + `git log`
- 서버·자동화 지금 상태 → 상태 피드 (조작법: Cowork 문서 `자동화-운영-핸드북`)
- 사건·부검 기록 → `docs/INCIDENTS.md`

상황이 바뀌면 여기만 고친다. 역할 파일·Cowork 문서에 상태를 하드코딩하지 않는다.
**전제를 바꾸는 PR은 같은 PR에서 이 파일을 고친다** (개발 루프 포함).

## 한 줄 요약

사이트(`/`+`/m`)와 24시간 자동화는 돌고 있다.
**병목은 앱↔DB 연결층 미완결** — 읽기 계층(A0)은 붙었지만 화면은 아직 그걸 안 쓴다.
상품은 여전히 `src/data/products.ts` 하드코딩.

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
- 앱: `pg` 클라이언트는 이미 설치됨(2026-08-23 `cda2889` "A0 앱-DB 읽기 연결층" —
  `src/lib/db.ts` 커넥션 풀 + `src/lib/product-queries.ts` SQL/매퍼 + 마이그레이션 006·007).
  **그런데 `src/app`·`src/components` 어디서도 이 계층을 import 하지 않는다** — 실제 화면은
  여전히 `src/data/products.ts` 하드코딩을 그대로 쓴다. 남은 절차(A1: `products.ts` 를 쿼리로
  교체)는 `db/HANDOFF-앱-DB-연결.md`. 007 시드가 실제 운영 DB에 적용됐는지는 이 세션에서
  DB 접속이 없어 확인 못 함(노트북에서 `psql` 로 확인 필요)
- 노트북: 레포 `C:\Users\chunp\wolya-archive`, 빌드·SSH 가능. `ssh wolya` 별칭 등록됨.
  PowerShell 에서 npm 불가 → CMD 또는 Git Bash

## 확정된 전제 (뒤집으려면 사용자 승인)

- **비회원 주문 허용** — 장바구니 `session_key`, 주문조회 주문번호+휴대폰
- 반품·교환은 `order_returns`/`order_return_items` 별도 테이블
- 로그인: 이메일 + 소셜(카카오·네이버·구글)
- 재고의 실체는 `product_variants.stock_quantity` (사이즈·색상 단위)
- DB collate `C.UTF-8` — 정렬 문제 시 쿼리에서 `COLLATE "ko-KR-x-icu"`, DB 재생성 안 함
- ORM 안 쓴다. 특히 `prisma migrate` 금지 — 스키마 정본은 `db/migrations/`
- 서버(2GB)에서 빌드하지 않는 방향으로 전환 예정 (백로그 P2, Actions 빌드로 이관)

## 사람 결정 대기

| 항목 | 상태 |
|---|---|
| 결제(PG) | 통신판매업 신고 접수, 확정 대기. `pg_provider='manual'` 무통장은 지금도 가능 |
| 상품 사진 저장 위치 | 미결정. S3 분리 권장 (`product_images.url` 형태에 직결) |
| `automation.json` 의 `writes` | 앱-DB 연결 후 사용자가 직접 켠다 |

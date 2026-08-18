# 현재 상황 (정본)

**최종 갱신: 2026-08-18 (Cowork)**

**여기엔 기계가 추적하지 못하는 것만 적는다.** 다음은 여기 다시 적지 않는다:

- 무엇이 배포됐나 → `docs/BACKLOG.md` 의 `## 완료` + `git log`
- 서버·자동화 지금 상태 → 상태 피드 (조작법: Cowork 문서 `자동화-운영-핸드북`)
- 사건·부검 기록 → `docs/INCIDENTS.md`

상황이 바뀌면 여기만 고친다. 역할 파일·Cowork 문서에 상태를 하드코딩하지 않는다.
**전제를 바꾸는 PR은 같은 PR에서 이 파일을 고친다** (개발 루프 포함).

## 한 줄 요약

사이트(`/`+`/m`)와 24시간 자동화는 돌고 있다.
**병목은 앱↔DB 연결층 부재** — 상품은 하드코딩 플레이스홀더, DB 24테이블 전부 0행.

## 지금 참인 것

- 사이트 archive-wolya.com 운영 중. 모바일 `/m` **main 병합·배포 완료** (PR #1)
- 24시간 자동화 가동 중 — 서버 cron(치유·배포·점검·피드) + 개발 루프(03:00) + 정찰(월 04:00).
  `writes` 스위치만 `false`
- CI: `.github/workflows/` 는 `ci.yml`(lint+build) + `heartbeat.yml`(cron 감시) + 자동화 루프용.
  브랜치 시절 `build.yml` 은 정리됨
- 앱: PostgreSQL 클라이언트 미설치, `src/data/products.ts` 는 플레이스홀더.
  연결 절차는 `db/HANDOFF-앱-DB-연결.md`
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

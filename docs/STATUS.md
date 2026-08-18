# 현재 상황 (정본)

**최종 갱신: 2026-08-18**

계획을 세우기 전에 이 파일을 읽는다. 상황이 바뀌면 **여기만** 고친다.
역할 파일(`.claude/agents/*.md`)이나 Cowork 프로젝트 문서에 현재 상황을 하드코딩하지 않는다.

## 한 줄 요약

DB 스키마는 전부 섰고 데이터는 0건. **앱↔DB 연결층이 없는 것이 유일한 병목이다.**

## 인프라

| 항목 | 상태 |
|---|---|
| 사이트 | https://archive-wolya.com 운영 중 (Lightsail `archieve-wolya`, `54.117.20.132`) |
| 런타임 | Ubuntu 24.04 / Node 22.23.2 / PM2 `archive-wolya` / Nginx → `127.0.0.1:3000` |
| SSL | Let's Encrypt, 만료 2026-11-12, 자동 갱신 등록됨 |
| DB | PostgreSQL 16.14, DB `wolya`, 계정 `wolya_app`(비superuser), `listen_addresses=localhost` |
| 백업 | 매일 04:00 KST cron (`scripts/pg_backup.sh` → `~/backups/`, 7일 롤링) 가동 중 |

## 로컬 개발환경 — **구축 완료 (2026-08-18)**

레포가 `C:\Users\chunp\wolya-archive` 에 클론돼 있고 `npm run lint` / `npm run build`
**로컬 통과 확인됨.** 이전 문서에 있던 "레포가 로컬에 없다 / GitHub Actions가 유일한 검증 수단"은
더 이상 사실이 아니다.

- Git 2.55.0 / Node 22.23.2 (서버와 맞춤) / npm 10.9.8 / Claude Code 2.1.234
- 레포를 OneDrive 아래 두지 않았다 — `node_modules` 가 동기화를 망가뜨린다
- **PowerShell에서 `npm` 실행 불가** (`PSSecurityException`). CMD 또는 Git Bash를 쓴다
- `claude` PATH: `%USERPROFILE%\.local\bin` 을 사용자 `Path` 에 수동 등록함
- SSH 키 `C:\Users\chunp\.ssh\LightsailDefaultKey-ap-northeast-2.pem`, `icacls` 로 권한 정리 완료
- ⚠ **GitHub Actions 워크플로가 main에 없다.** `.github/workflows/build.yml` 은 `mobile-layout`
  브랜치에만 있다 (main 루트에 `.github/` 디렉터리 자체가 없음). 즉 **지금 main에 push해도 CI가 돌지 않는다.**
  브랜치를 병합하면 따라온다. 그전까지 검증은 로컬 `npm run lint && npm run build` 가 유일하다

## DB — 5단계 전부 적용 완료

**`public` 테이블 24개. 전 테이블 0행.** 단계표 정본은 `db/README.md`.

| 단계 | 내용 | 상태 |
|---|---|---|
| 1 | 상품 — brands, categories, products, product_variants, product_images, tags, product_tags | 완료 |
| 2 | 회원 — users, user_social_accounts, user_addresses | 완료 |
| 3 | 주문 — carts, cart_items, orders, order_items | 완료 |
| 4 | 결제·배송 — payments, shipments, order_status_histories | 완료 |
| 5 | CS·리뷰·반품 — reviews, review_images, inquiries, inquiry_answers, faqs, order_returns, order_return_items | 완료 |

확정된 전제:

- 재고의 실체는 `product_variants.stock_quantity` (사이즈·색상 옵션 단위)
- **비회원 주문 허용** — 장바구니 `session_key`, 주문조회 주문번호 + 휴대폰
- **반품·교환은 `order_returns` / `order_return_items` 별도 테이블** (주문 상태로 처리하지 않음)
- 로그인: 이메일 + 소셜(카카오·네이버·구글)
- DB collate 가 `C.UTF-8` (바이트순 정렬). 한글+영문 혼재 정렬이 문제되면
  쿼리에서 `ORDER BY name COLLATE "ko-KR-x-icu"` 로 처리한다. DB 재생성은 하지 않는다

## 앱 — 최우선 병목

- `package.json` 의존성은 `next` / `react` / `react-dom` 셋뿐 — **PostgreSQL 클라이언트 미설치**
- `src/data/products.ts` 는 **45줄 플레이스홀더** (`[아이템명]`, `[소재명]`). 실제 상품 0건
- 다음 작업 절차는 `db/HANDOFF-앱-DB-연결.md` 에 있다.
  ORM 비권장, 특히 `prisma migrate` 금지 — 스키마 정본은 `db/migrations/`

## 대기 중인 것

| 항목 | 상태 |
|---|---|
| `mobile-layout` 브랜치 | 빌드 통과. **main 병합·배포 승인 대기** |
| 결제(PG) | 통신판매업 신고 **접수됨, 확정 대기**. `payments.pg_provider='manual'` 무통장 운영 가능 |
| 상품 사진 저장 위치 | 미결정. S3 분리 권장 (`product_images.url` 형태에 직결) |

## 미해결 과제

1. **`ops-manager` 일일 점검을 아무도 실행할 수 없다** — DB가 localhost 바인딩이고,
   노트북은 닫으면 꺼진다. 서버에 `~/daily_check.sh` + cron 을 두고 그 결과 파일을 읽는 구조가 필요하다.
   점검 항목은 `.claude/agents/ops-manager.md` 참고. **읽기 전용 SELECT만.**
   기존 `scripts/pg_backup.sh` 가 04:00 KST에 돌므로 시간대를 겹치지 않게 잡는다.
   지금은 전 테이블 0행이라 모든 항목이 0으로 나온다 — 실제 검증은 데이터 투입 후.
2. `~/.ssh/config` 별칭 미설정 — 등록하면 `ssh wolya` 로 끝난다.
3. 모바일 상품 카드가 가로 스크롤 1줄 — 상품 수가 늘면 목록 페이지가 별도로 필요하다.

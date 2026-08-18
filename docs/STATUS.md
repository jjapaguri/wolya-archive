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

## 24시간 자동화 — 코드는 main에 있음, 서버 설치만 남음

`ops/` 가 정본. 상세는 `ops/README.md`, 사용자용 조작법은 Cowork 문서 `claude/자동화-운영-핸드북.md`.

| 스크립트 | 주기 | 하는 일 |
|---|---|---|
| `ops/health_check.sh` | 5분 | 사이트 200 + PM2 확인, 실패 시 PM2 자동 재시작 |
| `ops/auto_deploy.sh` | 10분 | main 새 커밋 + CI 초록불이면 배포, 검증 실패 시 직전 커밋으로 자동 롤백 |
| `ops/agent_runner.sh` | 20분 | 서버 위 헤드리스 Claude Code — critical 자동 진단, `~/ops/queue/*.task` 처리 |
| `ops/daily_check.sh` | 매일 03:30 | 읽기 전용 DB 점검 10항목. **데이터 0건이면 휴면**, 들어오면 자동으로 깨어남 |
| `ops/publish.sh` | 15분 | 상태를 HTTPS 로 노출 (Cowork 이 읽어 08:00 메일 발송) |

- **킬스위치**: `ops/automation.json` 의 `enabled` 를 `false` 로 커밋하면 전면 정지(최대 15분).
  즉시 멈추려면 서버에서 `touch ~/ops/STOP`. 플래그를 못 읽거나 캐시가 낡으면 자동으로 정지된다.
- `AGENTS.md` 4절에서 **서버 재배포는 `auto_deploy.sh` 경로에 한해 예외**로 개정됐다(사용자 승인).
- 점검 SQL 은 로컬 PostgreSQL 16에 `db/migrations/001~005` 를 실제 적용해 12/12 통과 검증했다.
  `product_variants.stock_quantity` 에 `CHECK (>= 0)` 이 있어 **재고 음수 감지 항목은 뺐다**(DB가 막는다).

## 로컬 개발환경 — **구축 완료 (2026-08-18)**

레포가 `C:\Users\chunp\wolya-archive` 에 클론돼 있고 `npm run lint` / `npm run build`
**로컬 통과 확인됨.** 이전 문서에 있던 "레포가 로컬에 없다 / GitHub Actions가 유일한 검증 수단"은
더 이상 사실이 아니다.

- Git 2.55.0 / Node 22.23.2 (서버와 맞춤) / npm 10.9.8 / Claude Code 2.1.234
- 레포를 OneDrive 아래 두지 않았다 — `node_modules` 가 동기화를 망가뜨린다
- **PowerShell에서 `npm` 실행 불가** (`PSSecurityException`). CMD 또는 Git Bash를 쓴다
- `claude` PATH: `%USERPROFILE%\.local\bin` 을 사용자 `Path` 에 수동 등록함
- SSH 키 `C:\Users\chunp\.ssh\LightsailDefaultKey-ap-northeast-2.pem`, `icacls` 로 권한 정리 완료
- CI: **main에 `.github/workflows/ci.yml` 있음** (2026-08-18 추가, lint + build, Node 22.23.2 고정).
  main push 시 자동으로 돈다. `mobile-layout` 브랜치에는 별도의 `build.yml` 이 있으므로
  **병합하면 워크플로가 두 개가 된다** — 그때 하나로 합칠 것

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

1. **서버에 `ops/setup.sh` 를 아직 실행하지 않았다.** 이것 하나만 하면 24시간 자동화가 켜진다.
   ```bash
   ssh -i C:\Users\chunp\.ssh\LightsailDefaultKey-ap-northeast-2.pem ubuntu@54.117.20.132
   cd ~/app && git pull && bash ~/app/ops/setup.sh
   ```
   출력되는 피드 URL 을 Cowork 프로젝트 문서 `claude/자동화-운영-핸드북.md` 의 "피드 주소" 에 기록할 것.
   그 전까지 매일 08:00 Cowork 브리핑 예약 작업은 조용히 건너뛴다.
2. `~/.ssh/config` 별칭 미설정 — 등록하면 `ssh wolya` 로 끝난다.
3. 모바일 상품 카드가 가로 스크롤 1줄 — 상품 수가 늘면 목록 페이지가 별도로 필요하다.

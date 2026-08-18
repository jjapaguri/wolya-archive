<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# WOLYA ARCHIVE

빈티지·아카이브 의류 셀렉트샵. https://archive-wolya.com (Lightsail + Nginx + PM2 운영 중)
재고는 대부분 **1점 1재고(단벌)** 다. 품절 반영 속도와 재고 정확도가 기능 추가보다 먼저다.

스택: Next.js 16.3.1 (App Router) / React 19.2.8 / TypeScript / Tailwind 4 / PostgreSQL 16

**작업 시작 전에 `docs/MAP.md` 를 읽는다.** 레포 구조와 "무엇을 어디서 찾는지"가 거기 있다.
현재 진행 상황은 `docs/STATUS.md` 가 유일한 정본이다.

---

## 1. 어디서 실행하는가 — 역할보다 먼저 판단한다

**한 줄 규칙 — 레포 파일이나 서버를 건드리면 Claude Code, 나머지는 Cowork.**

| | Claude Code (노트북) | Cowork (클라우드) |
|---|---|---|
| `npm run lint` / `build` / `dev` | ○ | ✕ (npm 레지스트리 403) |
| `git commit` / `push` | ○ | ✕ (403) |
| 서버 SSH · 배포 · DB 접속 | ○ | ✕ (DB `listen_addresses=localhost`) |
| `.claude/agents/` 서브에이전트 | ○ | ✕ (로드되지 않음) |
| 레포 파일 수정 | ○ | 데스크톱 앱 폴더 연결 시 문서만 |
| 인스타·리서치·문서·예약 작업·브라우저 | △ | ○ |

- Cowork에 코드 작업이 들어오면 **조사·설계·변경안까지만** 만들고 실행은 Claude Code로 넘긴다.
  GitHub 웹 업로드로 커밋하는 우회는 쓰지 않는다 — lint·build를 통과하지 않은 커밋이 된다.
- Cowork에서는 `.claude/agents/` 파일을 **작업 진행 규칙**으로 직접 읽고 따른다.

---

## 2. 불변 규칙 — 이 문서가 유일한 정본이다

역할 파일에 다시 적지 않는다. 규칙이 바뀌면 여기만 고친다.

1. **금액은 `INTEGER` 원 단위 정수.** `FLOAT`/`REAL` 금지.
2. **결제 금액은 항상 서버에서 재계산해 검증한다.** 클라이언트가 보낸 금액은 대조용으로만 쓴다.
3. **재고 차감은 조건부 UPDATE.**
   ```sql
   UPDATE product_variants SET stock_quantity = stock_quantity - :qty
    WHERE id = :id AND stock_quantity >= :qty;
   ```
   영향 행 0 → 품절 처리. "조회 후 계산해서 덮어쓰기"는 동시 주문 시 재고를 음수로 만든다.
4. **주문서는 스냅샷.** 상품명·단가·배송지는 참조가 아니라 값으로 복사한다.
5. **PG 웹훅은 멱등.** `payments.pg_transaction_id` UNIQUE. 중복 웹훅은 "이미 처리됨"으로 200 응답.
   서명 검증 없이 상태를 바꾸지 않는다.
6. **비밀값은 `.env`.** 커밋·로그·에러 응답에 노출 금지. SQL은 파라미터 바인딩만.
7. **개인정보 최소 수집.** 안 쓰는 컬럼은 만들지 않는다. 동의는 boolean이 아니라 **시각**으로 저장.
8. **완료 기준은 `npm run lint && npm run build` 통과.** 둘 다 통과하지 않으면 완료로 보고하지 않는다.

---

## 3. 역할

`.claude/agents/` 에 4개. 사용법·조직도·개편 이력은 `.claude/agents/README.md`.

| 에이전트 | 담당 | 주 실행 환경 |
|---|---|---|
| `chief-of-staff` | 요청 분해·순서 결정·위임·검수·보고 | 양쪽 |
| `builder` | 코드 전부 — DB·API·화면·배포 | Claude Code |
| `ops-manager` | 재고·주문·배송·CS 실무, 운영 리포트 | Claude Code (DB 접속 필요) |
| `item-scout` | 매입 후보 리서치, 시세·희소성, 상품 초안 | Cowork |

여러 역할에 걸치는 요청은 `chief-of-staff` 부터 시작한다.

---

## 4. 승인 없이 실행 금지 (전 역할 공통)

- 프로덕션 DB 파괴적 변경 (DROP / DELETE / TRUNCATE / 스키마 파괴적 마이그레이션)
- 실제 결제·환불 실행, PG 설정 변경
- 고객에게 나가는 메시지 발송 (초안까지만)
- `main` 브랜치 push (사람·에이전트가 직접 하는 경우)
- 서버 재배포 — **단, `ops/auto_deploy.sh` 를 통한 자동 배포는 예외.**
  CI 통과 + 배포 후 헬스체크 + 실패 시 자동 롤백을 모두 만족하는 경로에 한한다.
  `ops/automation.json` 의 `deploy` 를 `false` 로 두면 이 예외는 즉시 사라진다.
- 가격 인하·프로모션 결정
- 새 UI 라이브러리·디자인 시스템 도입

---

## 5. 정본 위치 (같은 내용을 두 곳에 적지 않는다)

| 내용 | 정본 |
|---|---|
| 불변 규칙, 승인 항목, 환경 분담 | **이 문서** |
| 레포 구조·파일 지도 | `docs/MAP.md` |
| 현재 진행 상황·미해결 과제 | `docs/STATUS.md` |
| DB 스키마·마이그레이션 절차·단계표 | `db/README.md` |
| 다음 작업(앱-DB 연결층) 인수인계 | `db/HANDOFF-앱-DB-연결.md` |
| 역할 사용법·조직도 | `.claude/agents/README.md` |
| 배포 절차·트러블슈팅 | `.claude/agents/builder.md` 배포 섹션 |
| 24시간 자동화 구성·킬스위치 | `ops/README.md` |

- **역할 파일과 문서에 현재 상황을 하드코딩하지 않는다.** `docs/STATUS.md` 를 가리킨다.
- 프로젝트 지식(Cowork) 문서는 **서술형 사본**이다. 레포와 어긋나면 **레포가 정답**이다.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## WOLYA ARCHIVE 프로젝트

빈티지·아카이브 의류 셀렉트샵. https://archive-wolya.com (Lightsail + Nginx + PM2 운영 중)

### 역할 에이전트

`.claude/agents/` 에 4개 역할이 정의돼 있다 (chief-of-staff / builder / ops-manager / item-scout). 사용법과 조직도는 `.claude/agents/README.md` 참고.
범위가 여러 역할에 걸치면 `chief-of-staff`부터 시작한다.

### 공통 불변 규칙 (모든 역할)

- 금액은 `INTEGER` 원 단위. 결제 금액은 항상 **서버에서 재계산**해 검증한다.
- 재고 차감은 **조건부 UPDATE**(`WHERE stock_quantity >= :qty`). 조회 후 덮어쓰기 금지.
- 주문서의 상품명·가격·배송지는 **스냅샷**(값 복사). 참조하지 않는다.
- PG 웹훅은 멱등 처리. `payments.pg_transaction_id` UNIQUE.
- 비밀값은 `.env`. 절대 커밋하지 않는다.
- 코드 변경 후 `npm run lint` && `npm run build` 통과가 완료 기준.

### 승인 없이 실행 금지

프로덕션 DB 파괴적 변경 / 실제 결제·환불 / 고객 발송 / `main` push / 서버 재배포(`~/deploy.sh`)

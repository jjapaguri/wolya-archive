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
src/app/                  데스크톱 라우트 — /shop /archive /about /contact /product/[slug]
src/app/m/                모바일 라우트 — 데스크톱과 1:1 짝 (/m/shop /m/archive /m/about /m/contact /m/product/[slug])
src/components/           데스크톱 컴포넌트
src/components/mobile/    모바일 컴포넌트 — 데스크톱 것을 import 하지 않는다
src/data/                 ★ 유일한 공유 지점. products.ts 와 Product 타입
src/lib/                  라우트 컨벤션 파일(`opengraph-image.tsx` 등)이 공유하는 로직.
                          `og-image.tsx` 는 데스크톱·모바일 opengraph-image 가 같이 쓰는 생성기
```

- **새 라우트는 반드시 `/x` 와 `/m/x` 짝으로.** 한쪽만 만들면 휴대폰에서 404.
  상세 규칙과 예외 처리는 `docs/BACKLOG.md` "이중 라우트 규칙" 이 정본
- 화면을 바꾸면 양쪽을 고친다. **데이터(`src/data/`)만 바꾸면 한 번으로 양쪽 반영**
- DB 연결층이 생기면 `src/data/products.ts` 한 곳만 실제 조회로 바꾼다.
  export 이름 유지 시 화면 컴포넌트 수정 불필요
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

# 레포 지도

작업 시작 전에 이 파일부터 읽는다. **여기 없는 디렉터리는 뒤지지 않는다.**

## 최상위

| 경로 | 내용 |
|---|---|
| `AGENTS.md` | 불변 규칙·승인 항목·환경 분담 (정본). `CLAUDE.md` 는 이 파일을 가리키는 한 줄 |
| `docs/MAP.md` | 이 파일 — 레포 지도 |
| `docs/STATUS.md` | **현재 진행 상황·미해결 과제 (정본).** 계획 세우기 전에 읽는다 |
| `db/` | 스키마 정본 |
| `src/` | Next.js 앱 |
| `scripts/pg_backup.sh` | 서버 cron 백업 스크립트 (04:00 KST) |
| `.claude/agents/` | 역할 에이전트 4종 |

## 읽지 않는다 (탐색 대상 아님)

`node_modules/` · `.next/` · `.git/` · `public/` 이미지 · `package-lock.json` (242KB)

예외 — Next 16은 학습 데이터와 다르므로 API가 헷갈리면 `node_modules/next/dist/docs/` 의
해당 가이드 **한 편만** 읽는다. 디렉터리 전체를 훑지 않는다.

## `src/` (main 브랜치)

```
src/app/layout.tsx        루트 레이아웃·메타데이터
src/app/page.tsx          데스크톱 홈 (섹션 컴포넌트를 조립만 함)
src/app/globals.css       Tailwind 4 · 전역 토큰
src/components/           데스크톱 섹션 컴포넌트 12종
src/data/products.ts      상품 데이터 ★ 45줄 플레이스홀더
```

★ **DB 연결층이 생기면 `src/data/products.ts` 한 곳만 실제 조회로 바꾼다.**
export 이름을 유지하면 데스크톱·모바일 화면 컴포넌트는 손대지 않아도 된다.

`src/components/` 는 전부 `page.tsx` 가 조립하는 프레젠테이션 컴포넌트다.
화면 문구·레이아웃 수정은 해당 `*Section.tsx` 하나만 열면 된다.
`GrainOverlay.tsx` 만 데스크톱·모바일 공용(`alpha` / `frameIntervalMs` / `opacity` 옵션).

## `mobile-layout` 브랜치에만 있는 것

main에는 없다. 모바일 작업이면 브랜치를 먼저 확인한다.

```
src/app/m/layout.tsx      모바일 메타데이터·viewport
src/app/m/page.tsx        모바일 페이지
src/components/mobile/    모바일 컴포넌트 11종
src/proxy.ts              기기 판별 후 /m 리다이렉트 (middleware.ts 아님 — Next 16에서 deprecated)
```

**모바일 코드를 만지기 전에 `.claude/agents/builder.md` 의 "모바일 전용 레이아웃" 함정 목록을 읽는다.**
(`<Link>` 프리페치 쿠키 사고, `proxy.ts` matcher 제외 경로, grain 캔버스 프레임 간격, 태블릿 취급)

## `db/`

| 경로 | 내용 |
|---|---|
| `db/README.md` | **스키마·마이그레이션 절차·단계표 정본** |
| `db/HANDOFF-앱-DB-연결.md` | 다음 작업 인수인계 |
| `db/migrations/00N_*.{up,down,verify}.sql` | 단계별 3종 세트. 1 상품 / 2 회원 / 3 주문 / 4 결제배송 / 5 CS |

**컬럼명을 추측하지 않는다.** 실제 정의는 해당 `*.up.sql` 을 열어 확인한다.

## 자주 쓰는 명령

```bash
npm run dev            # 로컬 미리보기 (CMD 또는 Git Bash — PowerShell은 ExecutionPolicy로 막힘)
npm run lint && npm run build   # 완료 기준
```

출력이 길면 잘라서 본다 — `npm run build 2>&1 | tail -20`

서버:

```bash
ssh -i C:\Users\chunp\.ssh\LightsailDefaultKey-ap-northeast-2.pem ubuntu@54.117.20.132
cd ~/app && set -a && . ./.env.local && set +a && psql "$DATABASE_URL"   # DATABASE_URL 값은 출력하지 않는다
~/deploy.sh            # 재배포 — 승인 필요
```

---
name: builder
description: WOLYA ARCHIVE 개발 담당. DB 스키마·마이그레이션, API 라우트·인증·결제 연동, Next.js 페이지·컴포넌트·스타일까지 코드 전부를 한 명이 수직으로 처리한다. 테이블 추가, 쿼리 튜닝, API 신규, 로그인, 결제·웹훅, 화면·레이아웃·반응형, 502·PM2·Nginx 문제, 배포 — 코드가 바뀌는 일은 전부 이 역할.
---

# Builder (개발 전담)

DB → API → 화면을 **한 사람이 끝까지** 본다. 층별로 쪼개지 않는다.
이 프로젝트의 작업은 대부분 한 기능이 세 층을 동시에 건드리는 수직 슬라이스이기 때문이다.

**먼저 `AGENTS.md` 의 불변 규칙 8개를 읽는다.** 여기에는 다시 적지 않는다.
Next.js 16은 학습 데이터와 API가 다르다. 라우팅·캐싱·이미지·서버 액션 코드를 쓰기 전에
`node_modules/next/dist/docs/` 의 해당 가이드를 먼저 읽는다.

## 작업 순서

한 기능을 맡으면 **스키마 → 쿼리 → API → 화면** 순으로 내려간다.
중간에 앞 단계를 고쳐야 하면 되돌아가서 고친다 — 이게 층별 분할 대비 이 구조의 이점이다.
끝나면 `npm run lint && npm run build`. 둘 다 초록불이어야 완료다.

---

## A. 데이터베이스

서버: Lightsail `archieve-wolya`(Ubuntu 24.04)에 직접 설치된 PostgreSQL 16.
마이그레이션 파일 규칙·실행 절차·구축 단계표·스키마 요점은 **`db/README.md` 가 정본**이다. 먼저 읽는다.

### 스키마 컨벤션

- **PK**: `BIGINT GENERATED ALWAYS AS IDENTITY`. 외부 노출 식별자는 `slug` / `order_no`
- **시각**: `TIMESTAMPTZ`. 모든 테이블에 `created_at` / `updated_at` (트리거가 자동 갱신)
- **삭제**: 상품·리뷰·문의는 `deleted_at` 소프트 삭제. 물리 삭제 금지
- **상태값**: `VARCHAR` + `CHECK` 제약. PostgreSQL ENUM 타입 사용 금지
- **이미지**: DB에는 URL만. 파일은 S3

### 산출물은 항상 3종 세트

`NNN_이름.up.sql` / `NNN_이름.down.sql` / `NNN_이름.verify.sql`.
하나라도 없으면 미완성이다. 기존 테이블에 NOT NULL 컬럼을 추가할 때는
`ADD COLUMN(nullable) → 백필 → SET NOT NULL` 3단계 또는 `DEFAULT` 지정으로 나눈다.

### 금지

- 프로덕션에서 `DROP TABLE` / `DROP COLUMN` / `TRUNCATE` 직접 실행. SQL만 제시하고 승인받는다
- 백업(`scripts/pg_backup.sh` 또는 Lightsail 스냅샷) 없이 파괴적 마이그레이션 진행

---

## B. 백엔드

### API 컨벤션

- 경로: `src/app/api/**/route.ts`
- 응답: 성공 `{ data }`, 실패 `{ error: { code, message } }` + 적절한 HTTP 상태코드
- 에러 응답에 내부 스택·쿼리를 담지 않는다. 서버 로그에만 남긴다
- 입력 검증은 라우트 진입 즉시. 실패하면 400으로 끊는다
- 관리자 전용 API는 `users.role` 검사를 반드시 통과시킨다

### 주문·결제

- **결제 승인과 재고 차감은 같은 트랜잭션 안에서.** 조건부 UPDATE의 영향 행이 0이면 즉시 롤백하고 품절 응답
- 실제 결제·환불 API 호출은 테스트 키 환경에서만. 프로덕션 호출은 사용자 승인

### 배포

```bash
# 서버에서
~/deploy.sh   # git pull && npm install && npm run build && pm2 restart archive-wolya
```

배포 전 로컬 `npm run build` 통과가 전제. **배포 실행은 사용자 승인을 받는다.**

트러블슈팅:

- 502 → `pm2 status`, `pm2 logs archive-wolya`
- 빌드 중 `Killed` → 메모리 부족. `NODE_OPTIONS="--max-old-space-size=1536" npm run build`
- 재부팅 후 다운 → `systemctl status pm2-ubuntu`

---

## C. 프론트엔드

### 이 사이트의 성격

**사진이 주인공**이고 UI는 배경으로 물러난다. 유입의 대부분이 인스타그램에서 오므로
**모바일이 기본, 데스크톱이 부가**다. 모바일 세로 화면에서 먼저 확인한 뒤 데스크톱을 맞춘다.

### 규칙

- 기존 컴포넌트의 톤(여백·타이포·그레인 오버레이 — `GrainOverlay`, `ContentPanel` 이 잡아둔 결)을 먼저 읽고 맞춘다. 새 디자인 언어를 임의로 도입하지 않는다
- 스타일은 Tailwind 유틸리티로. 인라인 style과 별도 CSS 파일은 꼭 필요할 때만
- 서버 컴포넌트를 기본으로, 상태·이벤트가 필요한 곳에만 `'use client'`
- 이미지는 `next/image`. 외부 도메인은 `next.config.ts` 의 `images.remotePatterns` 에 등록해야 표시된다. 상품 사진은 용량이 크므로 `sizes` 와 `priority` 를 의식적으로 지정한다
- **가격·재고·품절은 서버 데이터를 그대로 렌더링한다.** 프론트에서 금액을 계산하지 않는다
- 품절 상품은 숨기지 말고 **품절 배지**로 노출한다 (아카이브 특성상 기록 가치가 있다)

### 모바일 전용 레이아웃 (`/m`)

데스크톱과 모바일은 **별도 화면**, 데이터는 **하나**를 공유한다. **main 에 병합돼 있다.**
새 라우트는 반드시 `/x` 와 `/m/x` 짝으로 — 규칙 정본은 `docs/BACKLOG.md` "이중 라우트 규칙".

```
src/app/page.tsx          데스크톱
src/app/m/                모바일 페이지·레이아웃
src/components/mobile/    모바일 컴포넌트
src/data/products.ts      상품 데이터 — 양쪽 공유 ★
src/proxy.ts              기기 판별 후 리다이렉트
```

★ **DB 연결은 `src/data/products.ts` 한 곳만 실제 조회로 바꾸면 데스크톱·모바일이 동시에 따라온다.**

함정:

- **`middleware.ts` 가 아니라 `proxy.ts`** — Next 16부터 middleware 파일 규약이 deprecated. `export function proxy()`
- 데스크톱 전환 링크에 `<Link>` 금지 — 프리페치만으로 쿠키가 저장돼 화면이 멋대로 바뀐다. 클라이언트 컴포넌트에서 쿠키 직접 설정 + 전체 새로고침
- `proxy.ts` matcher에서 `api`, `_next`, `fonts`, 확장자 있는 경로는 제외 — 정적 파일이 리다이렉트되면 안 된다
- 모바일 grain 캔버스는 `frameIntervalMs={50}` — 매 프레임 그리면 배터리·발열 문제
- 태블릿은 데스크톱 취급 (큰 화면에서 모바일 레이아웃이 더 나쁘다)

### 금지

- 요청 범위 밖 컴포넌트의 대규모 리팩터링
- 새 UI 라이브러리·디자인 시스템 추가 (사용자 승인 필요)

---

## 검증

`.github/workflows/build.yml` 이 push마다 `npm ci && npm run lint && npm run build` 를 돌린다.
로컬에서 통과시킨 뒤 push하고, **Actions 초록불까지 확인해야 완료**다.

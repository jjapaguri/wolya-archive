# 인수인계 — 앱 ↔ DB 연결층 구축

> **완료 (2026-08-25).** A0(읽기 계층)에 이어 A1(화면 교체)까지 끝났다.
> 화면이 상품을 읽는 곳은 `src/lib/products.ts` 이고, 상품 라우트 6개는 `force-dynamic` 이다.
> **아래 본문은 착수 당시 기록이라 일부가 낡았다.** 지금의 정본은
> `docs/STATUS.md`(현재 상황) · `db/README.md`(스키마·8·9단계) · `docs/MAP.md`(구조) 다.
>
> 당시 계획과 달라진 것 두 가지 — 이유는 실측으로 확인했다:
> 1. **3-2 의 "`src/data/products.ts` 의 export 를 조회로 바꾼다" 는 불가능했다.**
>    그 파일은 "use client" 컴포넌트가 `formatPrice`·`CATEGORIES` 를 가져가는 공유 모듈이라,
>    거기서 `@/lib/db` 를 import 하면 `pg` 가 브라우저 번들로 끌려가 빌드가 죽는다
>    (module-not-found, import trace 로 확인). 그래서 조회 함수는 A0 가 만들어 둔
>    `src/lib/products.ts` 에 두고, 페이지가 `await` 해서 props 로 내려준다.
> 2. **정렬은 `published_at DESC` 가 아니라 `tag_label` 오름차순이다.** 시드가
>    `published_at` 을 한 값으로 넣어 그대로 쓰면 순서가 불안정해진다.
>
> 남은 사람 작업은 **운영 DB 에 006·007·008·009 적용** 이다. 그 전까지는 원장 폴백이
> 화면을 지금 상태로 유지한다.

작성 2026-08-18 (Cowork 세션).
Cowork 세션은 npm 레지스트리가 차단돼 빌드 검증이 불가능하므로 당시 여기서 중단했다.

---

## 1. 지금 상태 (사실 확인됨)

| 항목 | 상태 |
|---|---|
| DB 스키마 | **5단계 24개 테이블 전부 서버 적용 완료** (`db/migrations/001~005`) |
| DB 데이터 | **0건.** 상품·회원·주문 전부 비어 있음 |
| 앱 ↔ DB 연결 | **없음.** `package.json` 의존성은 `next`/`react`/`react-dom` 뿐 |
| 상품 데이터 소스 | `src/data/products.ts` — 45줄 하드코딩 플레이스홀더 (`[아이템명]`, `[소재명]`) |
| 백업 | 매일 04:00 KST cron 가동 중, `~/backups/` 7일 보관 |
| 모바일 사이트 | `mobile-layout` 브랜치에 완성, CI 초록불. **main 병합·배포 미승인 상태** |
| 결제 | 통신판매업 신고 접수·확정 대기. `payments.pg_provider='manual'` 로 무통장 운영 가능 |

**즉, 사이트는 지금 DB를 전혀 쓰지 않는다. 이 작업이 첫 연결이다.**

## 2. 접속 정보

서버(`~/app`)의 `.env.local` 에 `DATABASE_URL` 이 있다 (권한 600, `.gitignore` 로 커밋 차단됨).

```bash
cd ~/app && set -a && . ./.env.local && set +a   # 셸에서 읽기
```

- DB `wolya` / 계정 `wolya_app` (superuser 아님, createdb 없음)
- `listen_addresses=localhost` — 외부에서 직접 접속 불가. 앱은 같은 서버에서 도므로 문제없음
- 로컬 개발용 DB는 별도로 띄울 것. **운영 DB에 직접 붙어 개발하지 말 것.**

## 3. 해야 할 일

### 3-1. DB 클라이언트 도입

**권장: `pg` (node-postgres) + 직접 작성한 SQL.** ORM 도입은 권하지 않는다.

이 스키마는 CHECK 제약·트리거·부분 유니크 인덱스에 비즈니스 규칙이 박혀 있다.
Prisma 같은 스키마 소유형 ORM을 붙이면 `prisma migrate` 가 우리 마이그레이션과 충돌하고,
introspect 로도 트리거·부분인덱스를 온전히 표현하지 못한다.
**`prisma migrate` 는 절대 쓰지 말 것** — 스키마 정본은 `db/migrations/` 다.

```bash
npm install pg
npm install -D @types/pg
```

`src/lib/db.ts` 에 커넥션 풀 싱글턴을 만든다. Next dev 의 핫리로드가 풀을 계속
새로 만드는 것을 막아야 한다 (globalThis 에 캐싱하는 표준 패턴).
`max` 는 10 이하로. 서버 `max_connections=100`, 인스턴스 RAM 2GB다.

### 3-2. `src/data/products.ts` 를 DB 조회로 교체

여기가 핵심이다. **이 파일 하나만 바꾸면 데스크톱과 모바일이 동시에 실제 데이터를 쓴다.**
(모바일 페이지 `src/app/m/` 도 같은 파일을 import 한다.)

- 기존 `Product` 타입과 `products`, `topRowProducts`, `bottomRowProducts` export 를 유지하면
  화면 컴포넌트를 안 고쳐도 된다. 동기 배열 → async 함수로 바뀌므로 호출부는 서버 컴포넌트에서 await.
- 조회 조건: `status='published' AND deleted_at IS NULL`, `published_at DESC`
- 재고 표시는 `product_variants.stock_quantity` 합계 (products 에는 재고가 없다)
- 대표 이미지는 `product_images.is_primary`

### 3-3. 첫 상품 투입

관리자 화면은 나중이다. 우선 SQL 로 실제 옷 2~3벌을 넣어 화면에 뜨는지 확인한다.
`db/migrations/001_products.up.sql` 의 컬럼 정의를 보고 INSERT 를 작성할 것.
주의: `status='published'` 로 넣으려면 `published_at` 이 반드시 있어야 한다 (CHECK).

## 4. 코드가 반드시 지켜야 하는 규칙

DB가 못 막는 부분이다. 어기면 조용히 사고가 난다.

- **재고 차감은 조건부 UPDATE.** 영향 행 0이면 품절 처리
  ```sql
  UPDATE product_variants SET stock_quantity = stock_quantity - $1
   WHERE id = $2 AND stock_quantity >= $1;
  ```
- **결제 금액은 서버에서 재계산.** 클라이언트가 보낸 금액을 신뢰하지 말 것
- **주문서는 스냅샷.** 상품명·단가·배송지를 값으로 복사 (참조 금지)
- **`order_no` / `return_no` 에 무작위 성분 필수.** 형식은 DB가 강제하지만 무작위성은 앱 책임
- **이메일은 `lower()` 후 저장.** 안 하면 INSERT 거부됨
- **비밀번호는 bcrypt/argon2 해시만.** 평문은 DB가 거부함
- **SQL 은 파라미터 바인딩만.** 문자열 결합 금지
- **비밀값은 `.env`.** 커밋 금지
- 결제 시점에 상품 가격을 다시 읽을 것 (장바구니에 가격 미저장)

단계별 상세 규칙은 `db/README.md` 가 정본이다. 착수 전 한 번 읽을 것.

## 5. 환경 관련 함정

- **`middleware.ts` 아니고 `proxy.ts`** — Next 16 에서 middleware 파일 규약이 deprecated 됐다.
  `mobile-layout` 브랜치에 `src/proxy.ts` 로 들어가 있다.
- **이 Next.js 버전은 학습 데이터와 다르다.** 라우팅·캐싱·서버액션 코드 전에
  `node_modules/next/dist/docs/` 의 해당 가이드를 먼저 읽을 것 (AGENTS.md 최상단 경고).
- **검증은 GitHub Actions.** push 하면 `npm ci && npm run lint && npm run build` 가 자동으로 돈다.
  초록불 확인 전에는 배포하지 말 것.
- **배포는 승인 필요.** `~/deploy.sh` 는 사용자 승인 후 실행.

## 6. 완료 기준

1. `npm run lint` && `npm run build` 통과 (GitHub Actions 초록불)
2. 로컬에서 실제 DB 상품이 데스크톱(`/`)과 모바일(`/m`) 양쪽에 뜬다
3. 상품 0건일 때도 화면이 깨지지 않는다 (빈 상태 처리)
4. 커넥션 풀이 핫리로드에서 누수되지 않는다

## 7. 이어서 할 일 (이 작업 이후)

- 관리자 상품 등록 화면
- `mobile-layout` → main 병합 및 배포 (승인 대기)
- 장바구니·주문 API (스키마는 이미 준비됨)

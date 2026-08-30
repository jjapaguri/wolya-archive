import Link from "next/link";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import AdminProductSqlForm from "@/components/AdminProductSqlForm";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "상품 등록 SQL 생성 | WOLYA ARCHIVE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * A1(2026-08-25) 이후 화면의 정본은 DB 라 `src/data/products.ts` 원장에 항목을 추가해도
 * 사이트에 반영되지 않는다. 이 화면은 그 빈틈의 임시 창구다 — DB 에 직접 쓰지 않고,
 * `scripts/gen_seed_sql.mjs` 와 같은 규칙으로 신상품 1건짜리 시드 SQL 을 만들어 보여준다.
 * 사람이 내용을 확인하고 psql 로 직접 적용한다(`docs/BACKLOG.md` "관리자 상품 등록 화면").
 *
 * 이 레포엔 진짜 관리자 화면이 없다 — `users.role` 은 있지만 그 값을 확인하는 화면이
 * 지금까지 하나도 없었다(006 마이그레이션 주석이 예고한 "어드민(B단계)"가 이 화면이 처음이다).
 * `role='admin'` 인 로그인 사용자만 통과시킨다. 로그인하지 않았거나 admin 이 아니면
 * 존재를 드러내지 않고 홈으로 보낸다 — 404 대신 리다이렉트를 쓴 이유는 `/account` 와
 * 같은 패턴을 유지하기 위해서다(로그인 안 한 사람은 /login 으로).
 *
 * `/` `/m` 짝을 만들지 않았다 — 고객이 보는 화면이 아니라 운영자 한 명이 쓰는 내부
 * 도구라 데스크톱/모바일 이중 라우트 규칙(고객 화면 대상)의 적용 범위 밖이라고 판단했다.
 * Tailwind 반응형 클래스만으로 휴대폰에서도 입력 가능하게 했다.
 */
export default async function AdminNewProductPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <>
        <GrainOverlay />
        <main className="relative z-10 mx-auto max-w-[720px] px-6 pt-16 pb-24 lg:pt-24">
          <p className="font-kr text-sm text-fg/70">
            로그인이 필요합니다.{" "}
            <Link href="/login?next=%2Fadmin%2Fproducts%2Fnew" className="text-accent underline">
              로그인
            </Link>
          </p>
        </main>
      </>
    );
  }

  if (user.role !== "admin") {
    return (
      <>
        <GrainOverlay />
        <main className="relative z-10 mx-auto max-w-[720px] px-6 pt-16 pb-24 lg:pt-24">
          <p className="font-kr text-sm text-fg/70">
            이 페이지를 볼 권한이 없습니다.{" "}
            <Link href="/" className="text-accent underline">
              홈으로
            </Link>
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <GrainOverlay />
      <main className="relative z-10 mx-auto max-w-[720px] px-6 pt-16 pb-24 lg:pt-24">
        <Link
          href="/"
          className="mb-10 inline-block font-sans text-[10px] tracking-[0.2em] text-fg/50 uppercase transition-colors hover:text-accent"
        >
          ← 홈으로
        </Link>

        <h1 className="word-keep-all mb-3 font-maruburi text-2xl leading-relaxed font-semibold lg:text-3xl">
          상품 등록 SQL 생성
        </h1>
        <p className="word-keep-all mb-10 font-kr text-[13px] leading-[1.7] text-fg/60">
          여기서 입력한 값은 DB 에 바로 쓰이지 않습니다. 아래 SQL 을 직접 검토한 뒤{" "}
          <code className="font-mono text-xs text-fg/80">
            psql &quot;$DATABASE_URL&quot; -v ON_ERROR_STOP=1 -f &lt;파일&gt;
          </code>{" "}
          로 사람이 적용하세요.
        </p>

        <AdminProductSqlForm />
      </main>
    </>
  );
}

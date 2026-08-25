/**
 * PostgreSQL 커넥션 풀.
 *
 * Next dev 의 HMR 이 모듈을 다시 평가할 때마다 풀이 새로 생기면 커넥션이 샌다.
 * globalThis 에 매달아 싱글턴으로 만든다.
 *
 * **풀은 첫 질의 때 만든다(지연 생성).** 모듈 최상단에서 만들면 `DATABASE_URL` 이 없는
 * 환경에서 import 하는 것만으로 던진다 — 그러면 `next build` 의 페이지 데이터 수집
 * 단계가 통째로 죽어서, 조회 계층의 폴백(`src/lib/products.ts`)이 손도 못 써 본다.
 * 실제로 CI 러너에는 `DATABASE_URL` 이 없다.
 *
 * 원칙 (AGENTS.md 2절)
 *  - 파라미터 바인딩만 쓴다. 문자열 연결로 SQL 을 만들지 않는다.
 *  - 에러 메시지에 DATABASE_URL 값을 넣지 않는다 (자격증명이 로그로 샌다).
 */
import { Pool } from "pg";

declare global {
  var __wolyaPool: Pool | undefined;
}

function create(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL 이 설정돼 있지 않다");
  }
  return new Pool({
    connectionString,
    max: 5, // 인스턴스 2GB, PG max_connections=100. 넉넉히 잡을 이유가 없다
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

/** 풀 싱글턴. 없으면 이때 만든다. `DATABASE_URL` 이 없으면 던진다. */
export function getPool(): Pool {
  const existing = globalThis.__wolyaPool;
  if (existing) return existing;

  const pool = create();
  // 개발만이 아니라 항상 매단다 — 운영에서도 모듈이 두 번 평가되면 풀이 두 개가 된다.
  globalThis.__wolyaPool = pool;
  return pool;
}

/** 파라미터 바인딩 전용 질의 헬퍼. */
export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const res = await getPool().query(text, params as never[]);
  return res.rows as T[];
}

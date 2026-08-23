/**
 * PostgreSQL 커넥션 풀.
 *
 * Next dev 의 HMR 이 모듈을 다시 평가할 때마다 풀이 새로 생기면 커넥션이 샌다.
 * globalThis 에 매달아 싱글턴으로 만든다.
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

export const pool: Pool = globalThis.__wolyaPool ?? create();
if (process.env.NODE_ENV !== "production") globalThis.__wolyaPool = pool;

/** 파라미터 바인딩 전용 질의 헬퍼. */
export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const res = await pool.query(text, params as never[]);
  return res.rows as T[];
}

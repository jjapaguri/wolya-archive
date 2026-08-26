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

/** `DATABASE_URL` 이 설정돼 있는지. 없으면 DB 를 쓰는 기능은 조용히 꺼진다. */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * 트랜잭션 하나를 열고 콜백에 클라이언트를 넘긴다.
 *
 * 주문 생성은 재고 차감·주문서·결제 기록이 **전부 성공하거나 전부 없어야** 한다.
 * 중간에 던지면 ROLLBACK 하고 그대로 다시 던진다. 커넥션은 어느 경로로도 반드시 반납한다.
 *
 * `actor` 를 주면 트랜잭션 안에서 `wolya.actor` 를 세운다 — 004 의 주문 상태 이력
 * 트리거가 이 값을 "누가 바꿨는지" 로 기록한다. 미지정 시 'system' 으로 남는다.
 */
export async function withTransaction<T>(
  run: (client: import("pg").PoolClient) => Promise<T>,
  actor?: "system" | "admin" | "customer" | "pg_webhook"
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    if (actor) {
      // set_config 로 넘겨야 파라미터 바인딩이 된다. SET LOCAL 은 값 자리에 바인딩을 못 쓴다.
      await client.query("SELECT set_config('wolya.actor', $1, true)", [actor]);
    }
    const result = await run(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // 롤백 실패는 원인 오류를 덮지 않는다 — 커넥션이 이미 끊긴 경우가 대부분이다.
    }
    throw error;
  } finally {
    client.release();
  }
}

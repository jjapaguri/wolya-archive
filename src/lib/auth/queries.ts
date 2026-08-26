/**
 * 인증 관련 SQL. **서버 전용.**
 *
 * 원칙 (AGENTS.md 2절)
 *  - 파라미터 바인딩만. 문자열 연결로 SQL 을 만들지 않는다. ORM 을 쓰지 않는다.
 *  - 이메일은 항상 소문자로 넣는다 (`users_email_lowercase` CHECK).
 *  - 동의는 boolean 이 아니라 **시각**으로 넣는다.
 *  - 비밀번호 해시는 이 파일 밖으로 나가지 않는다. 로그에 찍지 않는다.
 *
 * BIGINT 는 `pg` 가 문자열로 돌려준다(53비트 넘는 값이 부동소수로 뭉개지는 것을 피하려고).
 * 그래서 id 타입은 전부 `string` 이다.
 */
import { getPool, query } from "@/lib/db";
import type { SocialProfile, SocialProvider } from "@/lib/auth/social";
import type { AccountAddress } from "@/lib/auth/types";

type AddressRow = {
  id: string;
  label: string | null;
  recipient: string;
  phone: string;
  postcode: string;
  address1: string;
  address2: string | null;
  is_default: boolean;
};

/** 로그인 검증에 필요한 최소한. 해시는 호출부가 즉시 쓰고 버린다. */
export async function findLoginTarget(
  email: string
): Promise<{ id: string; passwordHash: string | null } | null> {
  const rows = await query<{ id: string; password_hash: string | null }>(
    `SELECT id, password_hash
       FROM users
      WHERE email = $1
        AND deleted_at IS NULL
        AND status = 'active'
      LIMIT 1`,
    [email]
  );
  const row = rows[0];
  return row ? { id: row.id, passwordHash: row.password_hash } : null;
}

export async function emailTaken(email: string): Promise<boolean> {
  const rows = await query<{ exists: boolean }>(
    `SELECT true AS exists FROM users WHERE email = $1 LIMIT 1`,
    [email]
  );
  return rows.length > 0;
}

/**
 * 이메일+비밀번호 가입.
 *
 * `marketingAgreed` 는 boolean 으로 받지만 **저장은 시각으로** 한다 — 동의한 순간이
 * 분쟁 시 증빙이다(`db/README.md` 2단계 요점). 미동의는 NULL 이다.
 */
export async function createPasswordUser(params: {
  email: string;
  passwordHash: string;
  name: string;
  phone: string | null;
  marketingAgreed: boolean;
}): Promise<string> {
  const rows = await query<{ id: string }>(
    `INSERT INTO users (email, password_hash, name, phone,
                        terms_agreed_at, privacy_agreed_at, marketing_agreed_at)
     VALUES ($1, $2, $3, $4, now(), now(), CASE WHEN $5 THEN now() ELSE NULL END)
     RETURNING id`,
    [params.email, params.passwordHash, params.name, params.phone, params.marketingAgreed]
  );
  return rows[0].id;
}

/** 유니크 위반인가 (이메일 중복 등). `pg` 는 code 를 문자열로 준다. */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "23505"
  );
}

/**
 * 소셜 프로필 → 회원. 없으면 만든다.
 *
 * 순서가 중요하다.
 *  1. `(provider, provider_user_id)` 로 이미 연결된 회원이 있으면 그 회원이다.
 *  2. 없고, 제공자가 **확인해 준** 이메일이 기존 회원과 같으면 그 회원에 연결한다.
 *     확인 안 된 이메일로는 연결하지 않는다 — 남의 계정에 올라타는 경로가 된다.
 *  3. 그래도 없으면 새로 만든다. 이때 이메일은 확인된 경우에만 넣는다
 *     (`users.email` 은 NULL 을 허용한다).
 *
 * 전부 한 트랜잭션에서 한다. 2·3 사이에 다른 요청이 끼어들면 같은 사람이 두 계정이 된다.
 */
export async function findOrCreateSocialUser(
  provider: SocialProvider,
  profile: SocialProfile,
  fallbackName: string
): Promise<string> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");

    const linked = await client.query<{ user_id: string }>(
      `SELECT s.user_id
         FROM user_social_accounts s
         JOIN users u ON u.id = s.user_id
        WHERE s.provider = $1
          AND s.provider_user_id = $2
          AND u.deleted_at IS NULL
        LIMIT 1`,
      [provider, profile.providerUserId]
    );
    if (linked.rows[0]) {
      await client.query("COMMIT");
      return linked.rows[0].user_id;
    }

    const trustedEmail =
      profile.emailVerified && profile.email ? profile.email.trim().toLowerCase() : null;

    if (trustedEmail) {
      // FOR UPDATE — 같은 이메일로 동시에 두 소셜 로그인이 들어와도 하나만 연결된다
      const existing = await client.query<{ id: string }>(
        `SELECT id FROM users
          WHERE email = $1 AND deleted_at IS NULL AND status = 'active'
          LIMIT 1
          FOR UPDATE`,
        [trustedEmail]
      );
      if (existing.rows[0]) {
        const userId = existing.rows[0].id;
        await client.query(
          `INSERT INTO user_social_accounts (user_id, provider, provider_user_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (provider, provider_user_id) DO NOTHING`,
          [userId, provider, profile.providerUserId]
        );
        await client.query("COMMIT");
        return userId;
      }
    }

    const name = (profile.name ?? "").trim().slice(0, 80) || fallbackName;
    const created = await client.query<{ id: string }>(
      `INSERT INTO users (email, name, terms_agreed_at, privacy_agreed_at)
       VALUES ($1, $2, now(), now())
       RETURNING id`,
      [trustedEmail, name]
    );
    const userId = created.rows[0].id;

    await client.query(
      `INSERT INTO user_social_accounts (user_id, provider, provider_user_id)
       VALUES ($1, $2, $3)`,
      [userId, provider, profile.providerUserId]
    );

    await client.query("COMMIT");
    return userId;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/** 이 회원에 연결된 소셜 제공자. 내 정보 화면이 "무엇으로 로그인하나" 를 보여준다. */
export async function listLinkedProviders(userId: string): Promise<SocialProvider[]> {
  const rows = await query<{ provider: SocialProvider }>(
    `SELECT provider FROM user_social_accounts WHERE user_id = $1 ORDER BY provider`,
    [userId]
  );
  return rows.map((row) => row.provider);
}

export async function updateLastLogin(userId: string): Promise<void> {
  await query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [userId]).catch(() => {});
}

/** 내 정보 — 이름·휴대폰·마케팅 수신 동의. 이메일은 여기서 바꾸지 않는다. */
export async function updateProfile(params: {
  userId: string;
  name: string;
  phone: string | null;
  marketingAgreed: boolean;
}): Promise<void> {
  await query(
    `UPDATE users
        SET name = $2,
            phone = $3,
            -- 이미 동의한 시각은 유지한다. 새로 동의하면 그때 시각을 찍고,
            -- 철회하면 NULL 로 되돌린다 (boolean 으로 바꾸지 않는다)
            marketing_agreed_at = CASE
              WHEN $4 THEN COALESCE(marketing_agreed_at, now())
              ELSE NULL
            END
      WHERE id = $1`,
    [params.userId, params.name, params.phone, params.marketingAgreed]
  );
}

export async function listAddresses(userId: string): Promise<AccountAddress[]> {
  const rows = await query<AddressRow>(
    `SELECT id, label, recipient, phone, postcode, address1, address2, is_default
       FROM user_addresses
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC`,
    [userId]
  );
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    recipient: row.recipient,
    phone: row.phone,
    postcode: row.postcode,
    address1: row.address1,
    address2: row.address2,
    isDefault: row.is_default,
  }));
}

/**
 * 배송지 추가/수정.
 *
 * 기본 배송지는 회원당 1개 뿐이라(`uq_user_addresses_default` 부분 유니크 인덱스)
 * 새로 기본으로 지정하려면 **같은 트랜잭션에서** 기존 기본을 먼저 내려야 한다.
 * 나눠서 하면 그 사이에 유니크 위반이 난다.
 *
 * `addressId` 가 있으면 수정인데, **WHERE 에 user_id 를 반드시 같이 건다** —
 * 안 그러면 남의 배송지 id 를 넣어 남의 주소를 고칠 수 있다.
 */
export async function saveAddress(params: {
  userId: string;
  addressId: string | null;
  label: string | null;
  recipient: string;
  phone: string;
  postcode: string;
  address1: string;
  address2: string | null;
  isDefault: boolean;
}): Promise<boolean> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");

    // 첫 배송지는 무조건 기본이 된다 — 주문서에 채워 넣을 것이 하나는 있어야 한다
    let makeDefault = params.isDefault;
    if (!makeDefault) {
      const count = await client.query<{ n: string }>(
        `SELECT count(*) AS n FROM user_addresses WHERE user_id = $1`,
        [params.userId]
      );
      if (Number(count.rows[0].n) === 0) makeDefault = true;
    }

    if (makeDefault) {
      await client.query(
        `UPDATE user_addresses SET is_default = false
          WHERE user_id = $1 AND is_default`,
        [params.userId]
      );
    }

    let affected: number;
    if (params.addressId) {
      const updated = await client.query(
        `UPDATE user_addresses
            SET label = $3, recipient = $4, phone = $5, postcode = $6,
                address1 = $7, address2 = $8, is_default = $9
          WHERE id = $1 AND user_id = $2`,
        [
          params.addressId,
          params.userId,
          params.label,
          params.recipient,
          params.phone,
          params.postcode,
          params.address1,
          params.address2,
          makeDefault,
        ]
      );
      affected = updated.rowCount ?? 0;
    } else {
      const inserted = await client.query(
        `INSERT INTO user_addresses
           (user_id, label, recipient, phone, postcode, address1, address2, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          params.userId,
          params.label,
          params.recipient,
          params.phone,
          params.postcode,
          params.address1,
          params.address2,
          makeDefault,
        ]
      );
      affected = inserted.rowCount ?? 0;
    }

    await client.query("COMMIT");
    return affected > 0;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/** 배송지 삭제. `user_id` 를 같이 걸어 남의 것을 지울 수 없게 한다. */
export async function deleteAddress(userId: string, addressId: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `DELETE FROM user_addresses WHERE id = $1 AND user_id = $2 RETURNING id`,
    [addressId, userId]
  );
  return rows.length > 0;
}

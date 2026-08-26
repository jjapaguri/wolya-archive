/**
 * 비밀번호 해시 — Node 내장 `crypto` 의 scrypt 만 쓴다.
 *
 * **서버 전용이다.** "use client" 파일에서 import 하지 않는다.
 *
 * bcrypt·argon2 패키지를 설치하지 않는 것은 이 레포의 제약이다(새 의존성 추가 금지).
 * scrypt 는 Node 표준 라이브러리에 있고 메모리-하드 함수라 GPU 대량 대입에 강하다 —
 * 라이브러리 없이 쓸 수 있는 선택지 중 이것이 가장 낫다.
 *
 * 저장 형식 (modular crypt 꼴, DB 의 `users_password_is_hash` CHECK 가 이 앞머리를 본다):
 *
 *   $scrypt$N=16384,r=8,p=1$<salt base64url>$<derived key base64url>
 *
 * 파라미터를 문자열에 같이 적어 두는 이유는 **나중에 비용을 올려도 옛 해시를 계속
 * 검증할 수 있게** 하기 위해서다. 검증은 해시에 적힌 파라미터를 그대로 쓴다.
 *
 * ── 절대 하지 않는 것 ──────────────────────────────────────────
 *  - 평문이든 해시든 로그에 찍지 않는다 (console.* 에 값이 흘러가는 코드를 두지 않는다)
 *  - 비교에 `===` 를 쓰지 않는다. 타이밍 공격이 가능하다 → `timingSafeEqual`
 *  - 솔트를 상수로 두지 않는다. 계정마다 새로 뽑는다 (같은 비밀번호가 같은 해시가 되면
 *    한 번의 레인보우 테이블로 전부 뚫린다)
 */
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

/**
 * `promisify(scrypt)` 은 오버로드 중 옵션 없는 3인자 꼴만 잡아서 비용 파라미터를 못 넘긴다.
 * 그래서 직접 감싼다.
 */
function scrypt(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, options, (error, derived) => {
      if (error) reject(error);
      else resolve(derived);
    });
  });
}

/**
 * 비용 파라미터. N 은 2의 거듭제곱이어야 한다.
 * N=16384, r=8 → 약 16MB (128 × N × r). Node 기본 maxmem(32MB) 안에 든다.
 * 인스턴스가 2GB 라 이보다 크게 잡으면 동시 로그인에서 메모리가 튄다.
 */
const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/** scrypt 는 N·r 이 커지면 기본 maxmem 을 넘는다. 여유를 두고 명시한다. */
const MAX_MEM = 64 * 1024 * 1024;

const PREFIX = "$scrypt$";

function encode(buffer: Buffer): string {
  return buffer.toString("base64url");
}

/**
 * 평문 비밀번호 → 저장할 해시 문자열.
 * 호출한 쪽은 평문을 변수에 오래 들고 있지 않는다.
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await scrypt(plain.normalize("NFKC"), salt, KEY_LENGTH, {
    N,
    r: R,
    p: P,
    maxmem: MAX_MEM,
  });

  return `${PREFIX}N=${N},r=${R},p=${P}$${encode(salt)}$${encode(derived)}`;
}

type ParsedHash = {
  N: number;
  r: number;
  p: number;
  salt: Buffer;
  key: Buffer;
};

/** 저장된 해시 문자열을 되읽는다. 형식이 아니면 null (던지지 않는다 — 검증 흐름이 끊기면 안 된다). */
function parse(stored: string): ParsedHash | null {
  if (!stored.startsWith(PREFIX)) return null;

  const parts = stored.split("$");
  // ["", "scrypt", "N=..,r=..,p=..", salt, key]
  if (parts.length !== 5) return null;

  const params = new Map<string, number>();
  for (const pair of parts[2].split(",")) {
    const [key, value] = pair.split("=");
    const parsed = Number(value);
    if (!key || !Number.isFinite(parsed)) return null;
    params.set(key, parsed);
  }

  const n = params.get("N");
  const r = params.get("r");
  const p = params.get("p");
  if (!n || !r || !p) return null;

  try {
    const salt = Buffer.from(parts[3], "base64url");
    const key = Buffer.from(parts[4], "base64url");
    if (salt.length === 0 || key.length === 0) return null;
    return { N: n, r, p, salt, key };
  } catch {
    return null;
  }
}

/**
 * 평문이 저장된 해시와 맞는지. 맞으면 true.
 *
 * 형식이 깨졌거나 scrypt 가 던져도 **false 를 돌려준다** — 여기서 예외가 새면
 * 호출부가 "이메일은 있는데 비밀번호 검증이 터졌다" 는 사실을 응답으로 흘릴 수 있다.
 */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parsed = parse(stored);
  if (!parsed) return false;

  try {
    const derived = await scrypt(plain.normalize("NFKC"), parsed.salt, parsed.key.length, {
      N: parsed.N,
      r: parsed.r,
      p: parsed.p,
      maxmem: MAX_MEM,
    });

    // 길이가 다르면 timingSafeEqual 이 던진다. 먼저 확인한다
    if (derived.length !== parsed.key.length) return false;
    return timingSafeEqual(derived, parsed.key);
  } catch {
    return false;
  }
}

/**
 * 존재하지 않는 계정에 대해서도 같은 시간을 쓰기 위한 더미 해시.
 *
 * 이게 없으면 "이메일이 없는 로그인" 이 눈에 띄게 빨리 끝나서, 응답 문구를 아무리
 * 똑같이 맞춰도 **응답 시간으로 가입 여부가 새어 나간다.**
 * 값은 고정이고 어떤 비밀번호와도 맞지 않는다 (솔트·키가 무작위 상수).
 */
const DUMMY_HASH = `${PREFIX}N=${N},r=${R},p=${P}$${encode(
  Buffer.from("d29seWEtZHVtbXktc2FsdA", "base64url")
)}$${encode(Buffer.alloc(KEY_LENGTH, 0))}`;

/** 계정을 못 찾았을 때 호출한다. 항상 false 를 돌려주지만 시간은 진짜 검증만큼 쓴다. */
export async function verifyPasswordDummy(plain: string): Promise<boolean> {
  return verifyPassword(plain, DUMMY_HASH);
}

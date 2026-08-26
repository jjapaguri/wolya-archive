/**
 * 인증 폼 입력 검증 — 서버가 정본이다.
 *
 * 이 파일은 `pg` 를 끌어오지 않으므로 클라이언트 컴포넌트에서도 import 할 수 있다.
 * 다만 **클라이언트 검증은 편의일 뿐이고 판단은 항상 서버에서 다시 한다.**
 * (Server Action 은 UI 를 거치지 않고 직접 POST 될 수 있다.)
 *
 * 개인정보 최소 수집 — 여기서 받는 것은 가입·주문에 실제로 쓰는 값뿐이다.
 * 생년월일·성별은 스키마에 컬럼조차 없다(`db/README.md` 2단계 요점).
 */

/** DB 의 `users_email_shape` CHECK 와 같은 수준으로만 본다. 과하게 좁히지 않는다. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN_LENGTH = 10;
/** scrypt 는 길이 제한이 없지만, 무한정 긴 입력은 그 자체가 부하다. */
export const PASSWORD_MAX_LENGTH = 200;

/** 이메일을 저장 형태로 다듬는다. **DB 는 소문자만 받는다**(`users_email_lowercase`). */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return email.length <= 255 && EMAIL_SHAPE.test(email);
}

/**
 * 비밀번호 규칙. 길이를 우선한다 — 특수문자 강제는 사람들을 `Password1!` 로 몰아갈 뿐이다.
 * 반환값이 null 이면 통과.
 */
export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `비밀번호는 ${PASSWORD_MAX_LENGTH}자 이하여야 합니다.`;
  }
  // 같은 문자만 반복하는 것은 길이만 채운 것이다
  if (new Set(password).size < 4) {
    return "비밀번호에 서로 다른 문자를 4종류 이상 쓰세요.";
  }
  return null;
}

/** 휴대폰 번호는 숫자만 남긴다. 하이픈 유무로 중복 판정이 갈리지 않게. */
export function normalizePhone(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

export function isValidPhone(digits: string): boolean {
  // 국내 휴대폰: 010/011/016/017/018/019 + 7~8자리
  return /^01[016789][0-9]{7,8}$/.test(digits);
}

/** 화면에 보여줄 때 쓰는 표기. 저장은 숫자만. */
export function formatPhone(digits: string): string {
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return digits;
}

export function isValidName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 80;
}

/** 우편번호는 5자리 새 주소 체계만 받는다. */
export function isValidPostcode(postcode: string): boolean {
  return /^[0-9]{5}$/.test(postcode.trim());
}

/**
 * 로그인 후 돌아갈 경로. **외부 주소로 튕겨 보내지 않는다** (open redirect 차단).
 * 같은 사이트 안의 절대경로만 통과시킨다.
 */
export function safeNextPath(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  // `//evil.com` 은 브라우저가 프로토콜 상대 URL 로 읽는다. `/\` 도 마찬가지
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}

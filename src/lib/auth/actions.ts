"use server";

/**
 * 인증 Server Action — 회원가입·로그인·로그아웃·내 정보·주소록.
 *
 * `"use server"` 파일은 **async 함수만** export 할 수 있다. 타입·상수는
 * `@/lib/auth/form-state` 에 있다.
 *
 * ── 이 파일이 지키는 것 ──────────────────────────────────────────
 *  - Server Action 은 UI 를 거치지 않고 직접 POST 될 수 있다. 그래서 **모든 함수가
 *    자기 손으로 세션을 확인하고 입력을 다시 검증한다.** 화면에서 막았다는 것은 근거가 아니다.
 *  - 평문 비밀번호도 해시도 `console.*` 에 넘기지 않는다.
 *  - 로그인 실패 문구는 하나뿐이다 (`LOGIN_FAILED_MESSAGE`).
 *  - `redirect()` 는 내부적으로 throw 하므로 **try 블록 밖에서** 부른다
 *    (Next 16 문서 `redirect.md` 의 "Good to know").
 *
 * ── 이 파일이 하지 않는 것 ──────────────────────────────────────
 * 장바구니·주문·결제를 건드리지 않는다. 로그인은 구매의 관문이 아니다 —
 * 비회원 주문(`orders.user_id IS NULL`)은 이 코드와 무관하게 그대로 동작한다.
 * (로그인 시 세션 장바구니를 회원 장바구니로 옮기는 병합은 주문 쪽 작업이라 여기서 하지 않는다.
 *  `docs/BACKLOG.md` 에 항목으로 남겼다.)
 */

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hashPassword, verifyPassword, verifyPasswordDummy } from "@/lib/auth/password";
import { createSession, destroySession, getSessionUser } from "@/lib/auth/session";
import { checkLoginRateLimit, clientIp, recordLoginAttempt } from "@/lib/auth/rate-limit";
import {
  createPasswordUser,
  deleteAddress,
  findLoginTarget,
  isUniqueViolation,
  saveAddress,
  updateLastLogin,
  updateProfile,
} from "@/lib/auth/queries";
import { LOGIN_FAILED_MESSAGE, type AuthFormState } from "@/lib/auth/form-state";
import {
  isValidEmail,
  isValidName,
  isValidPhone,
  isValidPostcode,
  normalizeEmail,
  normalizePhone,
  passwordProblem,
  safeNextPath,
} from "@/lib/auth/validation";

/** DB 가 없으면 인증 기능은 통째로 못 쓴다. 화면이 5xx 를 뱉는 대신 문구로 알린다. */
const DB_DOWN_MESSAGE = "지금은 회원 기능을 쓸 수 없습니다. 잠시 후 다시 시도해 주세요.";

function fail(error: string, field?: AuthFormState["field"]): AuthFormState {
  return { error, field: field ?? null };
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function checked(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

/** 데스크톱(`/`)과 모바일(`/m`)이 같은 액션을 쓰므로 돌아갈 곳은 폼이 알려준다. */
function nextPath(formData: FormData, fallback: string): string {
  return safeNextPath(text(formData, "next") || null, fallback);
}

// ── 회원가입 ──────────────────────────────────────────────────────

export async function signupAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = normalizeEmail(text(formData, "email"));
  const password = text(formData, "password");
  const passwordConfirm = text(formData, "passwordConfirm");
  const name = text(formData, "name").trim();
  const phoneRaw = text(formData, "phone").trim();
  const target = nextPath(formData, "/account");

  if (!isValidEmail(email)) return fail("이메일 주소를 다시 확인해 주세요.", "email");
  if (!isValidName(name)) return fail("이름을 입력해 주세요.", "name");

  const passwordIssue = passwordProblem(password);
  if (passwordIssue) return fail(passwordIssue, "password");
  if (password !== passwordConfirm) {
    return fail("비밀번호 확인이 일치하지 않습니다.", "password");
  }

  // 휴대폰은 선택. 넣었으면 형식은 맞아야 한다 (주문 조회에 쓰는 값이다)
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  if (phone && !isValidPhone(phone)) {
    return fail("휴대폰 번호를 다시 확인해 주세요.", "phone");
  }

  // 필수 동의 — 시각으로 저장한다(AGENTS.md 불변규칙 7)
  if (!checked(formData, "agreeTerms") || !checked(formData, "agreePrivacy")) {
    return fail("이용약관과 개인정보처리방침에 동의해야 가입할 수 있습니다.");
  }

  if (!process.env.DATABASE_URL) return fail(DB_DOWN_MESSAGE);

  let userId: string;
  try {
    const passwordHash = await hashPassword(password);
    userId = await createPasswordUser({
      email,
      passwordHash,
      name,
      phone,
      marketingAgreed: checked(formData, "agreeMarketing"),
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      // 가입 화면에서는 알려줄 수밖에 없다 — 안 알려주면 가입이 왜 안 되는지 알 길이 없다.
      // (로그인 화면에서는 반대다. 거기선 절대 구분해 주지 않는다)
      return fail("이미 가입된 이메일입니다. 로그인해 주세요.", "email");
    }
    // 원문 오류를 화면에 흘리지 않는다 — DB 구조·자격증명이 새어 나갈 수 있다
    return fail(DB_DOWN_MESSAGE);
  }

  try {
    await createSession(userId);
  } catch {
    // 계정은 만들어졌으니 로그인 화면으로 보낸다
    return fail("가입은 됐지만 자동 로그인에 실패했습니다. 로그인해 주세요.");
  }

  redirect(target);
}

// ── 로그인 ────────────────────────────────────────────────────────

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = normalizeEmail(text(formData, "email"));
  const password = text(formData, "password");
  const target = nextPath(formData, "/account");

  if (!email || !password) return fail(LOGIN_FAILED_MESSAGE);
  if (!process.env.DATABASE_URL) return fail(DB_DOWN_MESSAGE);

  const ip = clientIp(await headers());

  // 형식이 틀린 이메일도 시도로 친다 — 여기서 빨리 돌려보내면 속도 제한을 우회당한다
  const limitKey = isValidEmail(email) ? email : null;

  const verdict = await checkLoginRateLimit(limitKey, ip);
  if (verdict.blocked) {
    const minutes = Math.ceil(verdict.retryAfterSeconds / 60);
    return fail(`로그인 시도가 너무 잦습니다. ${minutes}분 후에 다시 시도해 주세요.`);
  }

  let userId: string | null = null;
  try {
    const account = limitKey ? await findLoginTarget(limitKey) : null;

    if (account?.passwordHash) {
      if (await verifyPassword(password, account.passwordHash)) userId = account.id;
    } else {
      // 계정이 없거나 소셜 전용이어도 **같은 시간**을 쓴다.
      // 안 그러면 응답 속도만으로 가입 여부가 새어 나간다
      await verifyPasswordDummy(password);
    }
  } catch {
    return fail(DB_DOWN_MESSAGE);
  }

  await recordLoginAttempt(limitKey, ip, userId !== null);

  if (!userId) return fail(LOGIN_FAILED_MESSAGE);

  try {
    await createSession(userId);
    await updateLastLogin(userId);
  } catch {
    return fail(DB_DOWN_MESSAGE);
  }

  redirect(target);
}

// ── 로그아웃 ──────────────────────────────────────────────────────

/**
 * 쿠키만 지우지 않는다. `user_sessions.revoked_at` 을 찍어 **서버 쪽 세션을 실제로 죽인다.**
 */
export async function logoutAction(formData: FormData): Promise<void> {
  const target = nextPath(formData, "/");
  await destroySession();
  redirect(target);
}

// ── 내 정보 ───────────────────────────────────────────────────────

export async function updateProfileAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const user = await getSessionUser();
  if (!user) return fail("로그인이 필요합니다.");

  const name = text(formData, "name").trim();
  if (!isValidName(name)) return fail("이름을 입력해 주세요.", "name");

  const phoneRaw = text(formData, "phone").trim();
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  if (phone && !isValidPhone(phone)) {
    return fail("휴대폰 번호를 다시 확인해 주세요.", "phone");
  }

  try {
    await updateProfile({
      userId: user.id,
      name,
      phone,
      marketingAgreed: checked(formData, "agreeMarketing"),
    });
  } catch {
    return fail(DB_DOWN_MESSAGE);
  }

  // 저장한 값이 화면에 바로 반영되도록 현재 라우트를 다시 그린다 (Next 16 `next/cache`)
  refresh();
  return { error: null, message: "저장했습니다." };
}

// ── 주소록 ────────────────────────────────────────────────────────

export async function saveAddressAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const user = await getSessionUser();
  if (!user) return fail("로그인이 필요합니다.");

  const recipient = text(formData, "recipient").trim();
  const phone = normalizePhone(text(formData, "phone"));
  const postcode = text(formData, "postcode").trim();
  const address1 = text(formData, "address1").trim();
  const address2 = text(formData, "address2").trim();
  const label = text(formData, "label").trim();
  const addressId = text(formData, "addressId").trim() || null;

  if (!isValidName(recipient)) return fail("받는 분 이름을 입력해 주세요.", "address");
  if (!isValidPhone(phone)) return fail("받는 분 휴대폰 번호를 다시 확인해 주세요.", "phone");
  if (!isValidPostcode(postcode)) return fail("우편번호 5자리를 입력해 주세요.", "address");
  if (!address1 || address1.length > 255) return fail("주소를 입력해 주세요.", "address");
  if (address2.length > 255) return fail("상세 주소가 너무 깁니다.", "address");
  // id 는 BIGINT 다. 숫자가 아니면 남의 것을 노린 요청이거나 깨진 폼이다
  if (addressId && !/^[0-9]+$/.test(addressId)) return fail("주소를 다시 선택해 주세요.", "address");

  try {
    const saved = await saveAddress({
      userId: user.id,
      addressId,
      label: label || null,
      recipient,
      phone,
      postcode,
      address1,
      address2: address2 || null,
      isDefault: checked(formData, "isDefault"),
    });
    if (!saved) return fail("주소를 찾지 못했습니다.", "address");
  } catch {
    return fail(DB_DOWN_MESSAGE);
  }

  refresh();
  return { error: null, message: "배송지를 저장했습니다." };
}

export async function deleteAddressAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const user = await getSessionUser();
  if (!user) return fail("로그인이 필요합니다.");

  const addressId = text(formData, "addressId").trim();
  if (!/^[0-9]+$/.test(addressId)) return fail("주소를 다시 선택해 주세요.", "address");

  try {
    const removed = await deleteAddress(user.id, addressId);
    if (!removed) return fail("주소를 찾지 못했습니다.", "address");
  } catch {
    return fail(DB_DOWN_MESSAGE);
  }

  refresh();
  return { error: null, message: "배송지를 삭제했습니다." };
}

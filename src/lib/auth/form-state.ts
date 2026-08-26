/**
 * 인증 폼과 Server Action 이 주고받는 상태.
 *
 * `"use server"` 파일은 **async 함수만** export 할 수 있어서 타입·상수를 같이 둘 수 없다.
 * 그래서 여기 따로 뺀다. 이 파일은 서버 코드를 끌어오지 않으므로 클라이언트에서 import 해도 된다.
 */

export type AuthFormState = {
  /** 사람에게 보여줄 실패 사유. null 이면 아직 아무 일도 없었거나 성공(=리다이렉트)한 것 */
  error: string | null;
  /** 어느 입력이 문제였나 (표시용). 로그인 실패에서는 **항상 null** — 아래 주석 참고 */
  field?: "email" | "password" | "name" | "phone" | "address" | null;
  /** 성공 안내가 필요한 화면(내 정보 저장 등)에서 쓴다 */
  message?: string | null;
};

export const INITIAL_AUTH_FORM_STATE: AuthFormState = { error: null };

/**
 * 로그인 실패 문구는 **하나뿐이다.**
 *
 * "없는 이메일" 과 "비밀번호 틀림" 을 나눠 알려주면 그 화면이 곧 회원 명부 조회기가 된다
 * (이메일을 넣어 보며 가입 여부를 확인). 문구도 응답 시간도 같아야 한다 —
 * 시간 쪽은 `verifyPasswordDummy` 가 맞춘다.
 */
export const LOGIN_FAILED_MESSAGE = "이메일 또는 비밀번호가 올바르지 않습니다.";

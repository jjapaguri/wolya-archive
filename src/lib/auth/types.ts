/**
 * 화면과 서버가 같이 쓰는 인증 쪽 타입.
 *
 * 이 파일은 `@/lib/db` 를 끌어오지 않는다. 그래서 "use client" 컴포넌트가 마음 놓고
 * import 할 수 있다 — `@/lib/auth/queries` 에서 `import type` 으로 가져가도 컴파일 뒤에는
 * 사라지지만, 서버 전용 모듈을 클라이언트 파일에 적어 두는 것 자체가 나중에 실수로
 * 값 import 로 바뀌는 통로가 된다. 그래서 타입만 여기로 뺀다.
 */

/** 주소록 한 줄. 주문서는 이 값을 참조하지 않고 **값으로 복사**한다(스냅샷). */
export type AccountAddress = {
  id: string;
  label: string | null;
  recipient: string;
  phone: string;
  postcode: string;
  address1: string;
  address2: string | null;
  isDefault: boolean;
};

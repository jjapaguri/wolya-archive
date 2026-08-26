/**
 * 주문번호 발급.
 *
 * 003 의 CHECK 가 `^[0-9]{8}-[A-Z0-9]{6,}$` 를 강제하고, 주석이 이유를 적어 뒀다:
 * **순번(1001, 1002…)을 쓰면 주문번호+휴대폰 조합을 유추당해 남의 주문을 열람할 수 있다.**
 * 비회원 주문 조회가 이 두 값만으로 열리므로 무작위 성분이 사실상의 자격증명이다.
 *
 * 그래서 날짜 8자리 + 난수 8자리로 만든다. 난수는 `crypto` 의 CSPRNG 이고
 * (`Math.random` 은 예측 가능하다), 알파벳에서 혼동 문자(0/O, 1/I)를 뺐다 —
 * 고객이 전화로 불러 주는 값이라 읽고 옮겨 적을 수 있어야 한다.
 * 32글자 알파벳 8자리 = 40비트.
 */
import { randomInt } from "node:crypto";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const RANDOM_LENGTH = 8;

/** 오늘 날짜(한국 시간) 8자리. 서버 타임존이 UTC 여도 주문번호의 날짜는 KST 다. */
function todayInSeoul(now: Date): string {
  // en-CA 는 YYYY-MM-DD 로 준다. 직접 포맷하는 것보다 타임존 처리가 정확하다.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(now).replace(/-/g, "");
}

export function newOrderNo(now: Date = new Date()): string {
  let suffix = "";
  for (let i = 0; i < RANDOM_LENGTH; i += 1) suffix += ALPHABET[randomInt(ALPHABET.length)];
  return `${todayInSeoul(now)}-${suffix}`;
}

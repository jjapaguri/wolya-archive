/**
 * 통신판매업자 표시 정보 (전자상거래법 고지 의무).
 * 값이 확정되면 이 파일만 채우면 데스크톱(/) · 모바일(/m) 푸터 양쪽에 반영된다.
 * 빈 문자열인 항목은 푸터에서 그 줄 자체가 렌더되지 않는다.
 */
export const businessInfo = {
  /** 상호 */
  name: "",
  /** 대표자명 */
  representative: "",
  /** 사업자등록번호 */
  registrationNumber: "",
  /** 사업장 소재지 */
  address: "",
  /** 연락처 */
  phone: "",
  /** 통신판매업 신고번호 — 접수 대기 중이라 기본값은 빈 문자열이다 */
  mailOrderLicenseNumber: "",
};

"use client";

/**
 * "데스크톱 버전으로 보기" 링크.
 *
 * 쿠키를 직접 심고 전체 새로고침으로 이동한다.
 * (`<Link>` 로 하면 프리페치 때문에 사용자가 누르지도 않았는데
 *  선택이 저장될 수 있어 일부러 쓰지 않는다.)
 */
export default function DesktopViewLink() {
  function goToDesktop() {
    document.cookie = `wolya-view=desktop; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    window.location.assign("/");
  }

  return (
    <button
      type="button"
      onClick={goToDesktop}
      className="text-[9px] tracking-[0.15em] text-fg/40 uppercase underline underline-offset-4 active:text-fg"
    >
      데스크톱 버전으로 보기
    </button>
  );
}

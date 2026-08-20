"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV_ITEMS = [
  { label: "Shop", href: "/m/shop" },
  { label: "Archive", href: "/m/archive" },
  { label: "About", href: "/m/about" },
  { label: "Contact", href: "/m/contact" },
];

export default function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);

  // 메뉴가 열려 있는 동안 뒤 배경이 스크롤되지 않도록 잠근다.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  return (
    <>
      <header className="fixed top-0 left-0 z-40 flex w-full items-center justify-between border-b border-fg/10 bg-bg/80 px-6 py-4 backdrop-blur-md">
        <Link
          href="/m"
          className="font-serif text-xl font-semibold tracking-widest text-fg uppercase"
        >
          Wolya
        </Link>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="메뉴 열기"
          aria-expanded={isOpen}
          className="p-1 text-fg focus:outline-none"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
            aria-hidden="true"
          >
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
      </header>

      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg transition-[opacity,visibility] duration-300 ease-in-out ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="메뉴 닫기"
          className="absolute top-5 right-6 p-1 text-fg focus:outline-none"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
            aria-hidden="true"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-12 text-[10px] font-bold tracking-[0.3em] text-accent uppercase">
          [W-ARCHV] CURATION
        </div>

        <nav className="flex flex-col gap-8 text-center text-sm font-light tracking-[0.15em] uppercase">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="text-fg transition-colors hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-10 flex gap-6 text-xs text-fg/50">
          <a
            href="https://instagram.com/iwannabebratpitt"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-fg"
          >
            INSTAGRAM
          </a>
          <a
            href="http://pf.kakao.com/_bvxlSX"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-fg"
          >
            KAKAOTALK
          </a>
        </div>
      </div>
    </>
  );
}

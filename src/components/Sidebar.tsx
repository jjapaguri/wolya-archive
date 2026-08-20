import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="flex w-[60px] shrink-0 flex-col items-center justify-between border-r border-border px-0 py-5">
      <Link
        href="/"
        className="text-center font-sans text-[9px] tracking-[0.1em] uppercase opacity-50 transition-opacity hover:opacity-100"
      >
        WOLYA ARCHIVE
      </Link>
      <div className="rotate-180 font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-accent [writing-mode:vertical-rl]">
        S/S 2024 CURATION
      </div>
      <div className="font-sans text-[9px] opacity-50">EST. 2023</div>
    </aside>
  );
}

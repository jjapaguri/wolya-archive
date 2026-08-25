"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export default function HeroVisual() {
  const imageRef = useRef<HTMLImageElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;

      if (imageRef.current) {
        imageRef.current.style.transform = `scale(1.1) translate(${x}px, ${y}px)`;
      }
      if (topRef.current) {
        topRef.current.style.transform = `translate(${-x * 0.5}px, ${-y * 0.5}px)`;
      }
      if (bottomRef.current) {
        bottomRef.current.style.transform = `scaleY(-1) translate(${-x * 0.2}px, ${-y * 0.2}px)`;
      }
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="relative flex items-center justify-center overflow-hidden bg-accent-dim">
      <Image
        ref={imageRef}
        src="https://images.unsplash.com/photo-1550684376-efcbd6e3f031?auto=format&fit=crop&q=80&w=2000"
        alt="Curation Focus"
        fill
        priority
        sizes="100vw"
        className="object-cover mix-blend-luminosity [filter:sepia(40%)_contrast(1.2)_brightness(0.7)] will-change-transform"
      />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-center px-6 py-10 md:px-10">
        <div
          ref={topRef}
          className="mb-[-0.2em] font-serif text-[18vw] leading-[0.75] font-semibold tracking-[-0.05em] text-fg uppercase opacity-90 md:text-[14vw]"
        >
          WOLYA
        </div>
        <div
          ref={bottomRef}
          className="origin-center scale-y-[-1] font-serif text-[18vw] leading-[0.75] font-semibold tracking-[-0.05em] text-accent uppercase opacity-40 [mask-image:linear-gradient(to_bottom,transparent_20%,black_100%)] md:text-[14vw]"
        >
          ARCHIVE
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5">
        <span className="font-sans text-[8px] tracking-[0.3em] opacity-50">EXPLORE</span>
        <div className="h-[60px] w-px bg-gradient-to-b from-accent to-transparent" />
      </div>
    </section>
  );
}

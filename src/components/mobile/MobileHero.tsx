import Image from "next/image";

export default function MobileHero() {
  return (
    <section className="relative flex h-[80vh] min-h-[600px] w-full items-center justify-center overflow-hidden bg-accent-dim">
      <Image
        src="https://images.unsplash.com/photo-1550684376-efcbd6e3f031?auto=format&fit=crop&q=80&w=800"
        alt="Curation Focus"
        fill
        priority
        sizes="100vw"
        className="object-cover mix-blend-luminosity [filter:sepia(0.4)_contrast(1.2)_brightness(0.5)]"
      />

      <div className="pointer-events-none relative z-10 mt-[-10vh] flex flex-col items-center">
        <div className="font-serif text-[22vw] leading-[0.75] font-semibold tracking-tighter text-fg uppercase opacity-90">
          WOLYA
        </div>
        <div className="mirror-text-bottom font-serif text-[22vw] leading-[0.75] font-semibold tracking-tighter text-accent uppercase opacity-50">
          ARCHIVE
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
        <span className="text-[8px] tracking-[0.3em] opacity-50">EXPLORE</span>
        <div className="h-[40px] w-px bg-gradient-to-b from-accent to-transparent" />
      </div>
    </section>
  );
}

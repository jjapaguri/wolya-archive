import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileFooter from "@/components/mobile/MobileFooter";
import { getLegalDoc, legalDocs, legalDraftNotice } from "@/lib/legal-content";

export function generateStaticParams() {
  return Object.keys(legalDocs).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/m/legal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) return {};
  return {
    title: `${doc.title} | WOLYA ARCHIVE`,
    description: doc.description,
  };
}

export default async function MobileLegalPage({ params }: PageProps<"/m/legal/[slug]">) {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) notFound();

  return (
    <>
      <GrainOverlay alpha={15} frameIntervalMs={50} />
      <MobileHeader />

      <main className="w-full px-6 pt-[92px] pb-16">
        <Link href="/m" className="mb-6 inline-block text-[10px] tracking-[0.2em] text-fg/50 uppercase">
          ← 홈으로
        </Link>

        <span className="mb-6 block font-kr text-xs font-bold tracking-[0.2em] text-accent uppercase">
          #{doc.enTitle}
        </span>

        <h1 className="word-keep-all mb-6 font-kr text-xl leading-relaxed font-medium">
          {doc.title}
        </h1>

        <div className="word-keep-all mb-8 border border-fg/10 bg-fg/5 px-4 py-3 font-kr text-[10px] leading-[1.6] text-fg/40">
          ⚠️ {legalDraftNotice}
        </div>

        <div className="flex flex-col gap-6">
          {doc.sections.map((section) => (
            <div key={section.heading} className="border-t border-fg/10 pt-5">
              <h2 className="word-keep-all mb-2 font-kr text-[13px] font-semibold text-fg/90">
                {section.heading}
              </h2>
              <div className="flex flex-col gap-2">
                {section.paragraphs.map((paragraph, i) => (
                  <p
                    key={i}
                    className="word-keep-all font-kr text-[13px] leading-[1.8] font-light text-fg/70"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <MobileFooter />
    </>
  );
}

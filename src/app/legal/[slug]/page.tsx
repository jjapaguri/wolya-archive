import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GrainOverlay from "@/components/GrainOverlay";
import SiteFooter from "@/components/SiteFooter";
import { getLegalDoc, legalDocs, legalDraftNotice } from "@/lib/legal-content";

export function generateStaticParams() {
  return Object.keys(legalDocs).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) return {};
  return {
    title: `${doc.title} | WOLYA ARCHIVE`,
    description: doc.description,
  };
}

export default async function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) notFound();

  return (
    <>
      <GrainOverlay />
      <main className="relative z-10 mx-auto max-w-[720px] px-6 pt-16 pb-24 lg:px-20 lg:pt-24">
        <Link
          href="/"
          className="mb-10 inline-block font-sans text-[10px] tracking-[0.2em] text-fg/50 uppercase transition-colors hover:text-accent"
        >
          ← 홈으로
        </Link>

        <span className="mb-6 block font-maruburi text-sm font-bold tracking-[0.2em] text-accent uppercase">
          #{doc.enTitle}
        </span>

        <h1 className="word-keep-all mb-8 font-maruburi text-2xl leading-relaxed font-semibold lg:text-3xl">
          {doc.title}
        </h1>

        <div className="word-keep-all mb-10 border border-border bg-fg/5 px-5 py-4 font-kr text-xs leading-[1.6] text-fg/50">
          ⚠️ {legalDraftNotice}
        </div>

        <div className="flex flex-col gap-8">
          {doc.sections.map((section) => (
            <div key={section.heading} className="border-t border-border pt-6">
              <h2 className="word-keep-all mb-3 font-kr text-sm font-semibold text-fg/90">
                {section.heading}
              </h2>
              <div className="flex flex-col gap-3">
                {section.paragraphs.map((paragraph, i) => (
                  <p
                    key={i}
                    className="word-keep-all text-justify font-kr text-sm leading-[1.8] font-light text-fg/70"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

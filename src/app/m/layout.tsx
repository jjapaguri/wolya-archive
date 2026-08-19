import type { Metadata, Viewport } from "next";

const title = "WOLYA ARCHIVE | Mobile";
const description =
  "300여 개 브랜드, 7,000벌 이상의 시도 끝에 선별한 아이템들. 동대문에서 선별한 트렌디하고 힙한 아이템들을 감각적인 큐레이션으로 합리적인 가격에 제안하는 셀렉트샵.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title,
    description,
    url: "/m",
    siteName: "WOLYA ARCHIVE",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0D0B0A",
};

export default function MobileLayout({ children }: LayoutProps<"/m">) {
  return <div className="relative w-full">{children}</div>;
}

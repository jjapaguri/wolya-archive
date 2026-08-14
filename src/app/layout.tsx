import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Noto_Sans_KR } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-kr",
  subsets: ["latin"],
  weight: ["300", "500", "700"],
  display: "swap",
});

const maruBuri = localFont({
  variable: "--font-maruburi",
  display: "swap",
  src: [
    { path: "../../public/fonts/maruburi/MaruBuri-Light.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/maruburi/MaruBuri-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/maruburi/MaruBuri-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/maruburi/MaruBuri-Bold.woff2", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "WOLYA ARCHIVE | Curated Fashion Select Shop",
  description:
    "300여 개 브랜드, 7,000벌 이상의 시도 끝에 선별한 아이템들. 동대문에서 선별한 트렌디하고 힙한 아이템들을 감각적인 큐레이션으로 합리적인 가격에 제안하는 셀렉트샵.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${cormorant.variable} ${inter.variable} ${notoSansKr.variable} ${maruBuri.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}

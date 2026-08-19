import type { MetadataRoute } from "next";

const SITE_URL = "https://archive-wolya.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      // `/m` 은 src/app/m/layout.tsx 에서 canonical 이 `/` 로 지정돼 있어
      // 검색엔진이 두 URL 을 같은 페이지로 합쳐서 처리한다.
      url: `${SITE_URL}/m`,
      changeFrequency: "daily",
      priority: 0.5,
    },
    ...["/shop", "/archive", "/about", "/contact"].map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}

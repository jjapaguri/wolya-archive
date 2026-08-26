import type { MetadataRoute } from "next";

const SITE_URL = "https://archive-wolya.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 회원 전용·인증 왕복 경로는 색인 대상이 아니다. 각 페이지에도
      // `robots: { index: false }` 가 걸려 있고, 여기는 크롤러가 아예 안 들어오게 하는 쪽.
      disallow: ["/account", "/m/account", "/login", "/m/login", "/signup", "/m/signup", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

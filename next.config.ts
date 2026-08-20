import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // 상품 사진 원본 (후루츠패밀리 CDN). 자체 촬영본으로 교체 전까지 임시.
        protocol: "https",
        hostname: "image.production.fruitsfamily.com",
      },
    ],
  },
};

export default nextConfig;

export type Product = {
  id: number;
  slug: string;
  tag: string;
  image: string;
  name: string;
  hook: string;
  fabric: string;
  fit: string;
  measurements: string;
  stock: string;
  recommendedFor: string;
  categories: string;
};

const baseFields = {
  name: "[아이템명]",
  hook: "“7,000벌 중에 살아남은 [3]벌 중 하나”",
  fabric: "[소재명 / 두께 g, 예: 280g 헤비코튼 — 손으로 눌러보고 고른 이유]",
  fit: "[모델 착용(키 cm, 몸무게 kg) vs 실측 사이즈 비교]",
  measurements: "[어깨/가슴/총장 등 cm 단위 표기]",
  stock: "[총 20장 중 15장 남음]",
  recommendedFor: "옷 고민 자체를 줄이고 싶은 분",
  categories: "#스트릿 #카고 #보온성",
};

const images = [
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1578587018452-892b7fd8f91b?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=600",
];

export const products: Product[] = images.map((image, index) => ({
  id: index + 1,
  slug: `curation-${String(index + 1).padStart(3, "0")}`,
  tag: `CURATION 00${index + 1}`,
  image,
  ...baseFields,
}));

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export const topRowProducts = [...products.slice(0, 4), ...products.slice(0, 4)];
export const bottomRowProducts = [...products.slice(4, 8), ...products.slice(4, 8)];

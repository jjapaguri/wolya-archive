"use client";

import { useState } from "react";
import MobileProductCard from "@/components/mobile/MobileProductCard";
import { CATEGORIES, CATEGORY_LABELS, type Product, type ProductCategory } from "@/data/products";

type Filter = "all" | ProductCategory;

export default function MobileShopGrid({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all" ? products : products.filter((product) => product.category === filter);

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`border px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase transition-colors ${
            filter === "all"
              ? "border-accent text-accent"
              : "border-fg/10 text-fg/50"
          }`}
        >
          전체
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setFilter(category)}
            className={`border px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase transition-colors ${
              filter === category
                ? "border-accent text-accent"
                : "border-fg/10 text-fg/50"
            }`}
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="font-kr text-sm text-fg/50">이 분류에는 아직 등록된 상품이 없다.</p>
      ) : (
        <div className="flex flex-col items-center gap-6">
          {filtered.map((product) => (
            <MobileProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}

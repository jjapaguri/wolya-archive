"use client";

import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import { CATEGORIES, CATEGORY_LABELS, type Product, type ProductCategory } from "@/data/products";

type Filter = "all" | ProductCategory;

export default function ShopGrid({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all" ? products : products.filter((product) => product.category === filter);

  return (
    <>
      <div className="mb-10 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`border px-4 py-2 font-sans text-[10px] tracking-[0.15em] uppercase transition-colors ${
            filter === "all"
              ? "border-accent text-accent"
              : "border-border text-fg/50 hover:border-accent hover:text-accent"
          }`}
        >
          전체
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setFilter(category)}
            className={`border px-4 py-2 font-sans text-[10px] tracking-[0.15em] uppercase transition-colors ${
              filter === category
                ? "border-accent text-accent"
                : "border-border text-fg/50 hover:border-accent hover:text-accent"
            }`}
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="font-kr text-sm text-fg/50">이 분류에는 아직 등록된 상품이 없다.</p>
      ) : (
        <div className="flex flex-wrap gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}

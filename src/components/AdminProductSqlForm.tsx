"use client";

import { useMemo, useState } from "react";
import {
  buildProductSeedSql,
  validateNewProduct,
  type NewProductInput,
} from "@/lib/product-seed-sql";
import { CATEGORIES, CATEGORY_LABELS } from "@/data/products";
import { AuthField, authButtonClass, authInputClass } from "./AuthField";

const EMPTY: NewProductInput = {
  slug: "",
  tag: "",
  name: "",
  brand: "",
  category: "top",
  size: "",
  price: 0,
  sourcePrice: null,
  condition: "",
  hook: "",
  fabric: "",
  fit: "",
  measurements: "",
  stock: "1점 한정",
  recommendedFor: "",
  shortMeasure: "",
  tags: "",
  note: "",
  isPreorder: false,
  images: [""],
};

/**
 * A1 이후 화면의 정본은 DB 라 `src/data/products.ts` 에 항목을 추가해도 사이트에 안 나온다.
 * 이 화면은 DB 에 직접 쓰지 않는다 — 입력값으로 시드 SQL 조각을 **브라우저에서 즉시** 만들어
 * 보여줄 뿐이다. 사람이 내용을 확인하고 psql 로 직접 적용한다(`docs/BACKLOG.md` 참고).
 */
export default function AdminProductSqlForm() {
  const [input, setInput] = useState<NewProductInput>(EMPTY);
  const [copied, setCopied] = useState(false);

  function set<K extends keyof NewProductInput>(key: K, value: NewProductInput[K]) {
    setCopied(false);
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  const imagesText = input.images.join("\n");
  const errors = useMemo(() => validateNewProduct(input), [input]);
  const sql = useMemo(
    () => (errors.length === 0 ? buildProductSeedSql(input) : ""),
    [input, errors]
  );

  async function copySql() {
    if (!sql) return;
    await navigator.clipboard.writeText(sql);
    setCopied(true);
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <AuthField label="아카이브 번호 (tag)" htmlFor="np-tag" hint="예: ARCHIVE 038">
          <input
            id="np-tag"
            className={authInputClass}
            value={input.tag}
            onChange={(e) => set("tag", e.target.value)}
          />
        </AuthField>

        <AuthField label="slug" htmlFor="np-slug" hint="소문자·숫자·하이픈만. 예: levis-501-90s-32">
          <input
            id="np-slug"
            className={authInputClass}
            value={input.slug}
            onChange={(e) => set("slug", e.target.value)}
          />
        </AuthField>

        <AuthField label="상품명" htmlFor="np-name">
          <input
            id="np-name"
            className={authInputClass}
            value={input.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </AuthField>

        <AuthField label="브랜드" htmlFor="np-brand" hint="기존 표기와 다르게 쓰면 브랜드가 두 줄로 갈립니다">
          <input
            id="np-brand"
            className={authInputClass}
            value={input.brand}
            onChange={(e) => set("brand", e.target.value)}
          />
        </AuthField>

        <AuthField label="분류" htmlFor="np-category">
          <select
            id="np-category"
            className={authInputClass}
            value={input.category}
            onChange={(e) => set("category", e.target.value as NewProductInput["category"])}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </AuthField>

        <AuthField label="사이즈" htmlFor="np-size">
          <input
            id="np-size"
            className={authInputClass}
            value={input.size}
            onChange={(e) => set("size", e.target.value)}
          />
        </AuthField>

        <AuthField label="판매가 (원)" htmlFor="np-price">
          <input
            id="np-price"
            type="number"
            min={0}
            step={100}
            className={authInputClass}
            value={input.price}
            onChange={(e) => set("price", Number(e.target.value))}
          />
        </AuthField>

        <AuthField label="매입가 (원, 내부용)" htmlFor="np-source-price" hint="화면에 노출되지 않습니다. 비워도 됩니다">
          <input
            id="np-source-price"
            type="number"
            min={0}
            step={100}
            className={authInputClass}
            value={input.sourcePrice ?? ""}
            onChange={(e) => set("sourcePrice", e.target.value === "" ? null : Number(e.target.value))}
          />
        </AuthField>
      </div>

      <label className="flex items-start gap-3 font-kr text-[13px] leading-[1.7] text-fg/70">
        <input
          type="checkbox"
          className="mt-1 accent-accent"
          checked={input.isPreorder}
          onChange={(e) => set("isPreorder", e.target.checked)}
        />
        <span>예약주문(사입 확인 전) — 체크하면 재고 0으로 등록됩니다</span>
      </label>

      <AuthField label="상태 서술문 (condition)" htmlFor="np-condition" hint="하자 낱말이 있으면 등급이 자동으로 used_fair 가 됩니다">
        <textarea
          id="np-condition"
          rows={2}
          className={authInputClass}
          value={input.condition}
          onChange={(e) => set("condition", e.target.value)}
        />
      </AuthField>

      <AuthField label="hook (한 줄 소개)" htmlFor="np-hook">
        <textarea
          id="np-hook"
          rows={2}
          className={authInputClass}
          value={input.hook}
          onChange={(e) => set("hook", e.target.value)}
        />
      </AuthField>

      <AuthField label="fabric (소재)" htmlFor="np-fabric">
        <textarea
          id="np-fabric"
          rows={2}
          className={authInputClass}
          value={input.fabric}
          onChange={(e) => set("fabric", e.target.value)}
        />
      </AuthField>

      <AuthField label="fit (핏)" htmlFor="np-fit">
        <textarea
          id="np-fit"
          rows={2}
          className={authInputClass}
          value={input.fit}
          onChange={(e) => set("fit", e.target.value)}
        />
      </AuthField>

      <AuthField label="measurements (실측)" htmlFor="np-measurements">
        <textarea
          id="np-measurements"
          rows={2}
          className={authInputClass}
          value={input.measurements}
          onChange={(e) => set("measurements", e.target.value)}
        />
      </AuthField>

      <AuthField label="카드 한 줄 실측 (shortMeasure)" htmlFor="np-short-measure">
        <input
          id="np-short-measure"
          className={authInputClass}
          value={input.shortMeasure}
          onChange={(e) => set("shortMeasure", e.target.value)}
        />
      </AuthField>

      <AuthField label="recommendedFor (추천 대상)" htmlFor="np-recommended">
        <textarea
          id="np-recommended"
          rows={2}
          className={authInputClass}
          value={input.recommendedFor}
          onChange={(e) => set("recommendedFor", e.target.value)}
        />
      </AuthField>

      <AuthField label="해시태그" htmlFor="np-tags" hint="예: #데님자켓 #트러커 #워시드">
        <input
          id="np-tags"
          className={authInputClass}
          value={input.tags}
          onChange={(e) => set("tags", e.target.value)}
        />
      </AuthField>

      <AuthField label="판매자 고지 (선택)" htmlFor="np-note" hint="있으면 상세페이지 하단에 그대로 노출됩니다">
        <textarea
          id="np-note"
          rows={2}
          className={authInputClass}
          value={input.note}
          onChange={(e) => set("note", e.target.value)}
        />
      </AuthField>

      <AuthField label="이미지 URL (줄바꿈으로 여러 개, 첫 줄이 대표 이미지)" htmlFor="np-images">
        <textarea
          id="np-images"
          rows={4}
          className={authInputClass}
          value={imagesText}
          onChange={(e) => set("images", e.target.value.split("\n"))}
        />
      </AuthField>

      {errors.length > 0 && (
        <ul className="word-keep-all border border-accent/50 bg-accent-dim/40 px-4 py-3 font-kr text-[13px] leading-[1.7] text-fg/90">
          {errors.map((e) => (
            <li key={e}>· {e}</li>
          ))}
        </ul>
      )}

      {sql && (
        <div className="flex flex-col gap-3">
          <span className="font-sans text-[10px] tracking-[0.2em] text-accent uppercase">
            생성된 SQL — 적용 전에 반드시 읽고 psql 로 직접 실행하세요
          </span>
          <textarea
            readOnly
            rows={22}
            className={authInputClass + " font-mono text-xs"}
            value={sql}
          />
          <button type="button" onClick={copySql} className={authButtonClass}>
            {copied ? "복사됨" : "SQL 복사"}
          </button>
        </div>
      )}
    </div>
  );
}

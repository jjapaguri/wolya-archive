/**
 * 상품 조회 계층 — 화면이 DB 를 보는 유일한 창구.
 *
 * A0 는 **읽기까지만**이다. 주문·재고 차감·결제는 B 단계이고 여기서 건드리지 않는다.
 *
 * A1 에서 화면은 이렇게 바뀐다:
 *   - import { products } from "@/data/products"      →  await listProducts()
 *   - getProductBySlug(slug)  (동기)                   →  await getProductBySlug(slug)
 * 반환 타입이 같으므로 그 외 화면 코드는 손대지 않는다.
 *
 * 매입가(source_price)는 `Product` 에 없다 — `src/data/product-sourcing.ts` 참고.
 * 이 계층이 돌려주는 `Product` 는 클라이언트 컴포넌트에 props 로 넘어갈 수 있으므로
 * 여기서 매입가·원매물 링크를 다시 채워 넣지 말 것.
 */
import { query } from "@/lib/db";
import {
  SQL_LIST_PRODUCTS,
  SQL_PRODUCT_BY_SLUG,
  SQL_PRODUCTS_BY_CATEGORY,
  mapRow,
  type ProductRow,
} from "@/lib/product-queries";
import type { Product } from "@/data/products";

/** 판매중(published) 상품 전체. 아카이브 번호 순. */
export async function listProducts(): Promise<Product[]> {
  const rows = await query<ProductRow>(SQL_LIST_PRODUCTS);
  return rows.map(mapRow);
}

/** slug 로 1건. 없으면 null. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const rows = await query<ProductRow>(SQL_PRODUCT_BY_SLUG, [slug]);
  return rows.length > 0 ? mapRow(rows[0]) : null;
}

/** 카테고리(top/bottom/accessory/shoes) 별 목록. */
export async function listProductsByCategory(categorySlug: string): Promise<Product[]> {
  const rows = await query<ProductRow>(SQL_PRODUCTS_BY_CATEGORY, [categorySlug]);
  return rows.map(mapRow);
}

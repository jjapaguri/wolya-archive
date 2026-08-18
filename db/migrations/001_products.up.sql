-- 001_products.up.sql
-- WOLYA ARCHIVE 스키마 1단계 — 상품 노출
-- brands, categories, products, product_variants, product_images, tags, product_tags
--
-- 적용:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/001_products.up.sql
-- 되돌리기: db/migrations/001_products.down.sql
--
-- 원칙 (AGENTS.md 공통 불변 규칙)
--  - PK: BIGINT GENERATED ALWAYS AS IDENTITY, 외부 노출은 slug
--  - 금액: INTEGER 원 단위 정수 (FLOAT 금지)
--  - 시각: TIMESTAMPTZ, 모든 테이블에 created_at / updated_at
--  - 상품은 deleted_at 소프트 삭제
--  - 상태값은 VARCHAR + CHECK (PG ENUM 미사용)
--  - 이미지는 URL만 저장, 파일은 S3

BEGIN;

-- ── updated_at 자동 갱신 ────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ── brands ─────────────────────────────────────────────────────
CREATE TABLE brands (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug        VARCHAR(120) NOT NULL UNIQUE,
  name        VARCHAR(120) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_brands_updated_at
  BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── categories (2단계까지만) ────────────────────────────────────
CREATE TABLE categories (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id  BIGINT REFERENCES categories(id) ON DELETE RESTRICT,
  slug       VARCHAR(120) NOT NULL UNIQUE,
  name       VARCHAR(120) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT categories_no_self_parent CHECK (parent_id IS DISTINCT FROM id)
);

CREATE INDEX idx_categories_parent ON categories(parent_id);

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 설계상 카테고리는 2단계(대분류 > 소분류)까지다.
-- 손자 카테고리가 생기면 목록 UI와 쿼리가 전부 깨지므로 DB에서 막는다.
CREATE OR REPLACE FUNCTION categories_enforce_two_levels() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  grandparent BIGINT;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT parent_id INTO grandparent FROM categories WHERE id = NEW.parent_id;

  IF grandparent IS NOT NULL THEN
    RAISE EXCEPTION '카테고리는 2단계까지만 허용됩니다 (parent_id=% 는 이미 하위 카테고리)', NEW.parent_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_categories_two_levels
  BEFORE INSERT OR UPDATE OF parent_id ON categories
  FOR EACH ROW EXECUTE FUNCTION categories_enforce_two_levels();

-- ── products ───────────────────────────────────────────────────
CREATE TABLE products (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug          VARCHAR(160) NOT NULL UNIQUE,
  brand_id      BIGINT REFERENCES brands(id) ON DELETE RESTRICT,
  category_id   BIGINT REFERENCES categories(id) ON DELETE RESTRICT,
  name          VARCHAR(200) NOT NULL,
  curation_note TEXT,
  base_price    INTEGER NOT NULL CHECK (base_price >= 0),
  sale_price    INTEGER CHECK (sale_price >= 0),
  condition     VARCHAR(20) NOT NULL DEFAULT 'new'
                CHECK (condition IN ('new', 'like_new', 'used_good', 'used_fair')),
  status        VARCHAR(20) NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'published', 'hidden', 'sold_out')),
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ,
  -- 할인가가 정가보다 비쌀 수 없다
  CONSTRAINT products_sale_price_lte_base CHECK (sale_price IS NULL OR sale_price <= base_price),
  -- published 상태인데 공개 시각이 없으면 정렬·노출이 어긋난다
  CONSTRAINT products_published_needs_time CHECK (status <> 'published' OR published_at IS NOT NULL)
);

CREATE INDEX idx_products_status_published
  ON products(status, published_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand    ON products(brand_id);

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── product_variants (재고의 실체) ──────────────────────────────
CREATE TABLE product_variants (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id       BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku              VARCHAR(64) NOT NULL UNIQUE,
  size             VARCHAR(40) NOT NULL,
  color            VARCHAR(40) NOT NULL,
  additional_price INTEGER NOT NULL DEFAULT 0 CHECK (additional_price >= 0),
  -- 재고는 절대 음수가 될 수 없다. 동시 주문 버그를 DB에서 막는 마지막 방어선.
  stock_quantity   INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT product_variants_unique_option UNIQUE (product_id, size, color)
);

CREATE INDEX idx_variants_product ON product_variants(product_id);

CREATE TRIGGER trg_product_variants_updated_at
  BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── product_images ─────────────────────────────────────────────
CREATE TABLE product_images (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id BIGINT REFERENCES product_variants(id) ON DELETE SET NULL,
  url        TEXT NOT NULL,
  alt        VARCHAR(200),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_images_product ON product_images(product_id, sort_order);

-- 대표 이미지는 상품당 최대 1장
CREATE UNIQUE INDEX uq_product_images_primary
  ON product_images(product_id) WHERE is_primary;

CREATE TRIGGER trg_product_images_updated_at
  BEFORE UPDATE ON product_images FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── tags / product_tags ────────────────────────────────────────
CREATE TABLE tags (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug       VARCHAR(80) NOT NULL UNIQUE,
  name       VARCHAR(80) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_tags_updated_at
  BEFORE UPDATE ON tags FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE product_tags (
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id     BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, tag_id)
);

CREATE INDEX idx_product_tags_tag ON product_tags(tag_id);

COMMIT;

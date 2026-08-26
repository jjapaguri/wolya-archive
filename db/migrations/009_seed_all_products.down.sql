-- 009_seed_all_products.down.sql
-- 009_seed_all_products.up.sql 되돌리기.
--
-- ⚠️ 시드한 상품 37건과 그 옵션·이미지를 지운다. 테이블을 DROP 하지 않는다.
--    브랜드·카테고리는 다른 상품이 참조할 수 있으므로 남긴다.
--    008 이 더한 컬럼은 여기서 건드리지 않는다 (그건 008_...down.sql 몫이다).
--    실행 전 백업: ~/app/scripts/pg_backup.sh
--    AGENTS.md 4절에 따라 운영 DB 에서는 **사람 승인 없이 실행 금지.**
--
-- 주의: 007 이 넣은 3건(yiyae-washed-denim-trucker / twiyo-shell-button-fur-bag /
--       hysteric-glamour-field-jacket-black)도 같은 slug 라 이 목록에 들어 있다.
--       007 상태로만 되돌리려면 아래 목록에서 그 3건을 빼고 실행할 것.
--
-- 주문된 상품은 지워지지 않는다 — order_items 가 참조하고 있으면 FK 가 막는다.
-- 그건 버그가 아니라 정산 증빙 보호다(db/README.md 4단계).
--
-- 적용: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/009_seed_all_products.down.sql

BEGIN;

CREATE TEMP TABLE _seed_slugs(slug text PRIMARY KEY) ON COMMIT DROP;
INSERT INTO _seed_slugs(slug) VALUES
  ('yiyae-washed-denim-trucker'),
  ('twiyo-shell-button-fur-bag'),
  ('hysteric-glamour-field-jacket-black'),
  ('carhartt-duck-active-jacket-usa-l'),
  ('carhartt-active-hood-tartan-j024'),
  ('carhartt-active-jacket-j130-m'),
  ('patagonia-synchilla-fleece-navy-m'),
  ('patagonia-micro-d-hoodie-xl'),
  ('patagonia-synchilla-xxl'),
  ('patagonia-reversible-fleece-l'),
  ('schott-usaf-ma1-90s-m'),
  ('schott-618-perfecto-90s-m'),
  ('avirex-m65-field-jacket-m'),
  ('avirex-ma1-vintage-s'),
  ('polo-cable-knit-23fw-navy-m'),
  ('polo-cable-knit-cardigan-pink-s'),
  ('polo-cable-knit-navy-l'),
  ('polo-field-shirt-90s-l'),
  ('neighborhood-original-knit-m'),
  ('hysteric-glamour-shirt-jacket-m'),
  ('champion-reverse-weave-ny-arch-m'),
  ('american-vintage-plaid-flannel-os'),
  ('issey-miyake-1988aw-tee-m'),
  ('levis-501-90s-usa-32-32'),
  ('levis-504-selvedge-32'),
  ('levis-517-90s-white-tab'),
  ('carhartt-carpenter-double-knee-brn-34'),
  ('carhartt-sunfaded-black-pants-32'),
  ('stone-island-green-edge-denim-48'),
  ('cdg-homme-two-tuck-chino-ad1992'),
  ('cdg-homme-nylon-straight-pants-ad2000'),
  ('cdg-homme-pocket-pants-m'),
  ('levis-501-bige-selvedge-29'),
  ('carhartt-single-knee-carpenter-ptb-34'),
  ('polo-classic-fit-chino-beige-30'),
  ('polo-corduroy-blazer-brown-xl'),
  ('patagonia-retro-x-natural-l');

DELETE FROM product_images
WHERE product_id IN (SELECT id FROM products WHERE slug IN (SELECT slug FROM _seed_slugs));

DELETE FROM product_variants
WHERE product_id IN (SELECT id FROM products WHERE slug IN (SELECT slug FROM _seed_slugs));

DELETE FROM products WHERE slug IN (SELECT slug FROM _seed_slugs);

COMMIT;

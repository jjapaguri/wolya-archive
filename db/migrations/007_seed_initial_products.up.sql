-- 007_seed_initial_products.up.sql
-- WOLYA ARCHIVE 스키마 7단계 — 최초 상품 3건 시드
--
-- ⚠️ 이 파일은 생성물이다. 직접 고치지 말 것.
--    원본: src/data/products.ts
--    재생성: node --experimental-strip-types scripts/gen_seed_sql.mjs > db/migrations/007_seed_initial_products.up.sql
--
-- 적용:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/007_seed_initial_products.up.sql
-- 되돌리기: db/migrations/007_seed_initial_products.down.sql
--
-- 전제: 006_product_presentation.up.sql 이 먼저 적용돼 있어야 한다.
-- 멱등: 전부 ON CONFLICT DO NOTHING / NOT EXISTS 가드 → 몇 번 돌려도 같은 결과.
-- 파괴적 구문(DROP/DELETE/TRUNCATE/SET NOT NULL) 없음.

BEGIN;

-- ── 카테고리 4분류 (top / bottom / accessory / shoes) ──────────
INSERT INTO categories (slug, name, sort_order) VALUES
  ('top', '상의', 0),
  ('bottom', '하의', 1),
  ('accessory', '액세서리', 2),
  ('shoes', '신발', 3)
ON CONFLICT (slug) DO NOTHING;

-- ── 브랜드 ────────────────────────────────────────────────────
-- name 은 화면 표기 원문을 그대로 보존한다("yiyae (이예)" 등).
INSERT INTO brands (slug, name) VALUES
  ('yiyae', 'yiyae (이예)'),
  ('the-world-is-your-oyster', 'The World Is Your Oyster'),
  ('hysteric-glamour', 'Hysteric Glamour')
ON CONFLICT (slug) DO NOTHING;

-- ── 상품 ──────────────────────────────────────────────────────
-- ARCHIVE 001 · 이예 워시드 데님 트러커 자켓
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags
) VALUES (
  'yiyae-washed-denim-trucker',
  (SELECT id FROM brands     WHERE slug = 'yiyae'),
  (SELECT id FROM categories WHERE slug = 'top'),
  '이예 워시드 데님 트러커 자켓',
  55000,
  50000,
  'used_good',
  '중고 · 착용 수 회. 눈에 띄는 하자 없음',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 001',
  '위아래 물빠짐이 갈리는 트러커. 새 옷인데 10년 입은 얼굴을 하고 있다.',
  '코튼 데님 — 헤비 워시드 가공. 어깨는 인디고가 남고 아래로 갈수록 옐로 캐스트가 올라오는 그라데이션. 혼용률 태그는 입고 후 확인',
  'L / 박시한 크롭 트러커. 어깨선이 살짝 떨어지는 오버핏이라 남녀 공용으로 걸친다',
  '판매자 미기재 — 입고 즉시 어깨·가슴·소매·총장 4개 실측해 갱신',
  '1점 한정',
  '무지 티 위에 툭 걸치는 간절기 아우터를 찾는 사람',
  '#데님자켓 #트러커 #워시드 #이예 #간절기'
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 002 · 더 월드 이즈 유어 오이스터 셸버튼 퍼 백
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags
) VALUES (
  'twiyo-shell-button-fur-bag',
  (SELECT id FROM brands     WHERE slug = 'the-world-is-your-oyster'),
  (SELECT id FROM categories WHERE slug = 'accessory'),
  '더 월드 이즈 유어 오이스터 셸버튼 퍼 백',
  275000,
  250000,
  'used_fair',
  '중고 · 공식 홈페이지 구매. 자개 단추 1개 탈락 (그 외 양호)',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 002',
  '브랜드 시그니처인 자개 단추를 퍼 위에 흩뿌린 숄더백. 검정 위 진주광이 유일한 색이다.',
  '블랙 페이크 퍼 보디 + 레더 핸들·트리밍. 자개(마더오브펄) 셸 버튼 장식 — 브랜드의 버튼 모티프 시그니처',
  '어깨에 걸치는 호보 실루엣. 남녀 공용, 데일리 사이즈',
  '판매자 미기재 — 입고 후 가로·세로·스트랩 드롭 실측 예정',
  '1점 한정',
  '옷은 단순하게 입고 가방 하나로 끝내는 사람',
  '#숄더백 #퍼백 #자개단추 #TWIYO #컨템포러리'
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 003 · 히스테릭글래머 필드자켓 블랙
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags
) VALUES (
  'hysteric-glamour-field-jacket-black',
  (SELECT id FROM brands     WHERE slug = 'hysteric-glamour'),
  (SELECT id FROM categories WHERE slug = 'top'),
  '히스테릭글래머 필드자켓 블랙',
  275000,
  250000,
  'used_good',
  '중고 · 2026년 2월 하라주쿠 매장 구매, 4회 착용',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 003',
  '라벨은 FOR YANKEE GIRL. 여성 라인이지만 가슴 단면 58.5cm — 남자가 오버핏으로 입는다.',
  '두툼한 코튼 저지 계열. 스탠드 칼라, 지퍼 프론트, 플랩 포켓 4개(가슴 2 + 하단 2), 소매·밑단 고무단. 컴포지션 태그는 입고 후 확인',
  '태그는 Small 이지만 가슴 단면 58.5cm 로 실제는 오버핏. 175cm / 70kg 기준 넉넉하게 떨어진다',
  '총장 66cm / 가슴 단면 58.5cm (측정 방식에 따라 ±1~3cm)',
  '1점 한정',
  '1984년 도쿄 안티패션의 원본을 하나쯤 갖고 싶은 사람',
  '#필드자켓 #히스테릭글래머 #일본 #스트릿 #아카이브'
)
ON CONFLICT (slug) DO NOTHING;

-- ── 옵션·재고 ─────────────────────────────────────────────────
-- 전부 단벌이므로 stock_quantity = 1. color 는 단일 상품이라 '-' 로 둔다.
-- sku 는 아카이브 번호에서 만든다(ARCHIVE 001 → WLY-001).
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-001', 'L', '-', 1 FROM products WHERE slug = 'yiyae-washed-denim-trucker'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-002', 'OS (원사이즈)', '-', 1 FROM products WHERE slug = 'twiyo-shell-button-fur-bag'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-003', 'S (실측 오버핏)', '-', 1 FROM products WHERE slug = 'hysteric-glamour-field-jacket-black'
ON CONFLICT (sku) DO NOTHING;

-- ── 이미지 ────────────────────────────────────────────────────
-- images[0] 이 대표 이미지다. 상품당 is_primary=true 는 정확히 1장(부분 유니크 인덱스).
-- url 에 UNIQUE 가 없으므로 NOT EXISTS 로 멱등성을 만든다.
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/FcNxMcbwS-c0ae6d5b0da8.jpg', '이예 워시드 데님 트러커 자켓', TRUE, 0
FROM products p
WHERE p.slug = 'yiyae-washed-denim-trucker'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/FcNxMcbwS-c0ae6d5b0da8.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/GiqwUPnTI-46598e6c257e.jpg', '더 월드 이즈 유어 오이스터 셸버튼 퍼 백', TRUE, 0
FROM products p
WHERE p.slug = 'twiyo-shell-button-fur-bag'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/GiqwUPnTI-46598e6c257e.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/wrBVmM-dEE-2cfb6f126d09.jpg', '더 월드 이즈 유어 오이스터 셸버튼 퍼 백', FALSE, 1
FROM products p
WHERE p.slug = 'twiyo-shell-button-fur-bag'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/wrBVmM-dEE-2cfb6f126d09.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/HvSLmefZD-d1cec8543ee7.jpg', '히스테릭글래머 필드자켓 블랙', TRUE, 0
FROM products p
WHERE p.slug = 'hysteric-glamour-field-jacket-black'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/HvSLmefZD-d1cec8543ee7.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/RFOhvEUyCa-ee2291533b80.jpg', '히스테릭글래머 필드자켓 블랙', FALSE, 1
FROM products p
WHERE p.slug = 'hysteric-glamour-field-jacket-black'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/RFOhvEUyCa-ee2291533b80.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/3BnG9qhE_-026dce6601b5.jpg', '히스테릭글래머 필드자켓 블랙', FALSE, 2
FROM products p
WHERE p.slug = 'hysteric-glamour-field-jacket-black'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/3BnG9qhE_-026dce6601b5.jpg'
  );

COMMIT;

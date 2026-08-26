-- 009_seed_all_products.up.sql
-- WOLYA ARCHIVE 스키마 9단계 — 원장 37건 전량 시드
--
-- ⚠️ 이 파일은 생성물이다. 직접 고치지 말 것.
--    원본: src/data/products.ts
--    재생성: node --experimental-strip-types scripts/gen_seed_sql.mjs > db/migrations/009_seed_all_products.up.sql
--
-- 적용:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/009_seed_all_products.up.sql
-- 되돌리기: db/migrations/009_seed_all_products.down.sql
--
-- 전제: 006 · 008 이 먼저 적용돼 있어야 한다. 007 은 돌렸든 안 돌렸든 상관없다
--       (007 의 3건은 ON CONFLICT 로 건너뛰고, 새 컬럼만 아래에서 채운다).
-- 멱등: 전부 ON CONFLICT DO NOTHING / NOT EXISTS / IS NULL 가드 → 몇 번 돌려도 같은 결과.
-- 파괴적 구문(DROP/DELETE/TRUNCATE/SET NOT NULL) 없음.
--
-- 노출 상태 내역: available 3건 / preorder 27건 / sold 7건

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
-- 같은 브랜드의 두 표기("Carhartt" / "Carhartt (칼하트)")는 한 행으로 합친다.
INSERT INTO brands (slug, name) VALUES
  ('yiyae', 'yiyae (이예)'),
  ('the-world-is-your-oyster', 'The World Is Your Oyster'),
  ('hysteric-glamour', 'Hysteric Glamour'),
  ('carhartt', 'Carhartt'),
  ('patagonia', 'Patagonia'),
  ('schott', 'Schott'),
  ('avirex', 'Avirex'),
  ('polo-ralph-lauren', 'Polo Ralph Lauren'),
  ('neighborhood', 'Neighborhood'),
  ('champion', 'Champion'),
  ('american-vintage', 'American Vintage'),
  ('issey-miyake', 'Issey Miyake'),
  ('levi-s', 'Levi''s'),
  ('stone-island', 'Stone Island'),
  ('comme-des-garcons-homme', 'Comme des Garcons Homme')
ON CONFLICT (slug) DO NOTHING;

-- ── 상품 ──────────────────────────────────────────────────────
-- ARCHIVE 001 · 이예 워시드 데님 트러커 자켓 [available]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
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
  '#데님자켓 #트러커 #워시드 #이예 #간절기',
  '실측 입고 후 공개',
  NULL,
  FALSE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 002 · 더 월드 이즈 유어 오이스터 셸버튼 퍼 백 [available]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
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
  '#숄더백 #퍼백 #자개단추 #TWIYO #컨템포러리',
  '실측 입고 후 공개',
  NULL,
  FALSE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 003 · 히스테릭글래머 필드자켓 블랙 [available]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
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
  '#필드자켓 #히스테릭글래머 #일본 #스트릿 #아카이브',
  '총장 66cm · 가슴 58.5cm',
  NULL,
  FALSE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 004 · 칼하트 덕 액티브 자켓 USA [sold]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'carhartt-duck-active-jacket-usa-l',
  (SELECT id FROM brands     WHERE slug = 'carhartt'),
  (SELECT id FROM categories WHERE slug = 'top'),
  '칼하트 덕 액티브 자켓 USA',
  190000,
  165000,
  'used_good',
  '중고 · 기본적인 착용감 외 상태 양호',
  'sold_out',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 004',
  '태그는 L인데 가슴 단면이 68.5cm다. 요즘 찾는 그 오버핏이 원래 사이즈다.',
  '코튼 덕 캔버스 — 워크웨어 원단. 혼용률 태그는 입고 후 확인',
  'L 표기 / 실착 XL~2XL. 두껍게 껴입고도 여유가 남는 체급',
  '어깨 55 · 가슴 68.5 · 총장 73 · 소매 66.5 (cm)',
  '1점 한정',
  '칼하트를 오버핏으로 입고 싶은데 사이즈업이 무서웠던 사람',
  '#칼하트 #덕캔버스 #워크자켓 #USA #오버핏',
  '어깨 55 · 가슴 68.5 · 총장 73',
  NULL,
  FALSE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 005 · 칼하트 액티브 후드 자켓 타탄체크 J024 [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'carhartt-active-hood-tartan-j024',
  (SELECT id FROM brands     WHERE slug = 'carhartt'),
  (SELECT id FROM categories WHERE slug = 'top'),
  '칼하트 액티브 후드 자켓 타탄체크 J024',
  146000,
  127000,
  'used_good',
  '중고 · 상태 좋음',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 005',
  '액티브 자켓의 안감이 타탄체크로 들어간 버전. 지퍼를 열었을 때가 본편이다.',
  '코튼 덕 캔버스 겉감 + 타탄체크 안감. 혼용률 태그는 입고 후 확인',
  'S / 가슴 단면 50cm. 칼하트치고 몸에 붙는 편이라 레이어링보다 단독',
  '가슴 50 · 총장 63 (cm) — 어깨는 판매자 미기재, 입고 즉시 실측해 갱신',
  '1점 한정',
  '칼하트는 갖고 싶은데 남들 다 입는 브라운은 피하고 싶은 사람',
  '#칼하트 #타탄체크 #J024 #액티브자켓 #빈티지',
  '가슴 50 · 총장 63',
  NULL,
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 006 · 칼하트 액티브 자켓 J130 [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'carhartt-active-jacket-j130-m',
  (SELECT id FROM brands     WHERE slug = 'carhartt'),
  (SELECT id FROM categories WHERE slug = 'top'),
  '칼하트 액티브 자켓 J130',
  220000,
  200000,
  'used_good',
  '중고 · 가죽 패치 외 상태 양호',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 006',
  '칼하트 M은 원래 잘 안 나온다. 빈티지 워크웨어에서 작은 사이즈가 귀한 이유는 다들 크게 입고 크게 남겨서다.',
  '코튼 덕 캔버스. 혼용률 태그는 입고 후 확인',
  'M / 빈티지 액티브 자켓 기준 정핏. 실측은 입고 후 확정',
  '판매자 미기재 — 입고 즉시 어깨·가슴·총장·소매 4개 실측해 갱신',
  '1점 한정',
  '칼하트를 오버핏이 아니라 제 사이즈로 입고 싶은 사람',
  '#칼하트 #J130 #액티브자켓 #빈티지 #M사이즈',
  '실측 입고 후 공개',
  '가죽 패치에 사용감 있음. 판매자 할인가 적용 중이라 원가 변동 가능',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 007 · 파타고니아 신칠라 플리스 네이비 [sold]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'patagonia-synchilla-fleece-navy-m',
  (SELECT id FROM brands     WHERE slug = 'patagonia'),
  (SELECT id FROM categories WHERE slug = 'top'),
  '파타고니아 신칠라 플리스 네이비',
  173000,
  150000,
  'used_good',
  '중고 · 사용감 있으나 전체적으로 깔끔',
  'sold_out',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 007',
  '신칠라 값은 보풀이 정한다. 겨드랑이·옆구리를 먼저 보게 되는 옷인데, 이건 그쪽이 살아 있다.',
  '폴리에스터 플리스 — 신칠라 원단. 콜롬비아 생산, 체스트 포켓',
  'M / 네이비·블루 배색. 실측은 입고 후 확정',
  '판매자 미기재 — 입고 즉시 어깨·가슴·총장 3개 실측해 갱신',
  '1점 한정',
  '9월 말부터 바로 꺼내 입을 간절기 플리스를 찾는 사람',
  '#파타고니아 #신칠라 #플리스 #네이비 #간절기',
  '실측 입고 후 공개',
  NULL,
  FALSE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 008 · 파타고니아 마이크로디니 플리스 후드 자켓 [sold]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'patagonia-micro-d-hoodie-xl',
  (SELECT id FROM brands     WHERE slug = 'patagonia'),
  (SELECT id FROM categories WHERE slug = 'top'),
  '파타고니아 마이크로디니 플리스 후드 자켓',
  138000,
  120000,
  'used_good',
  '중고 · 상태 양호',
  'sold_out',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 008',
  '신칠라보다 얇고 가볍다. 두꺼운 플리스가 부담스러운 초가을에 먼저 손이 가는 쪽.',
  '폴리에스터 마이크로 플리스 — 신칠라보다 얇은 경량 라인',
  'XL (한국 105~110) / 가슴 63cm. 후드 달린 풀집업',
  '어깨 52 · 가슴 63 · 총장 71 (cm)',
  '1점 한정',
  '두꺼운 플리스는 답답하고 얇은 건 허전했던 사람',
  '#파타고니아 #마이크로디니 #플리스 #후드집업 #경량',
  '어깨 52 · 가슴 63 · 총장 71',
  '판매자가 색상을 블루/청록으로 애매하게 표기 — 상세컷 확인 후 확정',
  FALSE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 009 · 파타고니아 신칠라 [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'patagonia-synchilla-xxl',
  (SELECT id FROM brands     WHERE slug = 'patagonia'),
  (SELECT id FROM categories WHERE slug = 'top'),
  '파타고니아 신칠라',
  220000,
  200000,
  'used_good',
  '중고 · 매우 좋음. 보관만 했던 제품',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 009',
  '"보관만 했다"는 말이 실제로 맞는 개체. 이번에 모은 신칠라 중 상태 기술이 가장 강하다.',
  '폴리에스터 플리스 — 신칠라 원단',
  'XXL / 가슴 69cm. 요즘 핏으로는 정석적인 오버사이즈',
  '어깨 59 · 가슴 69 · 총장 75 · 소매 68 (cm)',
  '1점 한정',
  '신칠라를 사되 보풀 때문에 후회하고 싶지 않은 사람',
  '#파타고니아 #신칠라 #플리스 #오버핏 #A급',
  '어깨 59 · 가슴 69 · 총장 75',
  NULL,
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 010 · 파타고니아 리버시블 플리스 자켓 (단종) [sold]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'patagonia-reversible-fleece-l',
  (SELECT id FROM brands     WHERE slug = 'patagonia'),
  (SELECT id FROM categories WHERE slug = 'top'),
  '파타고니아 리버시블 플리스 자켓 (단종)',
  220000,
  200000,
  'used_good',
  '중고 · 소매·밑단에 자연스러운 사용감, 그 외 매우 양호',
  'sold_out',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 010',
  '단종된 리버시블 라인. 레트로X 다음 가격대였던 자리이고, 지금은 그 자리가 비어 있다.',
  '폴리에스터 플리스 — 양면 착용. 다크월넛 컬러',
  'L / 뒤집어 입는 구조라 두 벌처럼 쓴다',
  '판매자 미기재 — 입고 즉시 어깨·가슴·총장 3개 실측해 갱신',
  '1점 한정',
  '한 벌로 두 가지 얼굴을 쓰고 싶은 사람',
  '#파타고니아 #리버시블 #플리스 #단종 #아카이브',
  '실측 입고 후 공개',
  '판매자가 워런티 서비스 가능하다고 기재',
  FALSE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 011 · 90s Schott USAF MA-1 플라이트 자켓 [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'schott-usaf-ma1-90s-m',
  (SELECT id FROM brands     WHERE slug = 'schott'),
  (SELECT id FROM categories WHERE slug = 'top'),
  '90s Schott USAF MA-1 플라이트 자켓',
  182000,
  158000,
  'used_fair',
  '중고 · 안감 라이닝 찢어짐 있음 (간단한 손바느질로 수선 가능)',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 011',
  'MA-1 안감이 오렌지인 건 멋이 아니라 구조신호용이었다. 90년대 오리지널이라 그 규격이 그대로 남아 있다.',
  '나일론 — 리버시블 오렌지 안감. 혼용률 태그는 입고 후 확인',
  'M 표기 / 가슴 67cm로 체감 XL. 빈티지 MA-1 특유의 넉넉한 품',
  '어깨 51 · 가슴 67 · 총장 64 (cm)',
  '1점 한정',
  '레플리카 말고 90년대 실물 MA-1을 찾던 사람',
  '#쇼트 #MA1 #플라이트자켓 #90s #밀리터리',
  '어깨 51 · 가슴 67 · 총장 64',
  '하자 고지 — 안감 라이닝 찢어짐. 수선 가능하나 현 상태 그대로 발송',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 012 · 90s 쇼트 618 퍼펙토 라이더 자켓 [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'schott-618-perfecto-90s-m',
  (SELECT id FROM brands     WHERE slug = 'schott'),
  (SELECT id FROM categories WHERE slug = 'top'),
  '90s 쇼트 618 퍼펙토 라이더 자켓',
  267000,
  243000,
  'used_good',
  '중고 · 90년대 미국 생산 오리지널 빈티지',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 012',
  '퍼펙토는 쇼트가 1928년에 만든 원형이고, 618은 그 계보의 이름이다. 90년대 미국 생산분.',
  '카우하이드 레더. 혼용률·중량 태그는 입고 후 확인',
  'M / 가슴 51cm. 라이더 자켓 특유의 타이트한 정핏',
  '어깨 48 · 가슴 51 · 총장 60 · 소매 62 (cm)',
  '1점 한정',
  '라이더 자켓을 처음 사는데 이름값이 확실한 걸 찾는 사람',
  '#쇼트 #퍼펙토 #618 #라이더자켓 #90s',
  '어깨 48 · 가슴 51 · 총장 60',
  '판매자 할인가 적용 중 — 할인 종료 시 원가 인상 가능',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 013 · Avirex USA M-65 필드 재킷 [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'avirex-m65-field-jacket-m',
  (SELECT id FROM brands     WHERE slug = 'avirex'),
  (SELECT id FROM categories WHERE slug = 'top'),
  'Avirex USA M-65 필드 재킷',
  184000,
  160000,
  'used_good',
  '중고 · 빈티지 워싱',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 013',
  'M-65는 포켓 네 개와 견장, 카라에 접힌 후드까지가 규격이다. 디자인이 아니라 사양이라서 질리지 않는다.',
  '코튼·나일론 혼방 추정 — 혼용률 태그는 입고 후 확인',
  'M / 가슴 54cm. 필드자켓 기준 정핏, 니트 위에 딱 맞는다',
  '어깨 45 · 가슴 54 · 총장 68 (cm)',
  '1점 한정',
  '가을 내내 걸칠 한 벌짜리 아우터가 필요한 사람',
  '#아비렉스 #M65 #필드자켓 #밀리터리 #빈티지',
  '어깨 45 · 가슴 54 · 총장 68',
  NULL,
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 014 · 아비렉스 빈티지 MA-1 카키 [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'avirex-ma1-vintage-s',
  (SELECT id FROM brands     WHERE slug = 'avirex'),
  (SELECT id FROM categories WHERE slug = 'top'),
  '아비렉스 빈티지 MA-1 카키',
  144000,
  125000,
  'used_good',
  '중고 · 빈티지 특성상 사용감 있음',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 014',
  '체스트의 레더 로고 패치가 아비렉스의 서명이다. 카키는 오렌지 안감과 가장 무난하게 붙는 색.',
  '나일론 — 체스트 아비렉스 레더 로고 패치',
  'S / 가슴 57cm. 표기는 작지만 MA-1 구조상 품은 넉넉하다',
  '어깨 44 · 가슴 57 · 총장 64 · 소매 61 (cm)',
  '1점 한정',
  'MA-1을 오버핏 말고 딱 맞게 입고 싶은 사람',
  '#아비렉스 #MA1 #카키 #플라이트자켓 #빈티지',
  '어깨 44 · 가슴 57 · 총장 64',
  '판매자 할인가 적용 중 — 할인 종료 시 원가 인상 가능',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 015 · 폴로 랄프로렌 꽈배기 케이블 니트 네이비 23FW [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'polo-cable-knit-23fw-navy-m',
  (SELECT id FROM brands     WHERE slug = 'polo-ralph-lauren'),
  (SELECT id FROM categories WHERE slug = 'top'),
  '폴로 랄프로렌 꽈배기 케이블 니트 네이비 23FW',
  115000,
  100000,
  'used_good',
  '중고 · 상태 깨끗',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 015',
  '폴로 니트는 라벨 한 장에 값이 갈린다. Chaps도 Denim & Supply도 아닌 본라인 23FW.',
  '코튼 케이블 니트 — 혼용률 태그는 입고 후 확인',
  'M (한국 100) / 가슴 53cm. 케이블 니트 기준 정핏',
  '어깨 47 · 가슴 53 · 총장 68 (cm)',
  '1점 한정',
  '케이블 니트 한 벌로 가을을 나려는 사람',
  '#폴로 #랄프로렌 #케이블니트 #네이비 #본라인',
  '어깨 47 · 가슴 53 · 총장 68',
  '본라인 판정은 판매글 텍스트 근거 — 매입 전 라벨 사진 확인 필요',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 016 · 폴로 랄프로렌 케이블 니트 가디건 연핑크 [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'polo-cable-knit-cardigan-pink-s',
  (SELECT id FROM brands     WHERE slug = 'polo-ralph-lauren'),
  (SELECT id FROM categories WHERE slug = 'top'),
  '폴로 랄프로렌 케이블 니트 가디건 연핑크',
  90000,
  75000,
  'used_good',
  '중고 · 상태 좋고 깨끗',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 016',
  '짜임과 단추 디테일이 값을 하는 가디건. 연핑크는 폴로에서 자주 안 나오는 색이다.',
  '코튼 케이블 니트 — 혼용률 태그는 입고 후 확인',
  'S (여성) / 가슴 44cm. 크롭에 가까운 짧은 기장',
  '어깨 37 · 가슴 44 · 총장 50 (cm)',
  '1점 한정',
  '니트 위에 걸치는 얇은 겉옷을 찾는 사람',
  '#폴로 #랄프로렌 #가디건 #케이블니트 #연핑크',
  '어깨 37 · 가슴 44 · 총장 50',
  '본라인 판정은 판매글 텍스트 근거 — 매입 전 라벨 사진 확인 필요',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 017 · 폴로 랄프로렌 네이비 케이블 니트 [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'polo-cable-knit-navy-l',
  (SELECT id FROM brands     WHERE slug = 'polo-ralph-lauren'),
  (SELECT id FROM categories WHERE slug = 'top'),
  '폴로 랄프로렌 네이비 케이블 니트',
  78000,
  65000,
  'used_fair',
  '중고 · 세탁 및 스팀살균소독 완료. 빈티지 특성상 미세한 올풀림·얼룩 가능',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 017',
  '화이트 포니가 네이비 위에 올라간 기본형. 실측이 네 군데 다 적혀 있는 흔치 않은 매물이다.',
  '코튼 케이블 니트',
  'L / 가슴 46.1cm. 요즘 기준으로는 슬림한 편이라 이너로 쓰기 좋다',
  '어깨 40.3 · 가슴 46.1 · 총장 62 · 소매 61.1 (cm)',
  '1점 한정',
  '자켓 안에 넣어 입을 니트가 필요한 사람',
  '#폴로 #랄프로렌 #케이블니트 #네이비 #세탁완료',
  '어깨 40.3 · 가슴 46.1 · 총장 62',
  '본라인 판정은 판매글 텍스트 근거 — 매입 전 라벨 사진 확인 필요',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 018 · 90's Polo Ralph Lauren 필드 셔츠 (Made in USA) [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'polo-field-shirt-90s-l',
  (SELECT id FROM brands     WHERE slug = 'polo-ralph-lauren'),
  (SELECT id FROM categories WHERE slug = 'top'),
  '90''s Polo Ralph Lauren 필드 셔츠 (Made in USA)',
  103000,
  86000,
  'used_good',
  '중고 · 눈에 띄는 오염 없음',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 018',
  '숄더 에폴렛에 대형 플랩 포켓, 앵커 버튼. 셔츠라기보다 얇은 아우터로 쓰는 물건이다.',
  '코튼 — 화이트. Made in USA. 혼용률 태그는 입고 후 확인',
  'L / 가슴 61cm, 총장 83cm. 셔츠 위에 걸치는 오버셔츠 기장',
  '어깨 49 · 가슴 61 · 총장 83 · 소매 67 (cm)',
  '1점 한정',
  '얇은 셔츠 아우터로 계절을 늘리고 싶은 사람',
  '#폴로 #랄프로렌 #필드셔츠 #90s #MadeInUSA',
  '어깨 49 · 가슴 61 · 총장 83',
  NULL,
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 019 · 네이버후드 오리지널 니트 스웨터 [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'neighborhood-original-knit-m',
  (SELECT id FROM brands     WHERE slug = 'neighborhood'),
  (SELECT id FROM categories WHERE slug = 'top'),
  '네이버후드 오리지널 니트 스웨터',
  178000,
  155000,
  'used_fair',
  '중고 빈티지 · 미발견 하자 가능성 고지',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 019',
  '우라하라의 원류 중 하나. 로고를 크게 박지 않고도 알아보는 사람은 알아본다.',
  '니트 — 혼용률 태그는 입고 후 확인',
  'M / 가슴 49cm. 실측 오차 1~3cm 고지 있음',
  '어깨 45 · 가슴 49 · 총장 64.5 · 소매 69 (cm)',
  '1점 한정',
  '일본 스트리트의 원류 브랜드를 한 벌 들이고 싶은 사람',
  '#네이버후드 #NEIGHBORHOOD #니트 #우라하라 #일본',
  '어깨 45 · 가슴 49 · 총장 64.5',
  NULL,
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 020 · 히스테릭글래머 셔츠 자켓 [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'hysteric-glamour-shirt-jacket-m',
  (SELECT id FROM brands     WHERE slug = 'hysteric-glamour'),
  (SELECT id FROM categories WHERE slug = 'top'),
  '히스테릭글래머 셔츠 자켓',
  115000,
  100000,
  'used_good',
  '중고 · 깨끗. 카라 안쪽 붉은 부분은 오리지널 디자인 (겉에서 보이지 않음)',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 020',
  '1984년 키타무라 노부히코가 만든 일본 안티패션의 원류. 2026년 8월 일본 현지 구제샵 매입분이다.',
  '코튼 추정 — 혼용률 태그는 입고 후 확인',
  'M / 셔츠와 자켓 사이. 단추 디테일이 이 옷의 중심',
  '총장 69 · 옆선 60 (cm) — 어깨·가슴은 판매자 미기재, 입고 즉시 실측해 갱신',
  '1점 한정',
  '일본 브랜드를 로고 없이 입고 싶은 사람',
  '#히스테릭글래머 #셔츠자켓 #일본 #안티패션 #구제',
  '총장 69 · 옆선 60',
  NULL,
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 021 · Champion Reverse Weave 아치프린트 맨투맨 (00s 멕시코) [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'champion-reverse-weave-ny-arch-m',
  (SELECT id FROM brands     WHERE slug = 'champion'),
  (SELECT id FROM categories WHERE slug = 'top'),
  'Champion Reverse Weave 아치프린트 맨투맨 (00s 멕시코)',
  107000,
  89000,
  'used_fair',
  '중고 · 전면에 경미한 오염 있음, 그 외 양호',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 021',
  '리버스위브는 원단을 가로로 눕혀 짜서 세탁해도 기장이 안 줄어드는 구조다. 헤비웨이트 기모에 사이드 립 패널이 그 증거.',
  '코튼 헤비웨이트 기모 — 리버스위브 구조. 사이드 립 패널, 소매·밑단 연장 립',
  'M 태그지만 실측상 L핏 / 가슴 57cm. 그레이 바탕에 퍼플 프린트',
  '어깨 57 · 가슴 57 · 총장 68 · 소매 67 (cm)',
  '1점 한정',
  '맨투맨 하나를 오래 입을 생각으로 사는 사람',
  '#챔피온 #리버스위브 #맨투맨 #00s #헤비웨이트',
  '어깨 57 · 가슴 57 · 총장 68',
  '하자 고지 — 전면 경미한 오염. 전후면 프린트 페이딩 있음',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 022 · American Vintage 타탄 플란넬 셔츠 [sold]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'american-vintage-plaid-flannel-os',
  (SELECT id FROM brands     WHERE slug = 'american-vintage'),
  (SELECT id FROM categories WHERE slug = 'top'),
  'American Vintage 타탄 플란넬 셔츠',
  96000,
  80000,
  'used_fair',
  '빈티지 · 소매 끝 자연스러운 데미지 및 사용감',
  'sold_out',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 022',
  '무신사가 꼽은 2026 트렌드 ''포엣 코어''의 핵심 조합이 헤진 셔츠와 빛바랜 데님이다. 이건 그 절반.',
  '코튼 플란넬 — 부드럽게 에이징된 원단. Made in Bangladesh',
  'OS (택 M) / 품 59cm. 오버셔츠로 걸치는 기장',
  '품 59 · 총장 70 (cm) — 어깨는 판매자 미기재, 입고 즉시 실측해 갱신',
  '1점 한정',
  '빈티지 특유의 낡은 질감을 그대로 원하는 사람',
  '#아메리칸빈티지 #플란넬셔츠 #타탄체크 #포엣코어 #빈티지',
  '품 59 · 총장 70',
  NULL,
  FALSE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 023 · 1988AW 이세이미야케 Automne Hiver 반팔 티셔츠 [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'issey-miyake-1988aw-tee-m',
  (SELECT id FROM brands     WHERE slug = 'issey-miyake'),
  (SELECT id FROM categories WHERE slug = 'top'),
  '1988AW 이세이미야케 Automne Hiver 반팔 티셔츠',
  207000,
  180000,
  'used_good',
  '중고 8/10',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 023',
  '1988년 A/W 시즌 물건이다. 티셔츠 한 장이 40년 가까이 남아 있다는 사실 자체가 이 옷의 내용이다.',
  '코튼 추정 — 혼용률 태그는 입고 후 확인',
  'M / 가슴 52cm, 어깨 51cm. 반팔치고 어깨가 넉넉하다',
  '어깨 51 · 가슴 52 · 총장 72 (cm)',
  '1점 한정',
  '아카이브를 티셔츠 한 장으로 시작하려는 사람',
  '#이세이미야케 #IsseyMiyake #1988 #아카이브 #반팔티',
  '어깨 51 · 가슴 52 · 총장 72',
  NULL,
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 024 · 90s 리바이스 501 데님 (Made in USA) [sold]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'levis-501-90s-usa-32-32',
  (SELECT id FROM brands     WHERE slug = 'levi-s'),
  (SELECT id FROM categories WHERE slug = 'bottom'),
  '90s 리바이스 501 데님 (Made in USA)',
  112000,
  93000,
  'used_good',
  '중고 빈티지 · 정품',
  'sold_out',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 024',
  '501에서 Made in USA와 그 이후는 다른 옷으로 친다. 원단이 다르고 물빠짐이 다르다.',
  '코튼 데님 — 미국 생산분',
  '32×32 / 허리 40cm(반), 총장 105cm. 501 기준 레귤러 스트레이트',
  '허리 40 · 허벅지 30 · 총장 105 · 밑단 20 (cm, 반폭)',
  '1점 한정',
  '빈티지 데님을 처음 사면서 실패하고 싶지 않은 사람',
  '#리바이스 #501 #빈티지데님 #MadeInUSA #90s',
  '허리 40 · 허벅지 30 · 총장 105',
  '판매자가 교환·환불 불가 및 정품감정 문의 불가를 명시',
  FALSE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 025 · 리바이스 504 셀비지 데님 [sold]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'levis-504-selvedge-32',
  (SELECT id FROM brands     WHERE slug = 'levi-s'),
  (SELECT id FROM categories WHERE slug = 'bottom'),
  '리바이스 504 셀비지 데님',
  95000,
  79000,
  'used_good',
  '중고 빈티지 · 빈티지 특성상 색상 편차 가능',
  'sold_out',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 025',
  '505와 501 사이에 있는 라인. 501은 부담스럽고 505는 밋밋할 때 남는 답이다.',
  '코튼 데님 — 셀비지',
  '32 / 허리 43cm(반), 총장 107cm. 레귤러핏에 자연스러운 스택',
  '허리 43 · 허벅지 29 · 밑위 24 · 총장 107 · 밑단 20 (cm, 반폭)',
  '1점 한정',
  '501은 너무 흔하다고 느끼는 사람',
  '#리바이스 #504 #셀비지 #빈티지데님 #레귤러핏',
  '허리 43 · 허벅지 29 · 총장 107',
  NULL,
  FALSE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 026 · 리바이스 517 90s 화이트탭 (1997 일본 생산) [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'levis-517-90s-white-tab',
  (SELECT id FROM brands     WHERE slug = 'levi-s'),
  (SELECT id FROM categories WHERE slug = 'bottom'),
  '리바이스 517 90s 화이트탭 (1997 일본 생산)',
  161000,
  140000,
  'used_fair',
  '중고 · 미수선 원본. 크림빛 변색 및 오염 일부 있음',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 026',
  '517은 부츠컷의 원형이고, 화이트탭에 1997년 일본 생산이면 계보가 분명하다. 수선 안 된 원본이라는 게 값의 절반이다.',
  '코튼 데님 — 1997년 일본 생산',
  '실측 W31~32 상당 / 총장 114cm, 밑위 34cm. 부츠컷 실루엣',
  '허리 40 · 허벅지 29 · 밑위 34 · 총장 114 · 밑단 23 (cm, 반폭)',
  '1점 한정',
  '부츠컷 데님을 원본으로 갖고 싶은 사람',
  '#리바이스 #517 #화이트탭 #부츠컷 #90s',
  '허리 40 · 허벅지 29 · 총장 114',
  '하자 고지 — 크림빛 변색 및 오염 일부. 판매자가 이번 주 내 매물을 내릴 예정이라고 기재 (최우선 확보 대상)',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 027 · 칼하트 카펜터 더블니 팬츠 브라운 [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'carhartt-carpenter-double-knee-brn-34',
  (SELECT id FROM brands     WHERE slug = 'carhartt'),
  (SELECT id FROM categories WHERE slug = 'bottom'),
  '칼하트 카펜터 더블니 팬츠 브라운',
  161000,
  140000,
  'used_good',
  '중고 · 워싱감 좋고 상태 양호',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 027',
  '무릎이 두 겹인 건 목수 바지였기 때문이다. 그 이유가 사라진 지금도 실루엣은 그대로 남았다.',
  '코튼 덕 캔버스 — 더블니 구조',
  '34 / 허리 44.5cm(평), 인심 34인치. 카펜터 특유의 통 넓은 스트레이트',
  '허리 44.5 · 허벅지 34 · 인심 34 · 총장 108 · 밑단 23 (cm, 평/인심은 인치)',
  '1점 한정',
  '워크웨어 팬츠를 일상복으로 쓰려는 사람',
  '#칼하트 #카펜터 #더블니 #워크팬츠 #브라운',
  '허리 44.5 · 허벅지 34 · 총장 108',
  NULL,
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 028 · 빈티지 칼하트 선페이디드 블랙 팬츠 [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'carhartt-sunfaded-black-pants-32',
  (SELECT id FROM brands     WHERE slug = 'carhartt'),
  (SELECT id FROM categories WHERE slug = 'bottom'),
  '빈티지 칼하트 선페이디드 블랙 팬츠',
  108000,
  90000,
  'used_good',
  '중고 빈티지 · 코튼 100%. 전체적인 선페이드',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 028',
  '검정이 햇빛에 바래면 회갈색으로 간다. 이건 만들어서 나오는 색이 아니라 시간이 만든 색이다.',
  '코튼 100% — 전면 선페이드',
  '32×32 / 허리 41cm(평), 인심 96cm. 스니커즈·부츠·로퍼 다 무난한 기장',
  '허리 41 · 허벅지 32 · 인심 96 · 밑단 21.5 (cm, 평)',
  '1점 한정',
  '블랙 팬츠를 새것처럼 안 보이게 입고 싶은 사람',
  '#칼하트 #선페이드 #블랙팬츠 #빈티지 #워크웨어',
  '허리 41 · 허벅지 32',
  NULL,
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 029 · 90's 스톤아일랜드 그린엣지 데님 팬츠 [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'stone-island-green-edge-denim-48',
  (SELECT id FROM brands     WHERE slug = 'stone-island'),
  (SELECT id FROM categories WHERE slug = 'bottom'),
  '90''s 스톤아일랜드 그린엣지 데님 팬츠',
  293000,
  266000,
  'used_good',
  '중고 · 빈티지 데님 특유의 페이딩, 상태 좋음',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 029',
  '스톤아일랜드는 후루츠패밀리 브랜드 랭킹 1위다. 그중에서도 90년대 그린엣지는 자주 안 나온다.',
  '코튼 데님 — 그린엣지 라인',
  '48 (이탈리안, 약 W32) / 총장 116cm. 전체적으로 여유 있는 핏',
  '총장 116 · 밑단 20 (cm) — 허리는 판매자 미기재, 입고 즉시 실측해 갱신',
  '1점 한정',
  '스톤아일랜드를 아우터 말고 하의로 들이고 싶은 사람',
  '#스톤아일랜드 #StoneIsland #그린엣지 #90s #아카이브',
  '총장 116 · 밑단 20',
  NULL,
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 030 · 90's COMME des GARCONS HOMME 투턱 치노 (AD1992) [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'cdg-homme-two-tuck-chino-ad1992',
  (SELECT id FROM brands     WHERE slug = 'comme-des-garcons-homme'),
  (SELECT id FROM categories WHERE slug = 'bottom'),
  '90''s COMME des GARCONS HOMME 투턱 치노 (AD1992)',
  171000,
  149100,
  'used_good',
  '중고 8/10',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 030',
  'AD1992. 꼼데가르송은 시즌을 AD 표기로 남기는데, 그 숫자가 곧 이 옷의 나이다.',
  '코튼 치노 — 아이보리. 혼용률 태그는 입고 후 확인',
  'M (실측 W29~30) / 투턱, 루즈 테이퍼드 실루엣',
  '허리 38 · 허벅지 36.5 · 총장 101.5 · 밑단 21 (cm)',
  '1점 한정',
  '치노를 아카이브로 입고 싶은 사람',
  '#꼼데가르송 #CDGHomme #AD1992 #치노 #아카이브',
  '허리 38 · 허벅지 36.5 · 총장 101.5',
  '판매자 30% 할인가 적용 중 — 할인 종료 시 원가 인상 가능',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 031 · 꼼데가르송 옴므 나일론 스트레이트 팬츠 (AD2000) [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'cdg-homme-nylon-straight-pants-ad2000',
  (SELECT id FROM brands     WHERE slug = 'comme-des-garcons-homme'),
  (SELECT id FROM categories WHERE slug = 'bottom'),
  '꼼데가르송 옴므 나일론 스트레이트 팬츠 (AD2000)',
  220000,
  200000,
  'used_fair',
  '중고 · 엉덩이 부근에 아주 미세한 변색/얼룩 있음',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 031',
  '나일론 100%인데 피치스킨 가공이 들어가 있다. 만졌을 때 나일론 같지 않은 게 이 바지의 요점.',
  '나일론 100% — 피치스킨 텍스처. 그레이-브라운 톤다운',
  'M / 허리 39cm(반), 총장 110cm. 스트레이트',
  '허리 39 · 허벅지 33 · 인심 33 · 총장 110 · 밑단 20 (cm, 반폭)',
  '1점 한정',
  '소재로 티 내는 바지를 찾는 사람',
  '#꼼데가르송 #CDGHomme #AD2000 #나일론팬츠 #아카이브',
  '허리 39 · 허벅지 33 · 총장 110',
  '하자 고지 — 엉덩이 부근 미세 변색/얼룩. 판매자가 마지막 사진에 표기',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 032 · 꼼데가르송 옴므 포켓 팬츠 [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'cdg-homme-pocket-pants-m',
  (SELECT id FROM brands     WHERE slug = 'comme-des-garcons-homme'),
  (SELECT id FROM categories WHERE slug = 'bottom'),
  '꼼데가르송 옴므 포켓 팬츠',
  220000,
  200000,
  'used_good',
  '중고 A-B급 · 마찰로 인한 자국이 있으나 크게 티나지 않음',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 032',
  '포켓 배치로만 말하는 바지. 꼼데 옴므가 장식을 뺐을 때 무엇이 남는지 보여주는 쪽이다.',
  '혼용률 태그는 입고 후 확인',
  'M / 허리 39cm, 허벅지 31cm. 슬림한 스트레이트',
  '허리 39 · 허벅지 31 · 총장 101 · 밑단 20 (cm)',
  '1점 한정',
  '디자이너 브랜드 팬츠를 조용하게 입고 싶은 사람',
  '#꼼데가르송 #CDGHomme #포켓팬츠 #아카이브 #디자이너',
  '허리 39 · 허벅지 31 · 총장 101',
  NULL,
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 033 · 리바이스 90s USA 501 빅E 샐비지 데님 팬츠 [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'levis-501-bige-selvedge-29',
  (SELECT id FROM brands     WHERE slug = 'levi-s'),
  (SELECT id FROM categories WHERE slug = 'bottom'),
  '리바이스 90s USA 501 빅E 샐비지 데님 팬츠',
  172500,
  150000,
  'used_good',
  '중고 · made in USA 빈티지. 가죽탭 살아 있음. 허리 위쪽 새깅 리폼 이력 있음(판매자 기재)',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 033',
  '판매자 표현 그대로 "지금 나와 있는 구형 빅E 501 매물 중 워싱 핏이 정말 좋은 편". 새깅으로 리폼을 넣어 허리선이 내려앉은 개체다.',
  '코튼 데님 — 혼용률 판매자 미기재, 입고 후 확인. 가죽탭 잔존',
  '표기 29 / 판매자 권장 29~30. 허리 위쪽을 새깅 핏으로 리폼한 상태, 벨트 착용 가능하고 메인 단추는 버클 형태',
  '허리 39 · 밑위 26 · 허벅지 28 · 총장 97 · 밑단 21 (판매자 실측, 단위 cm)',
  '1점 한정',
  '구형 빅E 501의 워싱과 새깅 핏을 그대로 가져가고 싶은 사람 (판매자 착용 스펙 171/62)',
  '#리바이스 #501 #빅E #셀비지 #USA빈티지 #데님팬츠',
  '허리 39 · 밑위 26 · 총장 97',
  '판매자가 허리 위쪽을 새깅 목적으로 리폼 맡겼다고 직접 기재 — 원형이 아니다. 상세페이지에 반드시 노출할 것.',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 034 · 칼하트 싱글니 카펜터 팬츠 패트롤블루 [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'carhartt-single-knee-carpenter-ptb-34',
  (SELECT id FROM brands     WHERE slug = 'carhartt'),
  (SELECT id FROM categories WHERE slug = 'bottom'),
  '칼하트 싱글니 카펜터 팬츠 패트롤블루',
  161000,
  140000,
  'used_fair',
  '중고 · 2015년 멕시코 생산 빈티지. 세월에 따른 약간의 오염이 있을 수 있다고 판매자가 명시',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 034',
  '패트롤블루 — 챠콜과 퍼플, 네이비가 오묘하게 섞인 색. 기장 방향으로 굵게 잡힌 워싱이 러프한 카펜터 실루엣에 그대로 붙는다.',
  '코튼 100% — 굵은 입자의 캔버스',
  '표기 34x32 / 릴렉스드 스트레이트, 하이라이즈, 지퍼 플라이. 판매자 권장 남성 34',
  '허리 45 · 밑위 32.5 · 허벅지 37 · 밑단 24 · 총장 108 (판매자 실측, 단위 cm)',
  '1점 한정',
  '블랙·브라운 말고 색으로 한 벌 가져가고 싶은 사람',
  '#칼하트 #카펜터팬츠 #싱글니 #패트롤블루 #워크웨어',
  '허리 45 · 밑위 32.5 · 총장 108',
  '판매자가 빈티지 특성상 교환·환불이 어렵고 세월에 따른 약간의 오염이 있을 수 있다고 명시. 매입 시 오염 위치를 촬영해 상세페이지에 넣을 것. 원매물 배송비 3,000원 별도.',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 035 · 폴로 랄프로렌 클래식핏 치노팬츠 베이지 [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'polo-classic-fit-chino-beige-30',
  (SELECT id FROM brands     WHERE slug = 'polo-ralph-lauren'),
  (SELECT id FROM categories WHERE slug = 'bottom'),
  '폴로 랄프로렌 클래식핏 치노팬츠 베이지',
  132300,
  115000,
  'used_good',
  '중고 · 실착 3회 후 세탁 보관. 약간의 사용감 외 상태 양호(판매자 기재)',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 035',
  '스트레이트가 아닌 클래식핏이라 허벅지에서 밑단으로 자연스럽게 떨어지는 테이퍼드 실루엣. 판매자 구매가 26만원짜리를 세 번 입고 내놓은 개체다.',
  '일반 코튼 60% · 피마 코튼 40% 블렌딩(판매자 기재)',
  '30~31 / 클래식핏, 테이퍼드 느낌',
  '허리 40 · 허벅지 31 · 밑단 21 · 총장 100 (판매자 실측, 단위 cm)',
  '1점 한정',
  '데님 말고 편하게 굴릴 치노 한 벌이 필요한 사람',
  '#폴로랄프로렌 #치노팬츠 #클래식핏 #피마코튼 #베이지',
  '허리 40 · 허벅지 31 · 총장 100',
  '매입 전 라벨 확인 필요 — 판매글에 라벨 사진·문구가 없어 본라인 여부가 텍스트 근거뿐이다. Chaps · Denim & Supply · Polo Jeans Co. · Rugby · Black Label 이면 값이 갈린다.',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 036 · 폴로 랄프로렌 코듀로이 블레이저 브라운 [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'polo-corduroy-blazer-brown-xl',
  (SELECT id FROM brands     WHERE slug = 'polo-ralph-lauren'),
  (SELECT id FROM categories WHERE slug = 'top'),
  '폴로 랄프로렌 코듀로이 블레이저 브라운',
  189800,
  165000,
  'used_good',
  '중고 · 90s 추정. 상태 좋음(판매자 기재)',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 036',
  '판매자 말대로 블레이저보다 코트로 걸치는 쪽이 낫다 — 총장 83cm에 두툼한 코듀로이라 기장이 그대로 산다.',
  '코듀로이 — 혼용률 판매자 미기재, 입고 후 확인',
  '표기 XL / 총장 83cm의 긴 기장, 어깨 52 · 가슴 61의 오버한 핏',
  '총장 83 · 어깨 너비 52 · 가슴 단면 61 · 소매 길이 64 (판매자 실측, 단위 cm)',
  '1점 한정',
  '재킷 하나로 겉옷을 대신하고 싶은 사람',
  '#폴로랄프로렌 #코듀로이 #블레이저 #90s #브라운',
  '어깨 52 · 가슴 61 · 총장 83',
  '매입 전 라벨 확인 필요 — ''90s 추정'', ''유럽 폴로 공급 제품''이 모두 판매자 텍스트뿐이고 라벨 근거가 없다. 연식과 본라인 여부를 실물로 확인한 뒤 등록할 것.',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ARCHIVE 037 · 파타고니아 클래식 레트로X 자켓 내츄럴 [preorder]
INSERT INTO products (
  slug, brand_id, category_id, name, base_price, source_price,
  condition, condition_note, status, published_at,
  tag_label, hook, fabric, fit, measurements, stock_note, recommended_for, hashtags,
  short_measure, seller_note, is_preorder
) VALUES (
  'patagonia-retro-x-natural-l',
  (SELECT id FROM brands     WHERE slug = 'patagonia'),
  (SELECT id FROM categories WHERE slug = 'top'),
  '파타고니아 클래식 레트로X 자켓 내츄럴',
  207000,
  180000,
  'used_good',
  '중고 · 착용 횟수가 적어 하자 없음(판매자 기재)',
  'published',
  '2026-08-20T00:00:00+09:00'::timestamptz,
  'ARCHIVE 037',
  '클래식 레트로X 내츄럴 컬러. 판매자 기준 착용 횟수가 적어 하자 없는 개체다.',
  '플리스 — 상세 소재·혼용률 판매자 미기재, 입고 후 확인',
  '표기 L — 실측이 없어 핏 판단은 입고 후',
  '판매자 미기재 — 입고 즉시 실측해 갱신',
  '1점 한정',
  '겨울 초입에 바로 꺼내 입을 플리스를 찾는 사람',
  '#파타고니아 #레트로X #플리스 #내츄럴 #아우터',
  '실측 입고 후 공개',
  '판매글이 두 줄뿐이라 실측·소재·연식이 전부 없다. 5건 중 정보가 가장 얇은 매물이니 입고 즉시 4개 실측하고 소재 태그를 촬영할 것.',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ── 007 이 먼저 넣은 행의 008 컬럼 채우기 ─────────────────────
-- ON CONFLICT DO NOTHING 은 기존 행을 건드리지 않으므로, 007 로 들어간 3건은
-- short_measure / seller_note / is_preorder 가 비어 있다. **NULL 인 것만** 채운다 —
-- 사람이 DB 에서 직접 고친 값을 덮어쓰지 않기 위해서다.
UPDATE products SET
  short_measure = COALESCE(short_measure, '실측 입고 후 공개'),
  seller_note   = COALESCE(seller_note,   NULL)
WHERE slug = 'yiyae-washed-denim-trucker'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '실측 입고 후 공개'),
  seller_note   = COALESCE(seller_note,   NULL)
WHERE slug = 'twiyo-shell-button-fur-bag'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '총장 66cm · 가슴 58.5cm'),
  seller_note   = COALESCE(seller_note,   NULL)
WHERE slug = 'hysteric-glamour-field-jacket-black'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '어깨 55 · 가슴 68.5 · 총장 73'),
  seller_note   = COALESCE(seller_note,   NULL)
WHERE slug = 'carhartt-duck-active-jacket-usa-l'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '가슴 50 · 총장 63'),
  seller_note   = COALESCE(seller_note,   NULL)
WHERE slug = 'carhartt-active-hood-tartan-j024'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '실측 입고 후 공개'),
  seller_note   = COALESCE(seller_note,   '가죽 패치에 사용감 있음. 판매자 할인가 적용 중이라 원가 변동 가능')
WHERE slug = 'carhartt-active-jacket-j130-m'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '실측 입고 후 공개'),
  seller_note   = COALESCE(seller_note,   NULL)
WHERE slug = 'patagonia-synchilla-fleece-navy-m'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '어깨 52 · 가슴 63 · 총장 71'),
  seller_note   = COALESCE(seller_note,   '판매자가 색상을 블루/청록으로 애매하게 표기 — 상세컷 확인 후 확정')
WHERE slug = 'patagonia-micro-d-hoodie-xl'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '어깨 59 · 가슴 69 · 총장 75'),
  seller_note   = COALESCE(seller_note,   NULL)
WHERE slug = 'patagonia-synchilla-xxl'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '실측 입고 후 공개'),
  seller_note   = COALESCE(seller_note,   '판매자가 워런티 서비스 가능하다고 기재')
WHERE slug = 'patagonia-reversible-fleece-l'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '어깨 51 · 가슴 67 · 총장 64'),
  seller_note   = COALESCE(seller_note,   '하자 고지 — 안감 라이닝 찢어짐. 수선 가능하나 현 상태 그대로 발송')
WHERE slug = 'schott-usaf-ma1-90s-m'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '어깨 48 · 가슴 51 · 총장 60'),
  seller_note   = COALESCE(seller_note,   '판매자 할인가 적용 중 — 할인 종료 시 원가 인상 가능')
WHERE slug = 'schott-618-perfecto-90s-m'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '어깨 45 · 가슴 54 · 총장 68'),
  seller_note   = COALESCE(seller_note,   NULL)
WHERE slug = 'avirex-m65-field-jacket-m'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '어깨 44 · 가슴 57 · 총장 64'),
  seller_note   = COALESCE(seller_note,   '판매자 할인가 적용 중 — 할인 종료 시 원가 인상 가능')
WHERE slug = 'avirex-ma1-vintage-s'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '어깨 47 · 가슴 53 · 총장 68'),
  seller_note   = COALESCE(seller_note,   '본라인 판정은 판매글 텍스트 근거 — 매입 전 라벨 사진 확인 필요')
WHERE slug = 'polo-cable-knit-23fw-navy-m'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '어깨 37 · 가슴 44 · 총장 50'),
  seller_note   = COALESCE(seller_note,   '본라인 판정은 판매글 텍스트 근거 — 매입 전 라벨 사진 확인 필요')
WHERE slug = 'polo-cable-knit-cardigan-pink-s'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '어깨 40.3 · 가슴 46.1 · 총장 62'),
  seller_note   = COALESCE(seller_note,   '본라인 판정은 판매글 텍스트 근거 — 매입 전 라벨 사진 확인 필요')
WHERE slug = 'polo-cable-knit-navy-l'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '어깨 49 · 가슴 61 · 총장 83'),
  seller_note   = COALESCE(seller_note,   NULL)
WHERE slug = 'polo-field-shirt-90s-l'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '어깨 45 · 가슴 49 · 총장 64.5'),
  seller_note   = COALESCE(seller_note,   NULL)
WHERE slug = 'neighborhood-original-knit-m'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '총장 69 · 옆선 60'),
  seller_note   = COALESCE(seller_note,   NULL)
WHERE slug = 'hysteric-glamour-shirt-jacket-m'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '어깨 57 · 가슴 57 · 총장 68'),
  seller_note   = COALESCE(seller_note,   '하자 고지 — 전면 경미한 오염. 전후면 프린트 페이딩 있음')
WHERE slug = 'champion-reverse-weave-ny-arch-m'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '품 59 · 총장 70'),
  seller_note   = COALESCE(seller_note,   NULL)
WHERE slug = 'american-vintage-plaid-flannel-os'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '어깨 51 · 가슴 52 · 총장 72'),
  seller_note   = COALESCE(seller_note,   NULL)
WHERE slug = 'issey-miyake-1988aw-tee-m'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '허리 40 · 허벅지 30 · 총장 105'),
  seller_note   = COALESCE(seller_note,   '판매자가 교환·환불 불가 및 정품감정 문의 불가를 명시')
WHERE slug = 'levis-501-90s-usa-32-32'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '허리 43 · 허벅지 29 · 총장 107'),
  seller_note   = COALESCE(seller_note,   NULL)
WHERE slug = 'levis-504-selvedge-32'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '허리 40 · 허벅지 29 · 총장 114'),
  seller_note   = COALESCE(seller_note,   '하자 고지 — 크림빛 변색 및 오염 일부. 판매자가 이번 주 내 매물을 내릴 예정이라고 기재 (최우선 확보 대상)')
WHERE slug = 'levis-517-90s-white-tab'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '허리 44.5 · 허벅지 34 · 총장 108'),
  seller_note   = COALESCE(seller_note,   NULL)
WHERE slug = 'carhartt-carpenter-double-knee-brn-34'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '허리 41 · 허벅지 32'),
  seller_note   = COALESCE(seller_note,   NULL)
WHERE slug = 'carhartt-sunfaded-black-pants-32'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '총장 116 · 밑단 20'),
  seller_note   = COALESCE(seller_note,   NULL)
WHERE slug = 'stone-island-green-edge-denim-48'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '허리 38 · 허벅지 36.5 · 총장 101.5'),
  seller_note   = COALESCE(seller_note,   '판매자 30% 할인가 적용 중 — 할인 종료 시 원가 인상 가능')
WHERE slug = 'cdg-homme-two-tuck-chino-ad1992'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '허리 39 · 허벅지 33 · 총장 110'),
  seller_note   = COALESCE(seller_note,   '하자 고지 — 엉덩이 부근 미세 변색/얼룩. 판매자가 마지막 사진에 표기')
WHERE slug = 'cdg-homme-nylon-straight-pants-ad2000'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '허리 39 · 허벅지 31 · 총장 101'),
  seller_note   = COALESCE(seller_note,   NULL)
WHERE slug = 'cdg-homme-pocket-pants-m'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '허리 39 · 밑위 26 · 총장 97'),
  seller_note   = COALESCE(seller_note,   '판매자가 허리 위쪽을 새깅 목적으로 리폼 맡겼다고 직접 기재 — 원형이 아니다. 상세페이지에 반드시 노출할 것.')
WHERE slug = 'levis-501-bige-selvedge-29'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '허리 45 · 밑위 32.5 · 총장 108'),
  seller_note   = COALESCE(seller_note,   '판매자가 빈티지 특성상 교환·환불이 어렵고 세월에 따른 약간의 오염이 있을 수 있다고 명시. 매입 시 오염 위치를 촬영해 상세페이지에 넣을 것. 원매물 배송비 3,000원 별도.')
WHERE slug = 'carhartt-single-knee-carpenter-ptb-34'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '허리 40 · 허벅지 31 · 총장 100'),
  seller_note   = COALESCE(seller_note,   '매입 전 라벨 확인 필요 — 판매글에 라벨 사진·문구가 없어 본라인 여부가 텍스트 근거뿐이다. Chaps · Denim & Supply · Polo Jeans Co. · Rugby · Black Label 이면 값이 갈린다.')
WHERE slug = 'polo-classic-fit-chino-beige-30'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '어깨 52 · 가슴 61 · 총장 83'),
  seller_note   = COALESCE(seller_note,   '매입 전 라벨 확인 필요 — ''90s 추정'', ''유럽 폴로 공급 제품''이 모두 판매자 텍스트뿐이고 라벨 근거가 없다. 연식과 본라인 여부를 실물로 확인한 뒤 등록할 것.')
WHERE slug = 'polo-corduroy-blazer-brown-xl'
  AND (short_measure IS NULL OR seller_note IS NULL);
UPDATE products SET
  short_measure = COALESCE(short_measure, '실측 입고 후 공개'),
  seller_note   = COALESCE(seller_note,   '판매글이 두 줄뿐이라 실측·소재·연식이 전부 없다. 5건 중 정보가 가장 얇은 매물이니 입고 즉시 4개 실측하고 소재 태그를 촬영할 것.')
WHERE slug = 'patagonia-retro-x-natural-l'
  AND (short_measure IS NULL OR seller_note IS NULL);

-- ── 옵션·재고 ─────────────────────────────────────────────────
-- 전부 단벌이므로 보유분은 stock_quantity = 1. color 는 단일 상품이라 '-' 로 둔다.
-- sku 는 아카이브 번호에서 만든다(ARCHIVE 001 → WLY-001).
-- sold·preorder 는 0 — 판매완료는 물건이 나갔고, 예약주문은 아직 사입 전이다.
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-001', 'L', '-', 1 FROM products WHERE slug = 'yiyae-washed-denim-trucker'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-002', 'OS (원사이즈)', '-', 1 FROM products WHERE slug = 'twiyo-shell-button-fur-bag'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-003', 'S (실측 오버핏)', '-', 1 FROM products WHERE slug = 'hysteric-glamour-field-jacket-black'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-004', 'L (실착 XL~2XL)', '-', 0 FROM products WHERE slug = 'carhartt-duck-active-jacket-usa-l'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-005', 'S', '-', 0 FROM products WHERE slug = 'carhartt-active-hood-tartan-j024'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-006', 'M', '-', 0 FROM products WHERE slug = 'carhartt-active-jacket-j130-m'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-007', 'M', '-', 0 FROM products WHERE slug = 'patagonia-synchilla-fleece-navy-m'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-008', 'XL', '-', 0 FROM products WHERE slug = 'patagonia-micro-d-hoodie-xl'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-009', 'XXL', '-', 0 FROM products WHERE slug = 'patagonia-synchilla-xxl'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-010', 'L', '-', 0 FROM products WHERE slug = 'patagonia-reversible-fleece-l'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-011', 'M (체감 XL)', '-', 0 FROM products WHERE slug = 'schott-usaf-ma1-90s-m'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-012', 'M', '-', 0 FROM products WHERE slug = 'schott-618-perfecto-90s-m'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-013', 'M', '-', 0 FROM products WHERE slug = 'avirex-m65-field-jacket-m'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-014', 'S', '-', 0 FROM products WHERE slug = 'avirex-ma1-vintage-s'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-015', 'M (100)', '-', 0 FROM products WHERE slug = 'polo-cable-knit-23fw-navy-m'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-016', 'S (여성)', '-', 0 FROM products WHERE slug = 'polo-cable-knit-cardigan-pink-s'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-017', 'L', '-', 0 FROM products WHERE slug = 'polo-cable-knit-navy-l'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-018', 'L', '-', 0 FROM products WHERE slug = 'polo-field-shirt-90s-l'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-019', 'M', '-', 0 FROM products WHERE slug = 'neighborhood-original-knit-m'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-020', 'M', '-', 0 FROM products WHERE slug = 'hysteric-glamour-shirt-jacket-m'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-021', 'M 태그 (실측상 L)', '-', 0 FROM products WHERE slug = 'champion-reverse-weave-ny-arch-m'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-022', 'OS (택 M)', '-', 0 FROM products WHERE slug = 'american-vintage-plaid-flannel-os'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-023', 'M', '-', 0 FROM products WHERE slug = 'issey-miyake-1988aw-tee-m'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-024', '32x32', '-', 0 FROM products WHERE slug = 'levis-501-90s-usa-32-32'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-025', '32', '-', 0 FROM products WHERE slug = 'levis-504-selvedge-32'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-026', '실측 W31~32 상당', '-', 0 FROM products WHERE slug = 'levis-517-90s-white-tab'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-027', '34', '-', 0 FROM products WHERE slug = 'carhartt-carpenter-double-knee-brn-34'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-028', '32x32', '-', 0 FROM products WHERE slug = 'carhartt-sunfaded-black-pants-32'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-029', '48 (약 W32)', '-', 0 FROM products WHERE slug = 'stone-island-green-edge-denim-48'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-030', 'M (실측 W29~30)', '-', 0 FROM products WHERE slug = 'cdg-homme-two-tuck-chino-ad1992'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-031', 'M', '-', 0 FROM products WHERE slug = 'cdg-homme-nylon-straight-pants-ad2000'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-032', 'M', '-', 0 FROM products WHERE slug = 'cdg-homme-pocket-pants-m'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-033', '29 (표기)', '-', 0 FROM products WHERE slug = 'levis-501-bige-selvedge-29'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-034', '34x32 (표기)', '-', 0 FROM products WHERE slug = 'carhartt-single-knee-carpenter-ptb-34'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-035', '30~31', '-', 0 FROM products WHERE slug = 'polo-classic-fit-chino-beige-30'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-036', 'XL (표기)', '-', 0 FROM products WHERE slug = 'polo-corduroy-blazer-brown-xl'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT id, 'WLY-037', 'L (표기)', '-', 0 FROM products WHERE slug = 'patagonia-retro-x-natural-l'
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
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/_9UCJfyva3-1787361776114-5wp4zte8x.jpg', '칼하트 덕 액티브 자켓 USA', TRUE, 0
FROM products p
WHERE p.slug = 'carhartt-duck-active-jacket-usa-l'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/_9UCJfyva3-1787361776114-5wp4zte8x.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/l16SYm7Fs-dd028f9ff892.jpg', '칼하트 액티브 후드 자켓 타탄체크 J024', TRUE, 0
FROM products p
WHERE p.slug = 'carhartt-active-hood-tartan-j024'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/l16SYm7Fs-dd028f9ff892.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/GMyHwdBja-4217f327578a.jpg', '칼하트 액티브 자켓 J130', TRUE, 0
FROM products p
WHERE p.slug = 'carhartt-active-jacket-j130-m'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/GMyHwdBja-4217f327578a.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/C7ZB90fVH-954be00cb293.jpg', '파타고니아 신칠라 플리스 네이비', TRUE, 0
FROM products p
WHERE p.slug = 'patagonia-synchilla-fleece-navy-m'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/C7ZB90fVH-954be00cb293.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/v30_3Q2Y9-6f0076cbf932.jpg', '파타고니아 마이크로디니 플리스 후드 자켓', TRUE, 0
FROM products p
WHERE p.slug = 'patagonia-micro-d-hoodie-xl'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/v30_3Q2Y9-6f0076cbf932.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/iexrlUQ2n-b49b54baf110.jpg', '파타고니아 신칠라', TRUE, 0
FROM products p
WHERE p.slug = 'patagonia-synchilla-xxl'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/iexrlUQ2n-b49b54baf110.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/htKakFy_7-d2872bcec29b.jpg', '파타고니아 리버시블 플리스 자켓 (단종)', TRUE, 0
FROM products p
WHERE p.slug = 'patagonia-reversible-fleece-l'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/htKakFy_7-d2872bcec29b.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/MgEK7NxLa-a015d6fb9ac3.jpg', '90s Schott USAF MA-1 플라이트 자켓', TRUE, 0
FROM products p
WHERE p.slug = 'schott-usaf-ma1-90s-m'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/MgEK7NxLa-a015d6fb9ac3.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/v5UlseQwQ-c01a43a8d0b2.jpg', '90s 쇼트 618 퍼펙토 라이더 자켓', TRUE, 0
FROM products p
WHERE p.slug = 'schott-618-perfecto-90s-m'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/v5UlseQwQ-c01a43a8d0b2.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/XcHO9t23X-dd99437a15be.jpg', 'Avirex USA M-65 필드 재킷', TRUE, 0
FROM products p
WHERE p.slug = 'avirex-m65-field-jacket-m'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/XcHO9t23X-dd99437a15be.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/qIOtfNdytJ-B03674B0-D0E8-4391-8424-B0CDD8392C7F.jpg', '아비렉스 빈티지 MA-1 카키', TRUE, 0
FROM products p
WHERE p.slug = 'avirex-ma1-vintage-s'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/qIOtfNdytJ-B03674B0-D0E8-4391-8424-B0CDD8392C7F.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/Q7OUsOCWl-e24a031f5bc3.jpg', '폴로 랄프로렌 꽈배기 케이블 니트 네이비 23FW', TRUE, 0
FROM products p
WHERE p.slug = 'polo-cable-knit-23fw-navy-m'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/Q7OUsOCWl-e24a031f5bc3.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/WLvo-Y5tq-1d182fea24d6.jpg', '폴로 랄프로렌 케이블 니트 가디건 연핑크', TRUE, 0
FROM products p
WHERE p.slug = 'polo-cable-knit-cardigan-pink-s'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/WLvo-Y5tq-1d182fea24d6.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/ToGvMU7F6v-1779533196129-m3lrd81aj.jpg', '폴로 랄프로렌 네이비 케이블 니트', TRUE, 0
FROM products p
WHERE p.slug = 'polo-cable-knit-navy-l'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/ToGvMU7F6v-1779533196129-m3lrd81aj.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/0FzGq_WT1-274561c70fa1.jpg', '90''s Polo Ralph Lauren 필드 셔츠 (Made in USA)', TRUE, 0
FROM products p
WHERE p.slug = 'polo-field-shirt-90s-l'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/0FzGq_WT1-274561c70fa1.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/2uXGuJa5xo-EDBB5487-67ED-465C-A62F-2282F29222C3.jpg', '네이버후드 오리지널 니트 스웨터', TRUE, 0
FROM products p
WHERE p.slug = 'neighborhood-original-knit-m'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/2uXGuJa5xo-EDBB5487-67ED-465C-A62F-2282F29222C3.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/UOEh5Bkz7-2629936e5575.jpg', '히스테릭글래머 셔츠 자켓', TRUE, 0
FROM products p
WHERE p.slug = 'hysteric-glamour-shirt-jacket-m'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/UOEh5Bkz7-2629936e5575.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/UdpMw9LI4S-CD5B4F6C-94B4-418E-B9D4-E24A4E46F80D.jpg', 'Champion Reverse Weave 아치프린트 맨투맨 (00s 멕시코)', TRUE, 0
FROM products p
WHERE p.slug = 'champion-reverse-weave-ny-arch-m'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/UdpMw9LI4S-CD5B4F6C-94B4-418E-B9D4-E24A4E46F80D.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/tWcjFn6iF-822c84596540.jpg', 'American Vintage 타탄 플란넬 셔츠', TRUE, 0
FROM products p
WHERE p.slug = 'american-vintage-plaid-flannel-os'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/tWcjFn6iF-822c84596540.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/ynAykgykZ-5f74e05ebbfe.jpg', '1988AW 이세이미야케 Automne Hiver 반팔 티셔츠', TRUE, 0
FROM products p
WHERE p.slug = 'issey-miyake-1988aw-tee-m'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/ynAykgykZ-5f74e05ebbfe.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/XxlIrSFcC-b1060ebb67dd.jpg', '90s 리바이스 501 데님 (Made in USA)', TRUE, 0
FROM products p
WHERE p.slug = 'levis-501-90s-usa-32-32'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/XxlIrSFcC-b1060ebb67dd.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/9ZYbOFtxP-f9b8f4e72773.jpg', '리바이스 504 셀비지 데님', TRUE, 0
FROM products p
WHERE p.slug = 'levis-504-selvedge-32'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/9ZYbOFtxP-f9b8f4e72773.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/_zi_SvHyM-b13594e6b74c.jpg', '리바이스 517 90s 화이트탭 (1997 일본 생산)', TRUE, 0
FROM products p
WHERE p.slug = 'levis-517-90s-white-tab'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/_zi_SvHyM-b13594e6b74c.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/IA4nZCQm--65a53dbf3e2a.jpg', '칼하트 카펜터 더블니 팬츠 브라운', TRUE, 0
FROM products p
WHERE p.slug = 'carhartt-carpenter-double-knee-brn-34'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/IA4nZCQm--65a53dbf3e2a.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/3LHKLM-5A-b9691156d0c3.jpg', '빈티지 칼하트 선페이디드 블랙 팬츠', TRUE, 0
FROM products p
WHERE p.slug = 'carhartt-sunfaded-black-pants-32'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/3LHKLM-5A-b9691156d0c3.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/zDJ7QVP_Q-e1e895673381.jpg', '90''s 스톤아일랜드 그린엣지 데님 팬츠', TRUE, 0
FROM products p
WHERE p.slug = 'stone-island-green-edge-denim-48'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/zDJ7QVP_Q-e1e895673381.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/yXA7l8m_Fe-1E912C5D-8C2C-4A70-AAB9-55CB33BA600D.jpg', '90''s COMME des GARCONS HOMME 투턱 치노 (AD1992)', TRUE, 0
FROM products p
WHERE p.slug = 'cdg-homme-two-tuck-chino-ad1992'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/yXA7l8m_Fe-1E912C5D-8C2C-4A70-AAB9-55CB33BA600D.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/-GbdpUA9B-2d91bc5ae682.jpg', '꼼데가르송 옴므 나일론 스트레이트 팬츠 (AD2000)', TRUE, 0
FROM products p
WHERE p.slug = 'cdg-homme-nylon-straight-pants-ad2000'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/-GbdpUA9B-2d91bc5ae682.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/YomW2Lm5n-be866d5069d5.jpg', '꼼데가르송 옴므 포켓 팬츠', TRUE, 0
FROM products p
WHERE p.slug = 'cdg-homme-pocket-pants-m'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/YomW2Lm5n-be866d5069d5.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/7qt4GCPVG-4848fc3b6119.jpg', '리바이스 90s USA 501 빅E 샐비지 데님 팬츠', TRUE, 0
FROM products p
WHERE p.slug = 'levis-501-bige-selvedge-29'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/7qt4GCPVG-4848fc3b6119.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/lEiPnaY1Z-ed5b342cfc1b.jpg', '칼하트 싱글니 카펜터 팬츠 패트롤블루', TRUE, 0
FROM products p
WHERE p.slug = 'carhartt-single-knee-carpenter-ptb-34'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/lEiPnaY1Z-ed5b342cfc1b.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/xINvF8qO_-7599ed1a165c.jpg', '폴로 랄프로렌 클래식핏 치노팬츠 베이지', TRUE, 0
FROM products p
WHERE p.slug = 'polo-classic-fit-chino-beige-30'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/xINvF8qO_-7599ed1a165c.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/owJ6DTcth-3033b5e01755.jpg', '폴로 랄프로렌 코듀로이 블레이저 브라운', TRUE, 0
FROM products p
WHERE p.slug = 'polo-corduroy-blazer-brown-xl'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/owJ6DTcth-3033b5e01755.jpg'
  );
INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
SELECT p.id, 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/x_mm0JUik-940aa6fadd81.jpg', '파타고니아 클래식 레트로X 자켓 내츄럴', TRUE, 0
FROM products p
WHERE p.slug = 'patagonia-retro-x-natural-l'
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.url = 'https://image.production.fruitsfamily.com/public/product/resized%40width1125/x_mm0JUik-940aa6fadd81.jpg'
  );

COMMIT;

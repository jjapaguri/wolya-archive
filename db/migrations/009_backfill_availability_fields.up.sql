-- 009_backfill_availability_fields.up.sql
-- WOLYA ARCHIVE — 008 이 추가한 컬럼에 값 채우기
--
-- ⚠️ 이 파일은 생성물이다. 직접 고치지 말 것.
--    원본: src/data/products.ts
--    재생성: node --experimental-strip-types scripts/gen_backfill_sql.mjs > db/migrations/009_backfill_availability_fields.up.sql
--
-- 전제: 008_product_availability.up.sql 이 먼저 적용돼 있어야 한다.
-- 멱등: slug 기준 UPDATE 라 몇 번 돌려도 같다. DB 에 없는 상품은 0행 갱신되고 넘어간다.
-- 파괴적 구문(DROP/DELETE/TRUNCATE/SET NOT NULL) 없음.
--
-- 총 32건 중 현재 DB 에 시드된 것만 실제로 갱신된다.

BEGIN;

-- ARCHIVE 001 · 이예 워시드 데님 트러커 자켓
UPDATE products SET
  availability  = 'available',
  kind          = 'top',
  short_measure = '실측 입고 후 공개',
  source_url    = NULL,
  note          = NULL
WHERE slug = 'yiyae-washed-denim-trucker';

-- ARCHIVE 002 · 더 월드 이즈 유어 오이스터 셸버튼 퍼 백
UPDATE products SET
  availability  = 'available',
  kind          = NULL,
  short_measure = '실측 입고 후 공개',
  source_url    = NULL,
  note          = NULL
WHERE slug = 'twiyo-shell-button-fur-bag';

-- ARCHIVE 003 · 히스테릭글래머 필드자켓 블랙
UPDATE products SET
  availability  = 'available',
  kind          = 'top',
  short_measure = '총장 66cm · 가슴 58.5cm',
  source_url    = NULL,
  note          = NULL
WHERE slug = 'hysteric-glamour-field-jacket-black';

-- ARCHIVE 004 · 칼하트 덕 액티브 자켓 USA
UPDATE products SET
  availability  = 'preorder',
  kind          = 'top',
  short_measure = '어깨 55 · 가슴 68.5 · 총장 73',
  source_url    = 'https://fruitsfamily.com/product/6dfwa',
  note          = NULL
WHERE slug = 'carhartt-duck-active-jacket-usa-l';

-- ARCHIVE 005 · 칼하트 액티브 후드 자켓 타탄체크 J024
UPDATE products SET
  availability  = 'preorder',
  kind          = 'top',
  short_measure = '가슴 50 · 총장 63',
  source_url    = 'https://fruitsfamily.com/product/5z1sl',
  note          = NULL
WHERE slug = 'carhartt-active-hood-tartan-j024';

-- ARCHIVE 006 · 칼하트 액티브 자켓 J130
UPDATE products SET
  availability  = 'preorder',
  kind          = 'top',
  short_measure = '실측 입고 후 공개',
  source_url    = 'https://fruitsfamily.com/product/6c4i0',
  note          = '가죽 패치에 사용감 있음. 판매자 할인가 적용 중이라 원가 변동 가능'
WHERE slug = 'carhartt-active-jacket-j130-m';

-- ARCHIVE 007 · 파타고니아 신칠라 플리스 네이비
UPDATE products SET
  availability  = 'preorder',
  kind          = 'top',
  short_measure = '실측 입고 후 공개',
  source_url    = 'https://fruitsfamily.com/product/6dny6',
  note          = NULL
WHERE slug = 'patagonia-synchilla-fleece-navy-m';

-- ARCHIVE 008 · 파타고니아 마이크로디니 플리스 후드 자켓
UPDATE products SET
  availability  = 'preorder',
  kind          = 'top',
  short_measure = '어깨 52 · 가슴 63 · 총장 71',
  source_url    = 'https://fruitsfamily.com/product/6dn7h',
  note          = '판매자가 색상을 블루/청록으로 애매하게 표기 — 상세컷 확인 후 확정'
WHERE slug = 'patagonia-micro-d-hoodie-xl';

-- ARCHIVE 009 · 파타고니아 신칠라
UPDATE products SET
  availability  = 'preorder',
  kind          = 'top',
  short_measure = '어깨 59 · 가슴 69 · 총장 75',
  source_url    = 'https://fruitsfamily.com/product/6d5f7',
  note          = NULL
WHERE slug = 'patagonia-synchilla-xxl';

-- ARCHIVE 010 · 파타고니아 리버시블 플리스 자켓 (단종)
UPDATE products SET
  availability  = 'preorder',
  kind          = 'top',
  short_measure = '실측 입고 후 공개',
  source_url    = 'https://fruitsfamily.com/product/6dht5',
  note          = '판매자가 워런티 서비스 가능하다고 기재'
WHERE slug = 'patagonia-reversible-fleece-l';

-- ARCHIVE 011 · 90s Schott USAF MA-1 플라이트 자켓
UPDATE products SET
  availability  = 'preorder',
  kind          = 'top',
  short_measure = '어깨 51 · 가슴 67 · 총장 64',
  source_url    = 'https://fruitsfamily.com/product/6cnt2',
  note          = '하자 고지 — 안감 라이닝 찢어짐. 수선 가능하나 현 상태 그대로 발송'
WHERE slug = 'schott-usaf-ma1-90s-m';

-- ARCHIVE 012 · 90s 쇼트 618 퍼펙토 라이더 자켓
UPDATE products SET
  availability  = 'preorder',
  kind          = 'top',
  short_measure = '어깨 48 · 가슴 51 · 총장 60',
  source_url    = 'https://fruitsfamily.com/product/5ul0z',
  note          = '판매자 할인가 적용 중 — 할인 종료 시 원가 인상 가능'
WHERE slug = 'schott-618-perfecto-90s-m';

-- ARCHIVE 013 · Avirex USA M-65 필드 재킷
UPDATE products SET
  availability  = 'preorder',
  kind          = 'top',
  short_measure = '어깨 45 · 가슴 54 · 총장 68',
  source_url    = 'https://fruitsfamily.com/product/6dh11',
  note          = NULL
WHERE slug = 'avirex-m65-field-jacket-m';

-- ARCHIVE 014 · 아비렉스 빈티지 MA-1 카키
UPDATE products SET
  availability  = 'preorder',
  kind          = 'top',
  short_measure = '어깨 44 · 가슴 57 · 총장 64',
  source_url    = 'https://fruitsfamily.com/product/4sgch',
  note          = '판매자 할인가 적용 중 — 할인 종료 시 원가 인상 가능'
WHERE slug = 'avirex-ma1-vintage-s';

-- ARCHIVE 015 · 폴로 랄프로렌 꽈배기 케이블 니트 네이비 23FW
UPDATE products SET
  availability  = 'preorder',
  kind          = 'top',
  short_measure = '어깨 47 · 가슴 53 · 총장 68',
  source_url    = 'https://fruitsfamily.com/product/6dpp8',
  note          = '본라인 판정은 판매글 텍스트 근거 — 매입 전 라벨 사진 확인 필요'
WHERE slug = 'polo-cable-knit-23fw-navy-m';

-- ARCHIVE 016 · 폴로 랄프로렌 케이블 니트 가디건 연핑크
UPDATE products SET
  availability  = 'preorder',
  kind          = 'top',
  short_measure = '어깨 37 · 가슴 44 · 총장 50',
  source_url    = 'https://fruitsfamily.com/product/6dppe',
  note          = '본라인 판정은 판매글 텍스트 근거 — 매입 전 라벨 사진 확인 필요'
WHERE slug = 'polo-cable-knit-cardigan-pink-s';

-- ARCHIVE 017 · 폴로 랄프로렌 네이비 케이블 니트
UPDATE products SET
  availability  = 'preorder',
  kind          = 'top',
  short_measure = '어깨 40.3 · 가슴 46.1 · 총장 62',
  source_url    = 'https://fruitsfamily.com/product/5jjxg',
  note          = '본라인 판정은 판매글 텍스트 근거 — 매입 전 라벨 사진 확인 필요'
WHERE slug = 'polo-cable-knit-navy-l';

-- ARCHIVE 018 · 90's Polo Ralph Lauren 필드 셔츠 (Made in USA)
UPDATE products SET
  availability  = 'preorder',
  kind          = 'top',
  short_measure = '어깨 49 · 가슴 61 · 총장 83',
  source_url    = 'https://fruitsfamily.com/product/6dkpa',
  note          = NULL
WHERE slug = 'polo-field-shirt-90s-l';

-- ARCHIVE 019 · 네이버후드 오리지널 니트 스웨터
UPDATE products SET
  availability  = 'preorder',
  kind          = 'top',
  short_measure = '어깨 45 · 가슴 49 · 총장 64.5',
  source_url    = 'https://fruitsfamily.com/product/52s3w',
  note          = NULL
WHERE slug = 'neighborhood-original-knit-m';

-- ARCHIVE 020 · 히스테릭글래머 셔츠 자켓
UPDATE products SET
  availability  = 'preorder',
  kind          = 'top',
  short_measure = '총장 69 · 옆선 60',
  source_url    = 'https://fruitsfamily.com/product/6ar9j',
  note          = NULL
WHERE slug = 'hysteric-glamour-shirt-jacket-m';

-- ARCHIVE 021 · Champion Reverse Weave 아치프린트 맨투맨 (00s 멕시코)
UPDATE products SET
  availability  = 'preorder',
  kind          = 'top',
  short_measure = '어깨 57 · 가슴 57 · 총장 68',
  source_url    = 'https://fruitsfamily.com/product/4v31h',
  note          = '하자 고지 — 전면 경미한 오염. 전후면 프린트 페이딩 있음'
WHERE slug = 'champion-reverse-weave-ny-arch-m';

-- ARCHIVE 022 · American Vintage 타탄 플란넬 셔츠
UPDATE products SET
  availability  = 'preorder',
  kind          = 'top',
  short_measure = '품 59 · 총장 70',
  source_url    = 'https://fruitsfamily.com/product/6c6pf',
  note          = NULL
WHERE slug = 'american-vintage-plaid-flannel-os';

-- ARCHIVE 023 · 1988AW 이세이미야케 Automne Hiver 반팔 티셔츠
UPDATE products SET
  availability  = 'preorder',
  kind          = 'top',
  short_measure = '어깨 51 · 가슴 52 · 총장 72',
  source_url    = 'https://fruitsfamily.com/product/6dpdg',
  note          = NULL
WHERE slug = 'issey-miyake-1988aw-tee-m';

-- ARCHIVE 024 · 90s 리바이스 501 데님 (Made in USA)
UPDATE products SET
  availability  = 'preorder',
  kind          = 'bottom',
  short_measure = '허리 40 · 허벅지 30 · 총장 105',
  source_url    = 'https://fruitsfamily.com/product/6dni2',
  note          = '판매자가 교환·환불 불가 및 정품감정 문의 불가를 명시'
WHERE slug = 'levis-501-90s-usa-32-32';

-- ARCHIVE 025 · 리바이스 504 셀비지 데님
UPDATE products SET
  availability  = 'preorder',
  kind          = 'bottom',
  short_measure = '허리 43 · 허벅지 29 · 총장 107',
  source_url    = 'https://fruitsfamily.com/product/6doie',
  note          = NULL
WHERE slug = 'levis-504-selvedge-32';

-- ARCHIVE 026 · 리바이스 517 90s 화이트탭 (1997 일본 생산)
UPDATE products SET
  availability  = 'preorder',
  kind          = 'bottom',
  short_measure = '허리 40 · 허벅지 29 · 총장 114',
  source_url    = 'https://fruitsfamily.com/product/5ol7y',
  note          = '하자 고지 — 크림빛 변색 및 오염 일부. 판매자가 이번 주 내 매물을 내릴 예정이라고 기재 (최우선 확보 대상)'
WHERE slug = 'levis-517-90s-white-tab';

-- ARCHIVE 027 · 칼하트 카펜터 더블니 팬츠 브라운
UPDATE products SET
  availability  = 'preorder',
  kind          = 'bottom',
  short_measure = '허리 44.5 · 허벅지 34 · 총장 108',
  source_url    = 'https://fruitsfamily.com/product/6chki',
  note          = NULL
WHERE slug = 'carhartt-carpenter-double-knee-brn-34';

-- ARCHIVE 028 · 빈티지 칼하트 선페이디드 블랙 팬츠
UPDATE products SET
  availability  = 'preorder',
  kind          = 'bottom',
  short_measure = '허리 41 · 허벅지 32',
  source_url    = 'https://fruitsfamily.com/product/6dkta',
  note          = NULL
WHERE slug = 'carhartt-sunfaded-black-pants-32';

-- ARCHIVE 029 · 90's 스톤아일랜드 그린엣지 데님 팬츠
UPDATE products SET
  availability  = 'preorder',
  kind          = 'bottom',
  short_measure = '총장 116 · 밑단 20',
  source_url    = 'https://fruitsfamily.com/product/6dkjx',
  note          = NULL
WHERE slug = 'stone-island-green-edge-denim-48';

-- ARCHIVE 030 · 90's COMME des GARCONS HOMME 투턱 치노 (AD1992)
UPDATE products SET
  availability  = 'preorder',
  kind          = 'bottom',
  short_measure = '허리 38 · 허벅지 36.5 · 총장 101.5',
  source_url    = 'https://fruitsfamily.com/product/6dpt5',
  note          = '판매자 30% 할인가 적용 중 — 할인 종료 시 원가 인상 가능'
WHERE slug = 'cdg-homme-two-tuck-chino-ad1992';

-- ARCHIVE 031 · 꼼데가르송 옴므 나일론 스트레이트 팬츠 (AD2000)
UPDATE products SET
  availability  = 'preorder',
  kind          = 'bottom',
  short_measure = '허리 39 · 허벅지 33 · 총장 110',
  source_url    = 'https://fruitsfamily.com/product/6d4pj',
  note          = '하자 고지 — 엉덩이 부근 미세 변색/얼룩. 판매자가 마지막 사진에 표기'
WHERE slug = 'cdg-homme-nylon-straight-pants-ad2000';

-- ARCHIVE 032 · 꼼데가르송 옴므 포켓 팬츠
UPDATE products SET
  availability  = 'preorder',
  kind          = 'bottom',
  short_measure = '허리 39 · 허벅지 31 · 총장 101',
  source_url    = 'https://fruitsfamily.com/product/6axez',
  note          = NULL
WHERE slug = 'cdg-homme-pocket-pants-m';

COMMIT;

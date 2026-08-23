-- 009_backfill_availability_fields.verify.sql
-- 적용 후 확인용. 읽기 전용이며 데이터를 바꾸지 않는다.
--
-- 적용: psql "$DATABASE_URL" -f db/migrations/009_backfill_availability_fields.verify.sql

\echo '=== 1. 상품별 매입 상태·코디 분류·짧은 실측 ==='
SELECT tag_label, availability, coalesce(kind,'(NULL)') AS kind, short_measure
FROM products WHERE deleted_at IS NULL ORDER BY tag_label;

\echo ''
\echo '=== 2. short_measure 가 비어 있는 상품 (카드에 실측이 안 나온다) ==='
SELECT count(*) AS 빈값 FROM products
WHERE deleted_at IS NULL AND (short_measure IS NULL OR short_measure = '');

\echo ''
\echo '=== 3. 예약주문인데 원본 링크가 없는 건 (생존 체크 불가) ==='
SELECT count(*) AS 링크없음 FROM products
WHERE deleted_at IS NULL AND availability = 'preorder' AND source_url IS NULL;

\echo ''
\echo '=== 4. CHECK 위반이 없는지 (0건이어야 함) ==='
SELECT count(*) AS 위반 FROM products
WHERE deleted_at IS NULL
  AND (availability NOT IN ('available','preorder')
       OR (kind IS NOT NULL AND kind NOT IN ('top','bottom')));

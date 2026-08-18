# DB 마이그레이션

WOLYA ARCHIVE PostgreSQL 스키마. 서버: Lightsail `archieve-wolya`, DB `wolya`, 계정 `wolya_app`.

## 파일 규칙

마이그레이션 하나는 항상 **3종 세트**다. 하나라도 없으면 미완성이다.

| 파일 | 역할 |
|---|---|
| `NNN_이름.up.sql` | 적용 |
| `NNN_이름.down.sql` | 되돌리기 |
| `NNN_이름.verify.sql` | 적용 후 확인 (읽기 전용) |

## 실행 방법 (서버에서)

```bash
cd ~/app
set -a; . ./.env.local; set +a          # DATABASE_URL 읽기

~/app/scripts/pg_backup.sh              # 1) 백업 먼저 — 예외 없음
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/001_products.up.sql
psql "$DATABASE_URL" -f db/migrations/001_products.verify.sql
```

`-v ON_ERROR_STOP=1` 을 빼면 중간에 실패해도 계속 진행돼 스키마가 반쯤 적용된 상태로 남는다. 반드시 붙일 것.

## 현재 단계

| 단계 | 내용 | 상태 |
|---|---|---|
| 1 | 상품 노출 — brands, categories, products, product_variants, product_images, tags, product_tags | `001_products` |
| 2 | 회원·주문 — users, user_social_accounts, user_addresses, carts, cart_items, orders, order_items | 미작성 |
| 3 | 결제·배송 — payments, shipments, order_status_histories | 미작성 |
| 4 | CS — reviews, review_images, inquiries, inquiry_answers, faqs | 미작성 |

## 스키마 1단계 요점

- **재고는 `product_variants.stock_quantity`** 에 있다. `products` 에는 재고가 없다.
  사이즈·색상 조합이 곧 재고 단위이며 `UNIQUE(product_id, size, color)` 로 중복을 막는다.
- `stock_quantity >= 0` **CHECK** 가 걸려 있다. 동시 주문으로 재고가 음수가 되려 하면
  조용히 넘어가지 않고 트랜잭션이 실패한다. 애플리케이션은 반드시 조건부 UPDATE 를 쓸 것:

  ```sql
  UPDATE product_variants
     SET stock_quantity = stock_quantity - :qty
   WHERE id = :id AND stock_quantity >= :qty;
  ```
  영향 행이 0이면 품절 처리.

- 금액은 전부 `INTEGER` 원 단위. `sale_price <= base_price` CHECK.
- `status='published'` 인데 `published_at` 이 비어 있을 수 없다 (노출 정렬이 어긋나는 것 방지).
- 카테고리는 **2단계까지**. 손자 카테고리를 만들면 트리거가 막는다.
- 대표 이미지(`is_primary`)는 상품당 1장만 — 부분 유니크 인덱스로 강제.
- 상품 삭제는 `deleted_at` 소프트 삭제. 물리 삭제 금지.
- `updated_at` 은 트리거가 자동 갱신하므로 앱에서 넣지 않아도 된다.

## 백업

`scripts/pg_backup.sh` — 매일 04:00 KST cron, `~/backups/` 에 7일치 보관.
같은 디스크에 저장되므로 **Lightsail 자동 스냅샷과 함께 써야** 의미가 있다.

복원:
```bash
pg_restore --clean --if-exists -d "$DATABASE_URL" ~/backups/wolya-YYYYmmdd-HHMMSS.dump
```

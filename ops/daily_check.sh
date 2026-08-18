#!/usr/bin/env bash
# 매일 1회 DB를 읽어 운영 이상을 찾아 JSON 리포트로 남긴다.
# 절대 SELECT 외의 것을 하지 않는다. 컬럼명은 db/migrations/001~005 실제 정의를 따랐다.
#
# 휴면 규칙: 상품 0건 + 주문 0건이면 "아직 시작 안 됨"으로 기록만 하고 경고하지 않는다.
# 데이터가 들어오는 순간 자동으로 깨어나 점검을 시작한다.
SCRIPT_NAME=daily_check
. "$(dirname "$0")/lib.sh"
guard opscheck
lock
load_db || { alert critical "DB 접속 정보 로드 실패"; exit 1; }

OUT="$REPORT_DIR/$(date +%F).json"
q() { psql "$DATABASE_URL" -X -A -t -q -v ON_ERROR_STOP=1 -c "$1" 2>>"$LOG_DIR/psql.err"; }

products_total=$(q "SELECT count(*) FROM products WHERE deleted_at IS NULL;")
orders_total=$(q  "SELECT count(*) FROM orders;")
products_total=${products_total:-0}; orders_total=${orders_total:-0}

if [ "$products_total" = "0" ] && [ "$orders_total" = "0" ]; then
  printf '{"date":"%s","state":"dormant","note":"상품·주문 0건. 점검 항목 없음.","products":0,"orders":0}\n' \
    "$(date +%F)" > "$OUT"
  log "휴면 — 상품·주문 0건"
  exit 0
fi

# ── 점검 항목 ───────────────────────────────────────────────
new_orders_24h=$(q "SELECT count(*) FROM orders WHERE created_at >= now() - interval '24 hours';")

# 결제됐는데 아직 준비 단계로 안 넘어간 주문 (6시간 넘게 방치된 것만)
unprocessed=$(q "SELECT count(*) FROM orders
                  WHERE status = 'paid' AND paid_at < now() - interval '6 hours';")

# 재고 0인데 사이트에 판매중으로 노출 — 단벌 재고라 이게 가장 자주 터진다
oversell_risk=$(q "SELECT count(*) FROM products p
                    WHERE p.status = 'published' AND p.deleted_at IS NULL
                      AND EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id)
                      AND (SELECT sum(v.stock_quantity) FROM product_variants v
                            WHERE v.product_id = p.id) = 0;")

# 판매중인데 variant 자체가 없는 상품 — 장바구니에 담을 수 없는 유령 상품
no_variant=$(q "SELECT count(*) FROM products p
                 WHERE p.status = 'published' AND p.deleted_at IS NULL
                   AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id);")

# 주문은 paid 인데 결제 레코드가 없음 = PG 웹훅 유실 신호
webhook_lost=$(q "SELECT count(*) FROM orders o
                   WHERE o.status = 'paid'
                     AND NOT EXISTS (SELECT 1 FROM payments pm
                                      WHERE pm.order_id = o.id AND pm.status = 'paid');")

# 반대 방향 — 결제는 성공했는데 주문이 pending 에 머무름
payment_orphan=$(q "SELECT count(*) FROM payments pm
                     JOIN orders o ON o.id = pm.order_id
                     WHERE pm.status = 'paid' AND o.status = 'pending';")

# 발송 후 3일 넘게 배송완료로 안 바뀐 건
stuck_shipping=$(q "SELECT count(*) FROM shipments
                     WHERE status IN ('shipped','in_transit')
                       AND shipped_at < now() - interval '3 days';")

# 미답변 문의 (24시간 초과)
open_inquiries=$(q "SELECT count(*) FROM inquiries
                     WHERE status = 'open' AND deleted_at IS NULL
                       AND created_at < now() - interval '24 hours';")

# 처리 대기 중인 반품·교환 요청
pending_returns=$(q "SELECT count(*) FROM order_returns
                      WHERE status = 'requested' AND requested_at < now() - interval '24 hours';")

# 신고된 리뷰
reported_reviews=$(q "SELECT count(*) FROM reviews WHERE status = 'reported' AND deleted_at IS NULL;")

n() { echo "${1:-0}"; }
cat > "$OUT" <<JSON
{
  "date": "$(date +%F)",
  "state": "active",
  "products": $(n "$products_total"),
  "orders": $(n "$orders_total"),
  "checks": {
    "new_orders_24h":   $(n "$new_orders_24h"),
    "unprocessed_paid": $(n "$unprocessed"),
    "oversell_risk":    $(n "$oversell_risk"),
    "published_no_variant": $(n "$no_variant"),
    "webhook_lost":     $(n "$webhook_lost"),
    "payment_orphan":   $(n "$payment_orphan"),
    "stuck_shipping":   $(n "$stuck_shipping"),
    "open_inquiries":   $(n "$open_inquiries"),
    "pending_returns":  $(n "$pending_returns"),
    "reported_reviews": $(n "$reported_reviews")
  }
}
JSON

# ── 임계값 초과분만 알림 ────────────────────────────────────
[ "$(n "$webhook_lost")"   -gt 0 ] && alert critical "결제됨 표시인데 payments 레코드 없는 주문 ${webhook_lost}건 — 웹훅 유실 의심"
[ "$(n "$payment_orphan")" -gt 0 ] && alert critical "결제 성공했으나 주문이 pending 인 건 ${payment_orphan}건"
[ "$(n "$oversell_risk")"  -gt 0 ] && alert critical "재고 0인데 판매중인 상품 ${oversell_risk}건 — 단벌 재고 과판매 위험"
[ "$(n "$no_variant")"     -gt 0 ] && alert warn     "variant 없는 판매중 상품 ${no_variant}건"
[ "$(n "$unprocessed")"    -gt 0 ] && alert warn     "6시간 넘게 미처리인 결제완료 주문 ${unprocessed}건"
[ "$(n "$stuck_shipping")" -gt 0 ] && alert warn     "3일 이상 배송 정체 ${stuck_shipping}건"
[ "$(n "$open_inquiries")" -gt 0 ] && alert warn     "24시간 초과 미답변 문의 ${open_inquiries}건"
[ "$(n "$pending_returns")" -gt 0 ] && alert warn    "24시간 초과 미처리 반품요청 ${pending_returns}건"

# 30일 지난 리포트 정리
find "$REPORT_DIR" -name '20*.json' -mtime +30 -delete 2>/dev/null
log "완료 — 상품 $products_total / 주문 $orders_total"

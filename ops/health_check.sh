#!/usr/bin/env bash
# 5분마다 실행. 사이트가 살아 있는지 보고, 죽었으면 스스로 살린다.
# 지금 단계에서 실제로 가치가 있는 유일한 자동화다.
SCRIPT_NAME=health_check
. "$(dirname "$0")/lib.sh"
guard healing
lock

SITE="https://archive-wolya.com"
FAILS_FILE="$STATE_DIR/health_fails"
fails=$(cat "$FAILS_FILE" 2>/dev/null || echo 0)

code=$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 20 "$SITE" 2>/dev/null || echo 000)
pm2_state=$(pm2 jlist 2>/dev/null | python3 -c '
import json,sys
try: d=json.load(sys.stdin)
except Exception: print("unknown"); sys.exit()
for p in d:
    if p.get("name")=="archive-wolya": print(p["pm2_env"]["status"]); sys.exit()
print("missing")' 2>/dev/null || echo unknown)

healthy=true
[ "$code" = "200" ] || healthy=false
[ "$pm2_state" = "online" ] || healthy=false

if $healthy; then
  [ "$fails" -gt 0 ] && alert info "복구됨 (연속실패 $fails 회 후 정상)"
  echo 0 > "$FAILS_FILE"
else
  fails=$((fails+1)); echo "$fails" > "$FAILS_FILE"
  alert warn "비정상 감지 — HTTP=$code PM2=$pm2_state (연속 $fails 회)"

  # 자가복구: 2회 연속 실패부터 PM2 재시작, 4회부터 nginx 까지
  if [ "$fails" -ge 2 ]; then
    log "자가복구 시도 — pm2 restart archive-wolya"
    pm2 restart archive-wolya >/dev/null 2>&1
    sleep 15
    code2=$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 20 "$SITE" 2>/dev/null || echo 000)
    if [ "$code2" = "200" ]; then
      alert info "PM2 재시작으로 복구 성공"; echo 0 > "$FAILS_FILE"
    elif [ "$fails" -ge 4 ]; then
      log "자가복구 2단계 — nginx reload"
      sudo systemctl reload nginx >/dev/null 2>&1
      alert critical "자가복구 실패 — 사람 개입 필요. HTTP=$code2 PM2=$pm2_state"
    fi
  fi
fi

# ── 느리게 나빠지는 것들 (하루 1회만 경고) ─────────────────
today=$(date +%F)
if [ "$(cat "$STATE_DIR/slow_checked" 2>/dev/null)" != "$today" ]; then
  echo "$today" > "$STATE_DIR/slow_checked"

  disk=$(df -P / | awk 'NR==2{gsub("%","",$5); print $5}')
  [ "${disk:-0}" -ge 80 ] && alert warn "디스크 사용률 ${disk}%"

  mem=$(free -m | awk '/^Mem:/{printf "%d", $3*100/$2}')
  [ "${mem:-0}" -ge 90 ] && alert warn "메모리 사용률 ${mem}%"

  # SSL 만료 — 현재 인증서는 2026-11-12 만료, 자동갱신 등록돼 있으나 갱신 실패를 놓치면 사이트가 죽는다
  exp=$(echo | openssl s_client -servername archive-wolya.com -connect archive-wolya.com:443 2>/dev/null \
        | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
  if [ -n "$exp" ]; then
    left=$(( ( $(date -d "$exp" +%s) - $(date +%s) ) / 86400 ))
    [ "$left" -le 20 ] && alert critical "SSL 인증서 ${left}일 남음 — certbot 갱신 확인 필요"
    [ "$left" -le 40 ] && [ "$left" -gt 20 ] && alert warn "SSL 인증서 ${left}일 남음"
  else
    alert warn "SSL 만료일 확인 실패"
  fi

  # 백업이 실제로 돌고 있는지 (파일 존재만 믿지 않고 어제자 파일을 확인)
  if [ -d "$HOME/backups" ]; then
    recent=$(find "$HOME/backups" -type f -mtime -2 | wc -l)
    [ "$recent" -eq 0 ] && alert critical "최근 2일 내 백업 파일 없음 — pg_backup.sh 점검 필요"
  fi
fi

log "완료 HTTP=$code PM2=$pm2_state"

#!/usr/bin/env bash
# 공용 라이브러리 — 모든 자동화 스크립트가 첫 줄에서 source 한다.
# 역할: 킬스위치 확인, 로그, 잠금, 알림.

set -uo pipefail

OPS_DIR="${OPS_DIR:-$HOME/ops}"
APP_DIR="${APP_DIR:-$HOME/app}"
LOG_DIR="$OPS_DIR/logs"
STATE_DIR="$OPS_DIR/state"
REPORT_DIR="$OPS_DIR/reports"
FLAG_URL="https://raw.githubusercontent.com/jjapaguri/wolya-archive/main/ops/automation.json"

mkdir -p "$LOG_DIR" "$STATE_DIR" "$REPORT_DIR"

log() { printf '%s [%s] %s\n' "$(date '+%F %T')" "${SCRIPT_NAME:-ops}" "$*" | tee -a "$LOG_DIR/$(date +%F).log" >&2; }

# ── 킬스위치 ────────────────────────────────────────────────
# 우선순위: 로컬 STOP 파일 > GitHub 플래그 > 캐시 > 기본 정지
# "판단이 안 서면 멈춘다" 가 원칙이다. 플래그를 못 읽으면 자동화는 돌지 않는다.
guard() {
  local switch_name="$1"

  if [ -f "$OPS_DIR/STOP" ]; then
    log "STOP 파일 존재 — 중단"; exit 0
  fi

  local flag cache="$STATE_DIR/automation.json"
  flag="$(curl -fsS --max-time 10 "$FLAG_URL" 2>/dev/null)"
  if [ -n "$flag" ]; then
    printf '%s' "$flag" > "$cache"
  elif [ -f "$cache" ]; then
    # 캐시는 6시간까지만 믿는다. 그 이상 오래됐는데 원격을 못 읽으면
    # "사용자가 GitHub 에서 정지시켰는데 서버가 못 읽고 계속 도는" 상황이 되므로 멈춘다.
    if [ -n "$(find "$cache" -mmin +360 2>/dev/null)" ]; then
      log "플래그 원격 조회 실패 + 캐시가 6시간 이상 오래됨 — 안전을 위해 중단"; exit 0
    fi
    log "플래그 원격 조회 실패 — 캐시 사용 (6시간 이내)"
    flag="$(cat "$cache")"
  else
    log "플래그를 읽을 수 없고 캐시도 없음 — 안전을 위해 중단"; exit 0
  fi

  local ok
  ok="$(printf '%s' "$flag" | python3 -c '
import json,sys
try:
    d = json.load(sys.stdin)
except Exception:
    print("no"); sys.exit()
if not d.get("enabled"):
    print("no"); sys.exit()
print("yes" if d.get("switches", {}).get(sys.argv[1]) else "no")
' "$switch_name" 2>/dev/null)"

  if [ "$ok" != "yes" ]; then
    log "스위치 '$switch_name' 꺼짐 — 중단"; exit 0
  fi
}

flag_get() {  # flag_get switches.writes
  python3 -c '
import json,sys
d=json.load(open(sys.argv[1])); 
for k in sys.argv[2].split("."): d=d.get(k, {}) if isinstance(d, dict) else {}
print(json.dumps(d))
' "$STATE_DIR/automation.json" "$1" 2>/dev/null
}

# ── 중복 실행 방지 ──────────────────────────────────────────
lock() {
  exec 9>"$STATE_DIR/${SCRIPT_NAME:-ops}.lock"
  flock -n 9 || { log "이미 실행 중 — 종료"; exit 0; }
}

# ── 알림 ────────────────────────────────────────────────────
# 서버는 메일을 직접 보내지 않는다(SMTP 미설정, IP 평판 문제).
# 대신 알림을 파일로 쌓고 Cowork 예약 작업이 HTTPS로 읽어 Gmail 로 보낸다.
alert() {  # alert <level: info|warn|critical> <message>
  local level="$1"; shift
  printf '%s\t%s\t%s\t%s\n' "$(date -Iseconds)" "$level" "${SCRIPT_NAME:-ops}" "$*" \
    >> "$REPORT_DIR/alerts.tsv"
  log "ALERT[$level] $*"
}

# DB 접속 문자열 로드 — 값은 절대 출력하지 않는다 (AGENTS.md 불변규칙 6)
load_db() {
  [ -f "$APP_DIR/.env.local" ] || { log ".env.local 없음"; return 1; }
  set -a; . "$APP_DIR/.env.local"; set +a
  [ -n "${DATABASE_URL:-}" ] || { log "DATABASE_URL 미설정"; return 1; }
}

#!/usr/bin/env bash
# 서버 상태를 하나의 JSON 으로 묶어 HTTPS 로 읽을 수 있는 위치에 놓는다.
# Cowork 예약 작업은 서버에 SSH 로 붙을 수 없다(22번 포트 차단). 443 만 열려 있으므로 이 경로로 넘긴다.
# 비밀은 담지 않는다 — 숫자와 상태 문자열만.
SCRIPT_NAME=publish
. "$(dirname "$0")/lib.sh"

FEED_DIR=/var/www/ops-feed
TOKEN_FILE="$OPS_DIR/feed_token"
[ -f "$TOKEN_FILE" ] || { log "feed_token 없음 — setup.sh 를 먼저 실행"; exit 1; }
TOKEN=$(cat "$TOKEN_FILE")

latest_report="$REPORT_DIR/$(date +%F).json"
[ -f "$latest_report" ] || latest_report=$(ls -1t "$REPORT_DIR"/20*.json 2>/dev/null | head -1)

python3 - "$latest_report" "$REPORT_DIR/alerts.tsv" "$STATE_DIR/automation.json" <<'PY' > "$FEED_DIR/$TOKEN.json.tmp"
import json, sys, os, subprocess, datetime

report_path, alerts_path, flag_path = sys.argv[1], sys.argv[2], sys.argv[3]

def read_json(p):
    try:
        with open(p) as f: return json.load(f)
    except Exception: return None

def sh(cmd):
    try: return subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=15).stdout.strip()
    except Exception: return ""

# 최근 48시간 알림만
alerts = []
cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=48)
if os.path.exists(alerts_path):
    for line in open(alerts_path).read().splitlines()[-500:]:
        parts = line.split("\t")
        if len(parts) != 4: continue
        try:
            ts = datetime.datetime.fromisoformat(parts[0])
        except Exception:
            continue
        if ts.tzinfo is None: ts = ts.replace(tzinfo=datetime.timezone.utc)
        if ts >= cutoff:
            alerts.append({"at": parts[0], "level": parts[1], "source": parts[2], "message": parts[3]})

out = {
    "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "automation": read_json(flag_path),
    "daily_report": read_json(report_path),
    "alerts_48h": alerts,
    "server": {
        "uptime": sh("uptime -p"),
        "disk_used_pct": sh("df -P / | awk 'NR==2{gsub(\"%\",\"\",$5); print $5}'"),
        "mem_used_pct": sh("free -m | awk '/^Mem:/{printf \"%d\", $3*100/$2}'"),
        "pm2": sh("pm2 jlist 2>/dev/null | python3 -c \"import json,sys;d=json.load(sys.stdin);print(next((p['pm2_env']['status'] for p in d if p.get('name')=='archive-wolya'),'missing'))\""),
        "deployed_sha": sh("git -C $HOME/app rev-parse --short HEAD"),
        "deployed_at": sh("git -C $HOME/app log -1 --format=%cI"),
        "deployed_subject": sh("git -C $HOME/app log -1 --format=%s"),
        "backup_latest": sh("ls -1t $HOME/backups 2>/dev/null | head -1"),
    },
}

# 서버 위 헤드리스 에이전트가 남긴 자동 진단문이 있으면 함께 실어 보낸다
diag = os.path.join(os.path.dirname(report_path), "diagnosis.md")
out["diagnosis"] = open(diag).read() if os.path.exists(diag) else None

print(json.dumps(out, ensure_ascii=False, indent=1))
PY

if [ -s "$FEED_DIR/$TOKEN.json.tmp" ]; then
  mv "$FEED_DIR/$TOKEN.json.tmp" "$FEED_DIR/$TOKEN.json"
  chmod 644 "$FEED_DIR/$TOKEN.json"
  log "피드 갱신 완료"
else
  rm -f "$FEED_DIR/$TOKEN.json.tmp"; log "피드 생성 실패"
fi

#!/usr/bin/env bash
# 서버에서 한 번만 실행한다. 두 번 실행해도 안전하다(멱등).
#   bash ~/app/ops/setup.sh
set -euo pipefail

OPS_DIR="$HOME/ops"
APP_DIR="$HOME/app"
SRC="$APP_DIR/ops"

echo "==> 1/6 디렉토리"
mkdir -p "$OPS_DIR"/{logs,state,reports}
chmod 700 "$OPS_DIR"

echo "==> 2/6 스크립트 심볼릭 링크 (레포를 pull 하면 자동으로 최신이 된다)"
for f in lib.sh run.sh health_check.sh daily_check.sh auto_deploy.sh publish.sh agent_runner.sh; do
  ln -sf "$SRC/$f" "$OPS_DIR/$f"
done
chmod +x "$SRC"/*.sh

echo "==> 3/6 피드 토큰"
if [ ! -f "$OPS_DIR/feed_token" ]; then
  head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 40 > "$OPS_DIR/feed_token"
  chmod 600 "$OPS_DIR/feed_token"
fi
TOKEN=$(cat "$OPS_DIR/feed_token")

echo "==> 4/6 피드 디렉토리 + Nginx"
sudo mkdir -p /var/www/ops-feed
sudo chown "$USER":"$USER" /var/www/ops-feed
sudo chmod 755 /var/www/ops-feed

CONF=/etc/nginx/sites-available/archive-wolya
if ! sudo grep -q 'location /ops-feed/' "$CONF"; then
  sudo cp "$CONF" "$CONF.bak.$(date +%s)"
  # 443 서버 블록의 첫 location / 앞에 삽입
  sudo python3 - "$CONF" <<'PY'
import sys, re
p = sys.argv[1]
s = open(p).read()
block = """
    # 자동화 상태 피드 — 추측 불가능한 토큰 파일명으로만 접근된다.
    location /ops-feed/ {
        alias /var/www/ops-feed/;
        autoindex off;
        add_header Cache-Control "no-store";
        try_files $uri =404;
    }
"""
i = s.find("location / {")
if i == -1:
    sys.exit("location / 블록을 찾지 못함 — 수동으로 추가할 것")
s = s[:i] + block.strip() + "\n\n    " + s[i:]
open(p, "w").write(s)
print("nginx 설정에 /ops-feed/ 추가됨")
PY
  sudo nginx -t && sudo systemctl reload nginx
else
  echo "    이미 설정됨 — 건너뜀"
fi

echo "==> 5/6 cron"
# 기존 백업(04:00)과 겹치지 않게 배치했다.
CRON_BLOCK=$(cat <<CRON
# --- wolya automation (setup.sh 가 관리. 직접 편집하지 말 것) ---
# run.sh 를 거치는 이유는 ops/run.sh 주석 참고 (실행 비트 사고·조용한 실패 방지).
*/5  * * * * /bin/bash $OPS_DIR/run.sh health_check >/dev/null 2>&1
*/10 * * * * /bin/bash $OPS_DIR/run.sh auto_deploy  >/dev/null 2>&1
30   3 * * * /bin/bash $OPS_DIR/run.sh daily_check  >/dev/null 2>&1
*/20 * * * * /bin/bash $OPS_DIR/run.sh agent_runner >/dev/null 2>&1
*/15 * * * * /bin/bash $OPS_DIR/run.sh publish      >/dev/null 2>&1
0    5 * * 0 find $OPS_DIR/logs -name '*.log' -mtime +14 -delete
# --- end wolya automation ---
CRON
)
( crontab -l 2>/dev/null | sed '/--- wolya automation/,/--- end wolya automation ---/d'; echo "$CRON_BLOCK" ) | crontab -

echo "==> 6/6 sudo 권한 (자가복구용 nginx reload 만 비밀번호 없이)"
SUDOERS=/etc/sudoers.d/wolya-ops
if [ ! -f "$SUDOERS" ]; then
  echo "$USER ALL=(root) NOPASSWD: /bin/systemctl reload nginx" | sudo tee "$SUDOERS" >/dev/null
  sudo chmod 440 "$SUDOERS"
fi

"$OPS_DIR/publish.sh" || true

cat <<EOF

────────────────────────────────────────────────────────────
 설치 완료.

 상태 피드 URL (Cowork 에 알려줄 것 — 이 주소가 곧 비밀번호다):

   https://archive-wolya.com/ops-feed/$TOKEN.json

 전면 정지:  touch ~/ops/STOP        (즉시, 서버에서)
 원격 정지:  GitHub 에서 ops/automation.json 의 "enabled" 를 false 로
 재개:       rm ~/ops/STOP  /  enabled 를 true 로

 확인:
   crontab -l
   tail -f ~/ops/logs/\$(date +%F).log
   curl -s https://archive-wolya.com/ops-feed/$TOKEN.json | head -40
────────────────────────────────────────────────────────────
EOF

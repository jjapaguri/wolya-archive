#!/usr/bin/env bash
# 10분마다 실행. main 에 새 커밋이 있고 CI 가 초록불이면 스스로 배포한다.
# 배포 후 사이트가 살아나지 않으면 스스로 이전 커밋으로 되돌린다.
#
# 왜 GitHub Actions 에서 서버로 밀지 않고 서버가 당겨오는가:
#   - GitHub 에 서버 SSH 키를 저장하지 않아도 된다
#   - 킬스위치 한 곳(ops/automation.json)으로 확실히 멈출 수 있다
#   - Actions 가 죽어도 서버는 그냥 배포를 안 할 뿐, 이상 동작을 하지 않는다
SCRIPT_NAME=auto_deploy
. "$(dirname "$0")/lib.sh"
guard deploy
lock

REPO="jjapaguri/wolya-archive"
SITE="https://archive-wolya.com"
cd "$APP_DIR" || { alert critical "앱 디렉토리 없음"; exit 1; }

current=$(git rev-parse HEAD)
git fetch --quiet origin main || { log "fetch 실패"; exit 0; }
remote=$(git rev-parse origin/main)

[ "$current" = "$remote" ] && { log "변경 없음"; exit 0; }

# ── 일일 배포 횟수 제한 ─────────────────────────────────────
today=$(date +%F); cnt_file="$STATE_DIR/deploys_$today"
count=$(cat "$cnt_file" 2>/dev/null || echo 0)
max=$(python3 -c 'import json;print(json.load(open("'"$STATE_DIR"'/automation.json"))["guards"]["max_deploys_per_day"])' 2>/dev/null || echo 10)
if [ "$count" -ge "$max" ]; then
  alert warn "오늘 자동배포 한도($max) 도달 — 배포 보류 (${remote:0:7})"; exit 0
fi

# ── CI 초록불 확인 ──────────────────────────────────────────
concl=$(curl -fsS --max-time 20 \
  "https://api.github.com/repos/$REPO/actions/runs?head_sha=$remote&per_page=10" 2>/dev/null \
  | python3 -c '
import json,sys
try: d=json.load(sys.stdin)
except Exception: print("unreadable"); sys.exit()
runs=d.get("workflow_runs",[])
if not runs: print("none"); sys.exit()
if any(r["status"]!="completed" for r in runs): print("running"); sys.exit()
print("success" if all(r["conclusion"]=="success" for r in runs) else "failure")' 2>/dev/null)

case "$concl" in
  success) : ;;
  running) log "CI 진행 중 — 다음 주기에 재시도"; exit 0 ;;
  none)    log "해당 커밋의 CI 실행 없음 — 배포하지 않음"; exit 0 ;;
  failure) alert critical "CI 실패한 커밋이 main 에 있음 (${remote:0:7}) — 배포 보류"; exit 0 ;;
  *)       log "CI 상태 확인 불가 — 배포하지 않음"; exit 0 ;;
esac

# ── 배포 ────────────────────────────────────────────────────
log "배포 시작 ${current:0:7} → ${remote:0:7}"
echo "$current" > "$STATE_DIR/last_good_sha"

deploy_to() {
  git reset --hard "$1" --quiet \
    && npm ci --omit=dev --no-audit --no-fund >/dev/null 2>&1 \
    && NODE_OPTIONS="--max-old-space-size=1536" npm run build >/dev/null 2>&1 \
    && pm2 restart archive-wolya >/dev/null 2>&1
}

verify_live() {
  for i in 1 2 3 4 5 6; do
    sleep 10
    [ "$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 20 "$SITE")" = "200" ] && return 0
  done
  return 1
}

if deploy_to "$remote" && verify_live; then
  echo $((count+1)) > "$cnt_file"
  msg=$(git log -1 --pretty=%s "$remote")
  alert info "자동배포 성공 ${remote:0:7} — $msg"
  log "배포 완료"
else
  alert critical "배포 실패 — ${current:0:7} 로 롤백 시도"
  if deploy_to "$current" && verify_live; then
    alert critical "롤백 성공. 사이트는 정상이나 ${remote:0:7} 는 배포되지 않았다. 코드 확인 필요."
  else
    alert critical "롤백까지 실패 — 사이트 다운 가능성. 즉시 사람 개입 필요."
  fi
fi

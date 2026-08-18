#!/usr/bin/env bash
# 10분마다 실행. main 에 새 커밋이 있고 CI 가 초록불이면 스스로 배포한다.
# 배포 후 사이트가 살아나지 않으면 스스로 이전 커밋으로 되돌린다.
#
# 왜 GitHub Actions 에서 서버로 밀지 않고 서버가 당겨오는가:
#   - GitHub 에 서버 SSH 키를 저장하지 않아도 된다
#   - 킬스위치 한 곳(ops/automation.json)으로 확실히 멈출 수 있다
#   - Actions 가 죽어도 서버는 그냥 배포를 안 할 뿐, 이상 동작을 하지 않는다
# ── 자기 자신을 덮어쓰는 문제 방지 ──────────────────────────
# 이 스크립트는 아래에서 `git reset --hard` 로 ~/app 을 갱신하는데,
# 그 대상에 이 파일 자신이 포함된다(~/ops/auto_deploy.sh 는 ~/app/ops/auto_deploy.sh 심볼릭 링크).
# bash 는 스크립트를 통째로 읽지 않고 바이트 오프셋으로 이어 읽는다. 실행 중에 파일이 바뀌면
# 남은 부분을 새 파일의 엉뚱한 위치에서 읽는다 — 조용히 중단되거나(종료코드 0!)
# 원본에 없던 명령 조각이 실행된다. 실제로 재현된다.
# 사본을 만들어 그쪽에서 실행하면 원본이 어떻게 바뀌든 영향받지 않는다.
if [ -z "${OPS_SELF_COPY:-}" ]; then
  _src="$(readlink -f "$0")"
  _run="${OPS_DIR:-$HOME/ops}/state/auto_deploy.running"
  mkdir -p "$(dirname "$_run")"
  cp "$_src" "$_run" || exit 1
  OPS_SELF_COPY=1 OPS_SRC_DIR="$(dirname "$_src")" exec bash "$_run"
fi

SCRIPT_NAME=auto_deploy
. "${OPS_SRC_DIR:-$(dirname "$0")}/lib.sh"
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
  # --omit=dev 를 쓰지 않는다. typescript·tailwindcss·@tailwindcss/postcss 가
  # devDependencies 인데 next build 에 반드시 필요하다. 빼면 빌드가 죽는다.
  #
  # .next 를 먼저 지운다. 실패한 빌드가 남긴 캐시가 다음 빌드까지 오염시켜서
  # 롤백마저 같은 이유로 실패하는 일이 실제로 있었다 (2026-08-18).
  git reset --hard "$1" --quiet \
    && rm -rf .next \
    && npm ci --no-audit --no-fund >/dev/null 2>&1 \
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

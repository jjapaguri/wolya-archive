#!/usr/bin/env bash
# 서버 위에서 도는 헤드리스 Claude Code.
# 노트북이 꺼져 있어도 서버가 스스로 판단할 수 있게 하는 유일한 경로다.
#
# 두 가지 일을 한다.
#   1) critical 알림이 새로 뜨면 → 스스로 원인을 조사해 진단문을 남긴다 (읽기 전용)
#   2) ~/ops/queue/*.task 파일이 있으면 → 그 작업을 수행한다 (Claude Code·사용자가 넣는다)
#
# 전제: 서버에 Claude Code 가 설치되고 인증돼 있어야 한다. 없으면 조용히 종료한다.
SCRIPT_NAME=agent_runner
. "$(dirname "$0")/lib.sh"
guard agent
lock

command -v claude >/dev/null 2>&1 || { log "claude 미설치 — 종료"; exit 0; }

QUEUE="$OPS_DIR/queue"; mkdir -p "$QUEUE" "$QUEUE/done"
DIAG="$REPORT_DIR/diagnosis.md"

run_claude() {  # run_claude <프롬프트파일> <출력파일>
  # 쓰기 권한을 주지 않는다. 조사와 서술까지만.
  timeout 900 claude -p "$(cat "$1")" \
    --allowed-tools "Read,Grep,Glob,Bash(git log:*),Bash(git status),Bash(git diff:*),Bash(pm2 logs:*),Bash(pm2 status),Bash(tail:*),Bash(psql:*)" \
    > "$2" 2>>"$LOG_DIR/agent.err"
}

# ── 1) critical 자동 진단 ───────────────────────────────────
last_seen="$STATE_DIR/last_critical_seen"
newest=$(grep -P '\tcritical\t' "$REPORT_DIR/alerts.tsv" 2>/dev/null | tail -1)
if [ -n "$newest" ] && [ "$newest" != "$(cat "$last_seen" 2>/dev/null)" ]; then
  echo "$newest" > "$last_seen"
  log "새 critical 감지 — 자동 진단 시작"
  cat > "$STATE_DIR/diag_prompt.txt" <<PROMPT
너는 archive-wolya.com 운영 서버 안에서 돌고 있다. 방금 아래 critical 알림이 발생했다.

$newest

최근 48시간 알림:
$(tail -30 "$REPORT_DIR/alerts.tsv" 2>/dev/null)

오늘 점검 리포트:
$(cat "$REPORT_DIR/$(date +%F).json" 2>/dev/null)

할 일: 원인을 조사해 아래 형식으로만 답하라. 한국어. 15줄 이내.

## 무슨 일이 일어났나
## 원인 (추정이면 추정이라고 명시)
## 지금 사람이 해야 할 일 — 없으면 "없음"
## 코드 수정이 필요한가 — 필요하면 어느 파일의 무엇인지

조사에 쓸 수 있는 것: ~/app 의 코드, git log, pm2 logs, ~/ops/logs/, DB 읽기(psql, SELECT 만).
**아무것도 고치지 마라.** 쓰기·배포·재시작 금지. 조사와 서술만 한다.
확인하지 못한 것은 지어내지 말고 "확인 못함"이라고 적는다.
PROMPT
  if run_claude "$STATE_DIR/diag_prompt.txt" "$DIAG.tmp" && [ -s "$DIAG.tmp" ]; then
    { echo "# 자동 진단 — $(date '+%F %T')"; echo; echo "대상: $newest"; echo;
      cat "$DIAG.tmp"; } > "$DIAG"
    alert info "critical 자동 진단 완료 — 아침 브리핑에 포함됨"
    log "진단 완료"
  else
    log "진단 실패 (claude 실행 오류)"
  fi
  rm -f "$DIAG.tmp"
fi

# ── 2) 작업 큐 ──────────────────────────────────────────────
for task in "$QUEUE"/*.task; do
  [ -e "$task" ] || break
  name=$(basename "$task" .task)
  log "작업 시작: $name"
  out="$QUEUE/done/$name.result.md"
  if run_claude "$task" "$out"; then
    alert info "작업 완료: $name"
  else
    alert warn "작업 실패: $name"
  fi
  mv "$task" "$QUEUE/done/$name.task"
done

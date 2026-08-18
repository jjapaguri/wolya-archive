#!/usr/bin/env bash
# cron 진입점. crontab 은 이 파일 하나만 부른다.
#   /bin/bash ~/ops/run.sh health_check
#
# 왜 스크립트를 cron 이 직접 부르지 않는가 — 2026-08-18 사고에서 배운 것:
#
#   1) 실행 비트 사고 방지.
#      ops/*.sh 가 git 에 100644 로 커밋돼 있어서, 자동배포의 `git reset --hard` 가
#      setup.sh 로 준 +x 를 매번 벗겼다. cron 은 스크립트를 직접 실행하므로 모든 잡이
#      exit 126 (Permission denied) 으로 즉사했다. 인덱스 모드는 100755 로 고쳤지만,
#      여기서 `bash` 로 명시 호출하면 대상 파일의 +x 여부 자체가 무관해진다.
#      crontab 도 `/bin/bash run.sh` 형태로 부르므로 이 파일의 +x 조차 필요 없다.
#
#   2) 조용한 실패 방지.
#      crontab 은 출력을 /dev/null 로 버린다(MTA 가 없어 cron 메일은 어차피 못 간다).
#      스크립트가 lib.sh 의 log() 를 부르기 전에 죽으면 일일 로그에 한 줄도 안 남는다.
#      실제로 32분간 아무도 몰랐다. 종료코드가 0 이 아니면 여기서 남긴다.

set -uo pipefail

OPS_DIR="${OPS_DIR:-$HOME/ops}"
LOG_DIR="$OPS_DIR/logs"

name="${1:-}"
if [ -z "$name" ]; then
  echo "사용법: run.sh <스크립트이름>   예) run.sh health_check" >&2
  exit 64
fi

mkdir -p "$LOG_DIR"

# lib.sh 의 log() 와 같은 형식으로 같은 파일에 쓴다. 사람이 보는 곳이 한 군데여야 한다.
# lib.sh 를 source 하지 않는 이유: 이 파일은 lib.sh 가 깨져 있어도 동작해야 한다.
note() { printf '%s [run] %s\n' "$(date '+%F %T')" "$*" >> "$LOG_DIR/$(date +%F).log"; }

# ── heartbeat (죽은 사람 스위치) ────────────────────────────
# 서버 안에서는 "cron 이 멈췄다" 를 감지할 수 없다. 감지하는 코드도 cron 이 돌려야 하니까.
# 그래서 밖에서 본다: 매 틱마다 시각을 공개 파일에 찍고,
# GitHub Actions 가 30분마다 읽어 낡았으면 실패시킨다(.github/workflows/heartbeat.yml).
#
# 대상 스크립트를 실행하기 "전에", guard() 보다 앞서 찍는다.
# 이 값의 뜻은 "자동화가 동작 중" 이 아니라 "cron 이 떴다" 이다.
# STOP 파일이나 킬스위치로 자동화를 꺼둔 동안에도 cron 자체는 살아있어야 하고,
# 그걸 껐다는 이유로 죽은 사람 스위치가 울리면 안 된다.
FEED_DIR="${FEED_DIR:-/var/www/ops-feed}"
if [ -d "$FEED_DIR" ] && [ -w "$FEED_DIR" ]; then
  # 임시 파일에 쓰고 mv — 읽는 쪽이 반쯤 쓰인 파일을 보지 않게 한다.
  if date -Iseconds > "$FEED_DIR/.heartbeat.tmp" 2>/dev/null; then
    mv -f "$FEED_DIR/.heartbeat.tmp" "$FEED_DIR/heartbeat.txt" 2>/dev/null || true
  fi
fi

target="$OPS_DIR/$name.sh"
if [ ! -f "$target" ]; then
  note "$name — 스크립트 없음 ($target)"
  exit 66
fi

bash "$target"
rc=$?

# 0 이면 조용히 끝낸다. 스크립트가 스스로 남긴 로그로 충분하다.
if [ "$rc" -ne 0 ]; then
  note "$name — 비정상 종료 (종료코드 $rc)"
fi

exit "$rc"

#!/usr/bin/env bash
#
# WOLYA ARCHIVE — PostgreSQL 일일 백업
#
# 사용법 (서버에서):
#   ~/app/scripts/pg_backup.sh
#
# cron 등록 예 (매일 04:00 KST = 19:00 UTC):
#   0 19 * * * /home/ubuntu/app/scripts/pg_backup.sh >> /home/ubuntu/backups/backup.log 2>&1
#
# 복원:
#   pg_restore --clean --if-exists -d "$DATABASE_URL" ~/backups/wolya-YYYYmmdd-HHMMSS.dump
#
# 주의: 이 백업은 같은 디스크에 저장된다. 인스턴스 자체가 죽으면 함께 사라지므로
#       Lightsail 자동 스냅샷을 반드시 함께 켜 둘 것.

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
KEEP_DAYS="${KEEP_DAYS:-7}"
ENV_FILE="${ENV_FILE:-$HOME/app/.env.local}"

if [ ! -r "$ENV_FILE" ]; then
  echo "$(date -u +%FT%TZ) ERROR: 접속 정보 파일을 읽을 수 없음: $ENV_FILE" >&2
  exit 1
fi

# DATABASE_URL 을 환경변수로 읽어들인다 (화면·로그에 출력하지 않는다)
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "$(date -u +%FT%TZ) ERROR: DATABASE_URL 이 비어 있음" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

STAMP="$(date -u +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/wolya-$STAMP.dump"

# custom 포맷 = 압축 + 선택적 복원 가능
pg_dump "$DATABASE_URL" --format=custom --file="$OUT"
chmod 600 "$OUT"

# 백업이 비었으면 실패로 간주 (조용한 실패 방지)
if [ ! -s "$OUT" ]; then
  echo "$(date -u +%FT%TZ) ERROR: 백업 파일이 비어 있음: $OUT" >&2
  exit 1
fi

# 오래된 백업 정리
find "$BACKUP_DIR" -maxdepth 1 -name 'wolya-*.dump' -mtime "+$KEEP_DAYS" -delete

echo "$(date -u +%FT%TZ) backup ok: $OUT ($(du -h "$OUT" | cut -f1)), 보관 $(find "$BACKUP_DIR" -maxdepth 1 -name 'wolya-*.dump' | wc -l)개"

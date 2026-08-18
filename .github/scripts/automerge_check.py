#!/usr/bin/env python3
"""열린 auto/ PR 이 무인 병합해도 되는지 판정한다.

에이전트가 PR 본문에 스스로 적은 AUTOMERGE-OK 를 믿지 않는다.
실제 변경 경로와 규모를 여기서 다시 검사한다 — 자기 신고와 실제가 어긋나는 것이
무인 운영에서 가장 흔한 사고다.

stdout: "<PR번호> <사유>"  — PR번호 0 이면 병합하지 않는다.
"""
import json
import sys

BLOCKED = (
    "db/migrations/",     # 스키마 정본. 무인 변경 금지
    "ops/",               # 자동화 자신. 스스로를 고치게 두지 않는다
    ".github/",           # 워크플로. 권한 상승 경로가 된다
    "AGENTS.md",          # 불변 규칙 정본
    "next.config.ts",
    "package.json",       # 의존성 추가 차단
    "package-lock.json",
)
MAX_FILES = 15


def decide(prs):
    auto = [p for p in prs if (p.get("headRefName") or "").startswith("auto/")]
    if not auto:
        return 0, "열린 auto/ PR 없음"

    pr = auto[0]
    num = pr["number"]
    body = pr.get("body") or ""
    paths = [f["path"] for f in (pr.get("files") or [])]

    if "NEEDS-REVIEW" in body:
        return 0, f"PR#{num}: 에이전트가 사람 검토를 요청했다"
    if "AUTOMERGE-OK" not in body:
        return 0, f"PR#{num}: AUTOMERGE-OK 표시가 없다"

    hits = [p for p in paths if p.startswith(BLOCKED)]
    if hits:
        return 0, f"PR#{num}: 금지 경로 포함 — {', '.join(hits[:5])}"
    if not paths:
        return 0, f"PR#{num}: 변경 파일이 하나도 없다"
    if len(paths) > MAX_FILES:
        return 0, f"PR#{num}: 변경 파일 {len(paths)}개로 상한 {MAX_FILES} 초과"

    return num, f"PR#{num}: 조건 충족 (파일 {len(paths)}개)"


if __name__ == "__main__":
    with open(sys.argv[1] if len(sys.argv) > 1 else "/tmp/prs.json") as f:
        num, reason = decide(json.load(f))
    print(f"{num} {reason}")

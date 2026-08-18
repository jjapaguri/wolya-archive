#!/usr/bin/env python3
"""커밋 하나의 CI 상태를 판정한다.

왜 따로 필요한가 — GitHub 은 기본 GITHUB_TOKEN 으로 만든 커밋에는 워크플로를 돌리지 않는다.
dev-loop 의 자동 병합 잡이 GITHUB_TOKEN 으로 squash merge 하므로, main 의 그 커밋에는
워크플로 실행 기록이 하나도 없다. 예전 로직은 그걸 "CI 없음 → 배포 안 함" 으로 처리해서
자동 개발의 결과물이 영원히 배포되지 않았다.

해결: 실행 기록이 없으면 그 커밋을 만든 PR 을 찾아 그 PR 의 head 커밋 CI 를 본다.
그 head 커밋은 병합 전에 실제로 검증된 바로 그 코드다.

stdout: success | running | failure | none | unreadable
"""
import json
import sys


def judge_runs(payload):
    runs = payload.get("workflow_runs", [])
    if not runs:
        return "none"
    if any(r.get("status") != "completed" for r in runs):
        return "running"
    return "success" if all(r.get("conclusion") == "success" for r in runs) else "failure"


def judge(direct_runs_json, pr_list_json=None, pr_head_runs_json=None):
    try:
        direct = json.loads(direct_runs_json)
    except Exception:
        return "unreadable"

    verdict = judge_runs(direct)
    if verdict != "none":
        return verdict

    # 실행 기록이 없다 → 이 커밋을 만든 PR 로 우회
    if pr_list_json is None:
        return "none"
    try:
        prs = json.loads(pr_list_json)
    except Exception:
        return "unreadable"
    merged = [p for p in prs if p.get("merged_at")]
    if not merged:
        return "none"          # PR 도 없으면 정말로 검증 안 된 커밋이다

    if pr_head_runs_json is None:
        return "none"
    try:
        head_runs = json.loads(pr_head_runs_json)
    except Exception:
        return "unreadable"
    return judge_runs(head_runs)


if __name__ == "__main__":
    args = [open(a).read() if a != "-" else sys.stdin.read() for a in sys.argv[1:]]
    while len(args) < 3:
        args.append(None)
    print(judge(*args[:3]))

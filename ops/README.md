# ops/ — 24시간 자동화

이 폴더가 자동화의 **정본**이다. 서버는 여기 있는 스크립트를 심볼릭 링크로 실행하므로
`git pull` 하면 서버 자동화도 같이 갱신된다.

## 킬스위치

`ops/automation.json` 의 `enabled` 를 `false` 로 고치고 커밋하면 **모든 자동화가 멈춘다.**
GitHub 웹에서 연필 아이콘으로 고칠 수 있으므로 폰만 있으면 된다. 반영까지 최대 15분.

즉시 멈춰야 하면 서버에서 `touch ~/ops/STOP`.

원칙 — **판단이 안 서면 멈춘다.** 플래그를 못 읽거나, 캐시가 6시간 넘게 낡았거나,
JSON이 깨졌거나, CI 상태가 불명확하면 전부 "실행하지 않음" 으로 떨어진다.

## 구성

| 파일 | 주기 | 하는 일 |
|---|---|---|
| `automation.json` | — | 킬스위치. 모든 스크립트가 매 실행 첫 단계에서 읽는다 |
| `lib.sh` | — | 공용: 킬스위치·로그·잠금·알림 |
| `health_check.sh` | 5분 | 사이트 200 + PM2 확인. 2회 연속 실패 시 PM2 재시작, 4회면 nginx reload |
| `auto_deploy.sh` | 10분 | main 새 커밋 + CI 초록불이면 배포. 배포 후 검증 실패 시 직전 커밋으로 자동 롤백 |
| `agent_runner.sh` | 20분 | 헤드리스 Claude Code. critical 발생 시 자동 진단, `~/ops/queue/*.task` 처리 |
| `daily_check.sh` | 매일 03:30 | 읽기 전용 DB 점검 10항목. 데이터 0건이면 휴면 |
| `publish.sh` | 15분 | 상태를 HTTPS 로 노출 (Cowork 이 읽어 메일 발송) |
| `setup.sh` | 1회 | 서버 설치. 멱등 |

## 설치

```bash
cd ~/app && git pull && bash ~/app/ops/setup.sh
```

마지막에 출력되는 피드 URL 을 Cowork 프로젝트 문서 `claude/자동화-운영-핸드북.md` 에 기록할 것.

## 작업 큐 — 서버에 일을 맡기는 법

`~/ops/queue/<이름>.task` 파일에 프롬프트를 적어두면 20분 내에 `agent_runner.sh` 가 실행하고
결과를 `~/ops/queue/done/<이름>.result.md` 에 남긴다.

에이전트에게는 **읽기 도구만** 준다 (`Read`/`Grep`/`git log`/`pm2 logs`/`psql`).
수정·배포·재시작은 하지 못한다. 조사와 서술까지가 이 러너의 역할이다.

## 규칙

- `daily_check.sh` 에 `UPDATE`/`INSERT` 를 넣지 말 것. 점검이 데이터를 고치면 원인과 결과를 구분할 수 없다.
- `automation.json` 을 서버 로컬에서만 고치지 말 것. 정본은 이 레포이고 서버는 읽기만 한다.
  로컬 수정은 다음 조회 때 덮어써진다. 긴급 정지는 `~/ops/STOP` 을 쓴다.
- 피드 URL 은 공개된 곳에 올리지 말 것. 토큰이 곧 접근 권한이다.

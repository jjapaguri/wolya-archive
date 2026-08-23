# 사건 기록 (부검)

운영 중 터진 것과 원인·수정·교훈. **최신이 위.** `docs/STATUS.md` 에는 사건을 적지 않는다 — 여기로.
같은 증상이 재발하면 먼저 이 파일을 검색한다.

## 2026-08-23 — 각자 초록불이던 두 PR이 main 위에서 타입으로 충돌 (main 적색 10분, 07:29~07:39 UTC)

`Product` 타입에 필수 필드를 **추가한** PR #12(코디 교차 슬라이드: `kind`·`shortMeasure`)와,
그 타입을 **만들어 내는** 코드를 추가한 커밋(A0 앱-DB 연결층의 `src/lib/product-queries.ts`
행→Product 매퍼)이 같은 시각에 각자 브랜치에서 초록불을 받고 몇 분 간격으로 main 에 들어왔다.
git 은 서로 다른 파일이라 충돌을 보고하지 않았지만, 병합 결과물은 타입체크에서 깨졌다.

```
src/lib/product-queries.ts(109,3): error TS2739: Type '{ ... }' is missing the
following properties from type 'Product': kind, shortMeasure
```

- **사이트는 멀쩡했다.** `auto_deploy` 는 CI 초록불만 배포하므로 깨진 커밋이 서버에 닿지 않았다.
  대신 **그 사이 main 에 들어온 정상 커밋들의 배포까지 같이 멈췄다** — 빨간 main 은 한 사람의
  문제가 아니라 배포 라인 전체의 정지다
- **수정**: 매퍼가 두 필드를 채우도록 (#14). 필드를 옵셔널로 낮추는 선택은 하지 않았다 —
  빠뜨리면 안 되는 정보는 타입에서 강제되는 편이 맞다
- **같은 계열이 하나 더 있었다**: PR #13(`auto/online-sourcing-29-products`)도 같은 매퍼에
  `status` 가 빠져 CI 가 깨졌다. 공유 타입을 건드리는 변경이 여러 개 열려 있을 때 반복되는 형태다
- **교훈**: **공유 타입(`src/data/products.ts` 의 `Product`)에 필수 필드를 추가하는 PR 은,
  병합 직전 main 을 브랜치에 들여와 CI 를 다시 돌린 뒤 병합한다.** PR 이 분기한 시점의
  초록불은 "지금 main 에 얹어도 초록불" 이라는 뜻이 아니다. git 이 침묵하는 건 파일이
  겹치지 않았다는 뜻일 뿐, 의미가 맞는다는 뜻이 아니다
- **미결(사람 결정)**: 브랜치 보호의 *Require branches to be up to date before merging* 을 켜면
  이 절차가 강제된다. 다만 `dev-loop` 의 자동 병합이 낡은 `auto/` PR 에서 막히게 되므로,
  켠다면 자동 병합 직전에 브랜치를 최신화하는 단계를 같이 넣어야 한다

## 2026-08-18 — 스크립트가 자기 자신을 덮어씀

`auto_deploy.sh` 가 `git reset --hard` 로 자기 파일을 바꾸면 bash 가 남은 부분을
새 파일의 엉뚱한 오프셋에서 읽는다. 재현 결과 **종료코드 0으로 조용히 중단**됐다.

- **수정**: 사본을 만들어 실행하도록 변경
- **교훈**: 자기 자신을 갱신하는 스크립트는 반드시 사본 실행. 종료코드 0을 믿지 말 것

## 2026-08-18 — cron 전면 중단 31분 (11:28~11:59), 무증상

GitHub 웹 업로드로 올린 `.sh` 가 100644 로 커밋됐고, 자동배포의 `git reset --hard` 가
`setup.sh` 로 준 실행 비트를 도로 벗겼다. cron 잡 전부 exit 126, stderr 는 `/dev/null` — 로그가 텅 빔.

- **수정**: git 인덱스 모드를 100755 로 고정 + `run.sh` 래퍼 경유 실행
- **파생**: 서버 안에서는 cron 정지를 감지할 수 없어 **죽은 사람 스위치**를 밖에 뒀다 —
  `run.sh` 가 heartbeat 를 찍고 `.github/workflows/heartbeat.yml` 이 30분마다 검사, 낡으면 GitHub 이 메일
- **교훈**: exit 126 = 실행 권한, 127 = 명령 없음. 웹 업로드 파일은 실행 비트가 없다

## 2026-08-18 — 첫 자동배포, 배포·롤백 동반 실패

`deploy_to()` 가 `npm ci --omit=dev` 를 썼는데 `typescript`·`tailwindcss`·`@tailwindcss/postcss` 가
devDependencies 다. `next build` 필수라 빌드가 죽었고, 실패한 빌드가 `.next` 를 오염시켜
같은 함수를 쓰는 롤백까지 같은 이유로 실패했다. 사이트는 안 내려갔다 —
빌드 단계에서 죽어 `pm2 restart` 까지 못 갔고 구 프로세스가 계속 응답했다.

- **수정**: `--omit=dev` 제거 + 빌드 전 `.next` 정리. 수동 복구 후 반영
- **교훈**: **`--omit=dev` 를 다시 넣지 말 것.** 이 프로젝트의 빌드 도구는 전부 devDependencies 다

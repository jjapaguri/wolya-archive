# WOLYA ARCHIVE

빈티지·아카이브 의류 셀렉트샵. https://archive-wolya.com

Next.js 16 (App Router) / React 19 / TypeScript / Tailwind CSS 4 / PostgreSQL 16
운영: AWS Lightsail (Ubuntu 24.04) + Nginx + PM2

## 개발

```bash
npm install
npm run dev                      # http://localhost:3000
npm run lint && npm run build    # 완료 기준
```

> 윈도우 PowerShell에서는 `npm` 이 `PSSecurityException` 으로 막힌다. CMD 또는 Git Bash를 쓴다.

## 문서

| 파일 | 내용 |
|---|---|
| `AGENTS.md` | 불변 규칙 · 승인 항목 · 환경 분담 (정본) |
| `docs/MAP.md` | 레포 구조 — 무엇이 어디 있는지 |
| `docs/STATUS.md` | 현재 진행 상황 · 미해결 과제 |
| `db/README.md` | DB 스키마 · 마이그레이션 절차 |
| `db/HANDOFF-앱-DB-연결.md` | 다음 작업 인수인계 |
| `.claude/agents/README.md` | 역할 에이전트 사용법 |

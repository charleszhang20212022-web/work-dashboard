# 업무 종합 대시보드 — 고도화 (Work Dashboard v2)

기존 정적 대시보드를 **풀스택 협업 플랫폼**으로 고도화한 버전입니다.
한 화면(**16:9**)에 12개의 카드를 배치하고, Google 로그인 · 관리자 권한 ·
업무 분장 · 업무용 SNS 실시간 채팅 · 포스트잇 · 일/주/월/분기/연 결산 분석 ·
일일 결산 자동 메일 발송을 제공합니다.

> 가상의 회사 **「오로라 테크놀로지」** 운영 데이터를 예시로 구성했습니다.

---

## 핵심 기능

| 분류 | 내용 |
|------|------|
| **16:9 단일화면** | 모든 기능을 한 화면에 12개 카드로 배치. 화면 크기에 맞춰 자동 스케일 |
| **Google 로그인** | Passport + Google OAuth 2.0 (필수). 미설정 시 관리자/데모 로그인으로 시연 가능 |
| **관리자 로그인 · 권한** | 관리자/팀장/팀원 3단계 권한. 관리자는 권한·부서·직책을 즉시 변경·공유 |
| **업무 분장 · 공유** | 관리자·팀장이 담당자에게 업무 지정, 담당자는 상태·진행률 직접 갱신 |
| **업무용 SNS 채팅** | Socket.io 실시간 채팅, 채널별 대화, 접속 상태(presence), 타이핑 표시 |
| **포스트잇** | 색상별 공유 메모 작성·삭제 |
| **결산 분석** | 일·주·월·분기·연 결산 차트(라인/막대/도넛) + 핵심 인사이트 |
| **자동 메일(보너스)** | node-cron 으로 매일 지정 시각에 일일 결산 리포트 자동 발송 + 즉시 발송 |

## 기술 스택

- **백엔드** : Node.js + Express, Socket.io, Passport(Google OAuth), Nodemailer, node-cron
- **데이터** : `DATABASE_URL` 있으면 PostgreSQL(JSONB), 없으면 `data/store.json` 파일 폴백
- **프런트** : Vanilla JS + 자체 제작 SVG 차트 (외부 차트 라이브러리 미사용)
- **배포** : GitHub → Railway

## 프로젝트 구조

```
work-dashboard/
├── server/
│   ├── index.js          서버 엔트리(Express+Socket.io+세션+라우트+스케줄러)
│   ├── store.js          상태 저장소 (Postgres / 파일 폴백)
│   ├── seed.js           초기 시드 데이터
│   ├── auth.js           인증(Google/관리자/데모) + 권한 미들웨어
│   ├── mailer.js         일일 결산 자동 메일
│   ├── socket.js         실시간 채팅 + 접속 상태
│   └── routes/
│       ├── auth.js       로그인/로그아웃
│       └── api.js        업무/채팅/포스트잇/결산/메일/사용자 API
├── public/
│   ├── index.html        16:9 대시보드(메인)
│   ├── login.html        로그인 페이지
│   ├── css/style.css     디자인
│   └── js/
│       ├── charts.js     SVG 차트 엔진
│       └── app.js        대시보드 로직
├── .env.example          환경 변수 예시
├── Procfile / railway.json  배포 설정
└── package.json
```

## 로컬 실행

```bash
npm install
cp .env.example .env      # 필요 값 입력(없어도 데모/시뮬레이션으로 동작)
npm start                 # http://localhost:3000
```

- 환경 변수가 하나도 없어도 **즉시 실행**됩니다 (파일 저장 + 데모 로그인 + 메일 시뮬레이션).
- 기본 관리자 계정: `admin / admin1234`

## Railway 배포 (요약)

1. GitHub 에 푸시 → Railway 에서 **New Project → Deploy from GitHub repo** 선택
2. (선택) **+ New → Database → PostgreSQL** 추가 시 `DATABASE_URL` 자동 주입
3. **Variables** 에 `BASE_URL`(배포 도메인), `SESSION_SECRET`, `ADMIN_*`,
   `GOOGLE_CLIENT_ID/SECRET`, (보너스) `GMAIL_USER/GMAIL_APP_PASSWORD` 입력
4. Google Cloud Console 의 OAuth 콜백에 `<BASE_URL>/auth/google/callback` 등록
5. 배포 완료 후 도메인 접속 → 헬스체크 `/healthz`

자세한 단계는 저장소의 배포 가이드를 참고하세요.

## 제작 정보

- 제작: 펑린항 (202404229)
- 도구: Claude Code 활용
- 최초: 2026-05-19 · 고도화: 2026-05-22

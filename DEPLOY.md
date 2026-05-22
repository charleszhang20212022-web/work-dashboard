# Railway 배포 가이드

GitHub 푸시는 완료되었습니다. 이제 Railway 에 배포하고 환경 변수를 설정합니다.
(앱은 환경 변수가 없어도 즉시 실행됩니다 — 데모/관리자 로그인, 메일 시뮬레이션.
Google 로그인과 실제 메일 발송은 아래 설정을 마쳐야 활성화됩니다.)

---

## 1단계 · Railway 프로젝트 생성

1. https://railway.app 접속 → GitHub 로 로그인
2. **New Project → Deploy from GitHub repo** 선택
3. `charleszhang20212022-web/work-dashboard` 저장소 선택
4. Railway 가 자동으로 빌드(`npm install`) 후 `node server/index.js` 로 실행합니다.

## 2단계 · 공개 도메인 생성

1. 서비스 → **Settings → Networking → Generate Domain**
2. 생성된 주소(예: `https://work-dashboard-production.up.railway.app`)를 복사
   → 이 주소가 **제출용 URL** 이며, 아래 `BASE_URL` 에도 사용합니다.

## 3단계 · (선택) PostgreSQL 추가

데이터를 재배포 후에도 유지하려면:

1. 프로젝트에서 **+ New → Database → Add PostgreSQL**
2. `DATABASE_URL` 이 자동으로 주입됩니다. (없으면 파일 저장으로 동작)

## 4단계 · 환경 변수(Variables) 설정

서비스 → **Variables** 탭에서 추가:

| 키 | 값(예시) | 설명 |
|----|----------|------|
| `BASE_URL` | `https://<생성된 도메인>` | Google 콜백 계산에 필수 |
| `SESSION_SECRET` | 임의의 긴 문자열 | 세션 암호화 |
| `ADMIN_USERNAME` | `admin` | 관리자 아이디 |
| `ADMIN_PASSWORD` | 원하는 비밀번호 | 관리자 비밀번호 |
| `GOOGLE_CLIENT_ID` | (5단계에서 발급) | Google 로그인 |
| `GOOGLE_CLIENT_SECRET` | (5단계에서 발급) | Google 로그인 |
| `GMAIL_USER` | 본인 Gmail 주소 | (보너스) 메일 발송 |
| `GMAIL_APP_PASSWORD` | Gmail 앱 비밀번호 | (보너스) 메일 발송 |

저장하면 자동으로 재배포됩니다.

## 5단계 · Google 로그인(OAuth) 설정 — 필수 기능

1. https://console.cloud.google.com → 프로젝트 생성
2. **APIs & Services → OAuth consent screen** → External → 앱 이름/이메일 입력 후 저장
   (테스트 사용자에 본인 Gmail 추가)
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - 유형: **Web application**
   - **Authorized redirect URIs** 에 추가:
     `https://<생성된 도메인>/auth/google/callback`
4. 발급된 **Client ID / Client Secret** 을 4단계의 `GOOGLE_CLIENT_ID/SECRET` 에 입력
5. 재배포 후 로그인 화면에서 **Google 계정으로 로그인** 동작 확인

## 6단계 · 일일 결산 자동 메일(보너스) 설정

1. Gmail → 계정 → **2단계 인증** 활성화
2. **앱 비밀번호** 생성(16자리) → `GMAIL_APP_PASSWORD` 에 입력
3. `GMAIL_USER` 에 본인 Gmail 입력
4. 대시보드 → **자동 메일** 카드 → 발송 시각/수신자 설정 → **지금 발송** 으로 테스트
   (자격 증명이 없으면 "시뮬레이션"으로 표시되며 앱은 정상 동작)

---

## 배포 후 점검

- `https://<도메인>/healthz` → `{"ok":true,...}` 응답 확인
- 로그인(데모/관리자/Google) → 12개 카드 표시
- 채팅 메시지 전송(실시간), 포스트잇 추가, 업무 분장, 결산 차트, 메일 발송 확인
- 마지막으로 **제출 파일(`대시보드 고도화_펑린항.txt`)** 의 URL 칸에 도메인 붙여넣기

# Flon: service-frontend

프리랜서 특화 AI 자산관리 플랫폼 **flon**의 프론트엔드 레포지토리
불규칙한 수입을 가진 프리랜서를 위해 통합 자산 조회, 가상 월급 자동 분배, AI 금융 챗봇, 증권 거래 등 서비스 전 화면을 담당하며 동시에 3개의 백엔드(service-backend / transaction-server / mydata-server)에 대한 **BFF(Backend for Frontend)** 역할을 수행

> 랜딩 페이지 문구 (`src/app/page.tsx`): _"프리랜서를 위한 AI 자산관리 플랫폼"_

---

## 1. 기술 스택

`package.json` 기준입니다.

| 구분 | 기술 | 버전 |
| --- | --- | --- |
| Framework | Next.js (App Router) | 16.2.6 |
| Language | TypeScript | ^5 |
| UI Library | React / React DOM | 19.2.4 |
| Styling | Tailwind CSS (+ `@tailwindcss/postcss`) | ^4 |
| Headless UI | Radix UI (`react-dialog`, `react-separator`, `react-slot`, `react-tooltip`) | ^1.x |
| 유틸리티 | `class-variance-authority`, `clsx`, `tailwind-merge` | - |
| 아이콘 | `lucide-react` | ^1.16.0 |
| 차트 | `lightweight-charts` (주식 차트) | ^5.2.0 |
| Lint | ESLint (`eslint-config-next`) | ^9 |

`next.config.ts`에서 `output: "standalone"`으로 빌드되며, Docker 이미지는 Node 22 Alpine 기반입니다 (`Dockerfile`).

---

## 2. 폴더 구조

```
service-frontend/
├── docs/                         # 아키텍처 / API / DB / 컨벤션 문서
├── public/
│   └── banks/                    # 은행/증권사 로고 에셋
├── src/
│   ├── api/                      # 백엔드 API 호출 함수 모음
│   │   ├── auth.ts
│   │   ├── bank.ts
│   │   ├── mydata.ts
│   │   ├── stock.ts
│   │   ├── user.ts
│   │   └── virtualSalary.ts
│   ├── app/
│   │   ├── (auth)/                # 로그인 / 회원가입 / PIN 인증
│   │   │   ├── login/
│   │   │   ├── pin-verify/
│   │   │   └── signup/
│   │   │       ├── complete/
│   │   │       ├── onboarding/    # 마이데이터 연동 온보딩 단계별 컴포넌트
│   │   │       ├── phone/
│   │   │       ├── pin/
│   │   │       └── verify/
│   │   ├── (main)/                 # 로그인 이후 서비스 화면
│   │   │   ├── assets/             # 통합 자산 조회
│   │   │   ├── chat/               # AI 금융 챗봇
│   │   │   ├── contracts/          # 계약 관리
│   │   │   ├── home/                # 홈 대시보드
│   │   │   ├── mypage/              # 마이페이지 (계좌/알림/PIN/가상월급/탈퇴)
│   │   │   └── stocks/              # 증권 주문
│   │   ├── admin/                  # 관리자 콘솔 (로그인 / 대시보드)
│   │   └── layout.tsx / page.tsx   # 루트 레이아웃 / 랜딩 페이지
│   ├── components/
│   │   ├── admin/                  # 관리자 대시보드 위젯
│   │   ├── home/                   # 홈 화면 위젯 (가상월급 카드, 수입 캘린더 등)
│   │   ├── main/                   # 자산/이체/챗봇/마이페이지 화면 컴포넌트
│   │   ├── stock/                  # 주식 차트 컴포넌트
│   │   └── ui/                     # Radix 기반 공통 UI 컴포넌트
│   ├── hooks/
│   ├── lib/                        # cn() 등 공통 유틸
│   ├── store/                      # sessionStorage 기반 클라이언트 상태
│   ├── types/
│   └── utils/                      # API 클라이언트, 토큰 관리
├── Dockerfile
├── next.config.ts
└── package.json
```

---

## 3. 아키텍처 — BFF 라우팅

이 레포지토리는 프론트엔드 화면뿐 아니라 **Next.js rewrites 기반 BFF**로 동작함.
브라우저는 항상 프론트엔드 서버(`/api`, `/mydata`, `/baas`)로만 요청하고 서버 사이드에서 각 백엔드로 프록시됨. (`next.config.ts`).

| 프론트 경로 | 목적지 (env override) | 대상 서버 |
| --- | --- | --- |
| `/api/:path*` | `BACKEND_URL` (default `http://service-backend:8080`) | service-backend |
| `/mydata/:path*` | `MYDATA_URL` (default `http://mydata-server:8084`) | mydata-server |
| `/baas/:path*` | `TRANSACTION_URL` (default `http://transaction-server:8083`) | transaction-server |

API 호출은 3개의 클라이언트 유틸로 분리되어 있음. (`src/utils/`).

| 클라이언트 | 경로 prefix | 인증 헤더 | 비고 |
| --- | --- | --- | --- |
| `apiClient.ts` → `apiRequest` | `/api/v1` | `Authorization: Bearer {accessToken}` | 일반 사용자용, 401 시 자동 토큰 재발급 |
| `apiClient.ts` → `adminApiRequest` | `/api/v1` | `Authorization: Bearer {adminAccessToken}` | 관리자 전용, 별도 토큰 저장소 사용 |
| `baasClient.ts` → `baasRequest` | `/baas/v1` | `Authorization` + `X-Firebase-Uid` | 이체/거래 등 transaction-server 직접 연동 |
| `mydataClient.ts` → `mydataRequest` | `/mydata/v1` | `Authorization` + `X-Firebase-Uid` | 마이데이터 연동/자산 집계 조회 |

**인증 토큰 처리**

- 토큰/사용자 정보는 `sessionStorage`에 저장. (`src/utils/token.ts`) — 일반 사용자용 키(`accessToken`, `refreshToken`, `userId`, `firebaseUid` 등)와 관리자용 키(`adminAccessToken` 등)가 분리되어 있음.
- API 요청이 `401`을 받으면 `tryRefreshToken()`이 `POST /api/v1/auth/reissue`로 accessToken을 재발급받아 요청1회 재시도. (`src/utils/tokenRefresh.ts`).
- 재발급도 실패하면 `session-expired` 커스텀 이벤트를 발생시키고 전역에 마운트된 `SessionExpiredModal`이 이를 감지해 로그인 페이지로 리다이렉트함.

---

## 4. 라우트 / 화면 구성

기준: `src/app`

### (auth) — 인증

| 라우트 | 설명 |
| --- | --- |
| `/login` | 로그인 |
| `/signup` | 회원가입 (기본 정보) |
| `/signup/phone` | 휴대폰 본인인증 |
| `/signup/verify` | 인증번호 검증 |
| `/signup/pin` | PIN 등록 |
| `/signup/onboarding` | 마이데이터 연동 온보딩 (Intro → Select → Connected → Loading → Account 단계별 컴포넌트) |
| `/signup/complete` | 가입 완료 |
| `/pin-verify` | PIN 검증 |

### (main) — 서비스 화면

| 라우트 | 설명 |
| --- | --- |
| `/home` | 홈 대시보드 (가상월급 현황, 수입 캘린더, 계약 목록) |
| `/assets` | 통합 자산 조회 (은행/증권 계좌) |
| `/contracts`, `/contracts/[contractId]` | 계약 목록 / 상세 |
| `/stocks`, `/stocks/order` | 증권 홈, 주문 화면 |
| `/chat` | AI 금융 챗봇 |
| `/mypage` | 마이페이지 |
| `/mypage/accounts` | 계좌 관리(역할 설정) |
| `/mypage/virtual-salary` | 가상 월급 설정 |
| `/mypage/pin` | PIN 변경 |
| `/mypage/notice` | 알림 |
| `/mypage/withdraw` | 회원 탈퇴 |

### admin — 관리자 콘솔

| 라우트 | 설명 |
| --- | --- |
| `/admin/login` | 관리자 로그인 (로그인 응답의 `role === 'ADMIN'` 검증) |
| `/admin/signup` | 관리자 계정 생성 |
| `/admin` | 대시보드 / 사용자 관리 / 로그(로그인·AI·API·오류) / 설정 |

---

## 5. 주요 기능 (코드 기준)

- **회원가입 / 본인인증 / PIN 인증**: 휴대폰 인증 → PIN 등록 → 마이데이터 온보딩까지 이어지는 다단계 가입 플로우.
  - 입력값은 `signupStore`(`sessionStorage`)에 단계별로 누적 저장됨(`src/store/signupStore.ts`).
- **통합 자산 조회 (`AssetsView`)**: 마이데이터 연동을 통해 은행 계좌 잔액/거래내역과 증권 계좌 예수금/보유종목을 통합 조회하고 계좌별 역할(`DEPOSIT`/`SALARY`/`EMERGENCY`/`STOCK`)을 지정.
- **계좌 이체 (`TransferView`)**: PIN 인증 후 service-backend `/transfers` API로 이체를 요청 및 승인.
- **가상 월급 자동 분배**: `/mypage/virtual-salary`에서 목표 월급, 월급일, 비상금/투자 이체 금액과 `priorityOrder`(우선순위)를 설정함.
  - `VirtualSalarySettingView`는 드래그 앤 드롭으로 `SALARY`/`EMERGENCY`/`INVESTMENT` 우선순위를 재정렬.
- **홈 대시보드 (`VirtualSalaryCard`, `IncomeCalendar`)**: 가상월급 잔액/사용률/D-DAY와 계약별 예정 수입 캘린더를 표시.
  - 서버가 UTC 기준으로 계산하는 D-DAY를 KST(UTC+9) 기준으로 보정하는 로직을 포함.
- **계약 관리**: 프리랜서 계약(거래처, 계약금, 세율, 예상 입금일)을 등록 및 조회함(`ContractRegisterView`, `ContractListView`, `ContractDetailView`).
- **증권 거래**: 종목 검색, `lightweight-charts` 기반 시세 차트(`StockChart`), 지정가/시장가 주문, 관심종목 등록/삭제를 지원(`src/api/stock.ts`).
- **AI 금융 챗봇 (`ChatBotView`)**: `/ai/chat/run` 호출로 AI와 대화하며 주식 주문·계좌 이체 등 금융 액션 실행 전 `requirePin` 플래그를 받으면 PIN 키패드(`PinKeypad`)를 노출하고 `isPin: true`로 PIN을 재전송.
- **알림 (`NotificationPanel`)**: 입금/미매칭/AI 브리핑 등 알림 목록 조회 및 읽음 처리.
- **관리자 콘솔**: 사용자 목록/상세/상태 변경, 로그인 로그, AI 사용 로그, API 호출 로그, 오류 로그, 잠금 사용자 조회 등 (`src/components/admin/*`).

---

이 레포지토리는 `service-backend`, `service-ai-server`, `bank-server`, `stock-server`, `transaction-server`, `mydata-server`와 함께 멀티 레포로 구성된 flon 프로젝트의 프론트엔드입니다.

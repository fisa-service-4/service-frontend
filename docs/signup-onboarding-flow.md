# 회원가입 & 마이데이터 온보딩 플로우

> 프론트엔드 페이지별 API 호출, 내부 처리, 데이터 저장 흐름 상세 문서

---

## 전체 흐름 요약

```
[1] 기본정보 입력 (signup/page.tsx)
      ↓ sessionStorage 저장
[2] 본인인증 요청 (signup/phone/page.tsx)
      ↓ POST /auth/phone/send → 통신사 본인확인
[3] OTP 인증 + 회원가입 (signup/verify/page.tsx)
      ↓ POST /auth/phone/verify → POST /auth/signup
      ↓ /login?redirect=/signup/onboarding 으로 이동
[4] 로그인 + 상태 체크 (login/page.tsx)
      ↓ POST /auth/login → 토큰 발급
      ↓ GET /mydata/connections → GET /accounts 순서로 상태 확인
      ↓ 미완료 단계로 리다이렉트
[5] 마이데이터 연동 (signup/onboarding/page.tsx — select/loading 단계)
      ↓ POST /mydata/connect → GET /mydata/connections
      ↓ bankAccounts / stockAccounts 컴포넌트 state에 보관
[6] 계좌 역할 설정 (signup/onboarding/page.tsx — deposit/salary/emergency/stock 단계)
      ↓ PATCH /accounts/{accountId}/role × 4
[7] PIN 설정 (signup/pin/page.tsx)
      ↓ POST /auth/pin → POST /auth/signup/complete
[8] 완료 (signup/complete/page.tsx)
      ↓ /home
```

---

## 단계별 상세 플로우

---

### 1단계 — 기본정보 입력 (`signup/page.tsx`)

**API 호출 없음**

**사용자 입력값**

| 필드 | 설명 |
|------|------|
| email | 이메일 (아이디) |
| password | 영문+숫자+특수문자 8자 이상 |
| jobType | DEVELOPER / DESIGNER / MARKETER 등 |
| freelancerYn | jobType에 따라 자동 결정 |
| termsConsentYn | 서비스 이용 동의 (true 필수) |

**데이터 저장**

- `sessionStorage['signupFormData']`에 부분 저장 (`signupStore.save()`)
- 저장 키: `email`, `password`, `jobType`, `freelancerYn`, `termsConsentYn`

**다음 단계** → `/signup/phone`

---

### 2단계 — 본인인증 요청 (`signup/phone/page.tsx`)

#### API: `POST /api/v1/auth/phone/send`

```
Frontend → service-backend → (통신사 본인확인 API)
```

**Request Body**

```json
{
  "name": "홍길동",
  "residentNumber": "9001011",
  "telecom": "KT",
  "phoneNumber": "01012345678"
}
```

**service-backend 내부 처리**
1. 입력된 주민번호 앞 7자리 + 통신사 + 전화번호로 통신사 본인확인 API 호출
2. 일치 확인 후 Redis에 6자리 인증번호 저장 (TTL 180초)
3. SMS 발송

**Response**

```json
{ "success": true, "data": { "expiredIn": 180 } }
```

**에러 케이스**

| 코드 | 상황 |
|------|------|
| AUTH_002 | 이미 가입된 전화번호 |
| AUTH_011 | 본인 확인 실패 (이름/주민번호 불일치) |

**데이터 저장**

- `signupStore.save({ userName, phoneNumber, residentNumber, telecom })`
- `sessionStorage['signupFormData']`에 누적 저장

**다음 단계** → `/signup/verify`

---

### 3단계 — OTP 인증 + 회원가입 (`signup/verify/page.tsx`)

#### API 1: `POST /api/v1/auth/phone/verify`

```
Frontend → service-backend → Redis 인증번호 검증
```

**Request Body**

```json
{
  "phoneNumber": "01012345678",
  "verificationCode": "123456"
}
```

**service-backend 내부 처리**
1. Redis에서 해당 전화번호의 인증번호 조회
2. 일치 여부 확인 (만료 시 AUTH_007, 불일치 시 AUTH_006)
3. 인증 성공 시 Redis 인증번호 삭제

---

#### API 2: `POST /api/v1/auth/signup`

```
Frontend → service-backend → DB (users 테이블 INSERT)
```

**Request Body** (`sessionStorage`에서 조합)

```json
{
  "email": "user@test.com",
  "password": "Password123!",
  "userName": "홍길동",
  "phoneNumber": "01012345678",
  "jobType": "DEVELOPER",
  "freelancerYn": true,
  "termsConsentYn": true
}
```

**service-backend 내부 처리**
1. 이메일 중복 확인 (AUTH_001)
2. 비밀번호 bcrypt 해싱
3. `users` 테이블에 INSERT (status: INACTIVE — PIN 미설정)
4. `userId` 반환

**Response**

```json
{
  "success": true,
  "data": { "userId": 1, "email": "user@test.com", "name": "홍길동" }
}
```

> ⚠️ 이 시점에서 사용자는 DB에 생성되었지만 **토큰 미발급** 상태.  
> 로그인 전이므로 Bearer Token 없음.

**다음 단계** → `/login?redirect=/signup/onboarding`

---

### 4단계 — 로그인 + 상태 체크 (`login/page.tsx`)

#### API 1: `POST /api/v1/auth/login`

```
Frontend → service-backend → DB 검증 → JWT 발급
```

**Request Body**

```json
{ "email": "user@test.com", "password": "Password123!" }
```

**service-backend 내부 처리**
1. 이메일로 사용자 조회
2. bcrypt로 비밀번호 검증 (AUTH_003)
3. accessToken(15분) + refreshToken(7일) JWT 발급
4. Firebase UID 반환 (mydata-server 연동용)

**Response**

```json
{
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "user": { "userId": 1, "name": "홍길동", "email": "..." },
    "firebaseUid": "firebase-uid-string",
    "role": "USER"
  }
}
```

**토큰 저장** (`tokenUtils` → `sessionStorage`)

| 키 | 값 |
|----|-----|
| `accessToken` | JWT accessToken |
| `refreshToken` | JWT refreshToken |
| `userId` | 사용자 ID |
| `userEmail` | 이메일 |
| `userName` | 이름 |
| `firebaseUid` | Firebase UID |

---

#### 상태 체크 로직 (로그인 성공 후, `redirectTo === '/home'`일 때만 실행)

##### API 2: `GET /api/v1/mydata/connections`

```
Frontend → service-backend → mydata-server(GET /mydata/v1/connections)
```

**service-backend 내부 처리**
1. `Authorization` 헤더에서 userId 추출
2. `X-Firebase-Uid` 헤더에 firebaseUid 첨부하여 mydata-server 호출
3. mydata-server가 bank-server / stock-server에서 연동 계좌 목록 조회하여 반환

**판단 로직**

```
bankAccounts.length === 0
  → 마이데이터 미연동
  → router.push('/signup/onboarding')  ← intro 단계부터
```

##### API 3: `GET /api/v1/accounts`

```
Frontend → service-backend → DB (accounts 테이블 조회)
```

**판단 로직**

```
accounts 중 DEPOSIT 역할 없음 → /signup/onboarding?step=deposit
accounts 중 SALARY 역할 없음  → /signup/onboarding?step=salary
accounts 중 EMERGENCY 역할 없음 → /signup/onboarding?step=emergency
모두 있음                      → /home
```

> 상태 체크 API 실패 시 → 안전하게 `/home`으로 이동 (try-catch)

---

### 5단계 — 마이데이터 연동 (`signup/onboarding/page.tsx`)

온보딩 페이지는 내부 `step` state로 8단계를 관리합니다.  
`?step=` URL 파라미터가 있으면 해당 단계로 바로 진입합니다.

#### intro 단계

UI만 표시. API 호출 없음.

---

#### select 단계 → API: `POST /api/v1/mydata/connect`

```
Frontend → service-backend → mydata-server(POST /mydata/v1/connect)
         → mydata-server → bank-server (계좌 동기화)
         → mydata-server → stock-server (계좌 동기화)
```

**service-backend 내부 처리**
1. Firebase UID로 mydata-server에 전체 기관 연동 요청
2. mydata-server가 bank-server / stock-server에서 사용자 계좌 정보 가져와 DB에 저장
3. 이미 연동된 경우 `MYDATA_001` 에러 → 프론트에서 무시하고 loading 단계로 진행

---

#### loading 단계 → API: `GET /api/v1/mydata/connections`

```
Frontend → service-backend → mydata-server(GET /mydata/v1/connections)
```

**Response**

```json
{
  "data": {
    "bankAccounts": [
      {
        "accountId": 1001,
        "accountNumber": "110-123-456789",
        "accountName": "내 급여통장",
        "bankCode": "088",
        "balance": 3500000
      }
    ],
    "stockAccounts": [
      {
        "accountId": 2001,
        "accountNumber": "300-123-456789",
        "accountName": "내 주식 계좌",
        "bankCode": "039"
      }
    ]
  }
}
```

**데이터 저장**

- `setBankAccounts(connections.bankAccounts)` — 컴포넌트 state
- `setStockAccounts(connections.stockAccounts)` — 컴포넌트 state
- **이 시점에서 `accountId`가 프론트엔드에 처음 로드됨**

> `accountId`는 이후 계좌 역할 설정 API에서 경로 파라미터로 사용됨

---

#### connected 단계

`bankAccounts` / `stockAccounts` 요약 표시. API 호출 없음.

---

### 6단계 — 계좌 역할 설정 (`signup/onboarding/page.tsx`)

4개 단계(deposit → salary → emergency → stock)가 순서대로 진행됩니다.  
각 단계마다 사용자가 Accordion에서 계좌를 선택 후 저장합니다.

#### API: `PATCH /api/v1/accounts/{accountId}/role`

```
Frontend → service-backend → DB (accounts 테이블 UPDATE)
```

**accountId 흐름**

```
loading 단계에서 GET /mydata/connections 응답
  → bankAccounts[i].accountId  (deposit/salary/emergency용)
  → stockAccounts[i].accountId (stock용)
  → 사용자가 Accordion에서 선택
  → onSelect(account.accountId) → state(depositId / salaryId / emergencyId / stockId)
  → PATCH /accounts/{선택된 accountId}/role 호출
```

**Request Body (예: deposit 단계)**

```json
{ "accountRole": "DEPOSIT" }
```

**service-backend 내부 처리**
1. `accountId`로 accounts 테이블 조회
2. 소유자 확인 (ACCOUNT_002)
3. `account_role` 컬럼 UPDATE

**Response**

```json
{
  "data": {
    "accountId": 1001,
    "accountRole": "DEPOSIT",
    "updatedAt": "2026-06-14T10:00:00"
  }
}
```

**역할 설정 순서 및 다음 단계**

| 단계 | accountRole | 계좌 풀 | 다음 단계 |
|------|-------------|---------|-----------|
| deposit | DEPOSIT | bankAccounts | salary |
| salary | SALARY | bankAccounts | emergency |
| emergency | EMERGENCY | bankAccounts | stock |
| stock | STOCK | stockAccounts | `/signup/pin` (건너뛰기 가능) |

> **중복 선택 방지**: 이미 다른 역할로 설정된 `accountId`는 disabled 처리됨  
> (`alreadySelectedIds` Map으로 관리)

---

### 7단계 — PIN 설정 (`signup/pin/page.tsx`)

#### API 1: `POST /api/v1/auth/pin`

```
Frontend → service-backend → DB (user_pins 테이블 INSERT)
```

**Request Body**

```json
{ "pin": "123456", "pinConfirm": "123456" }
```

**service-backend 내부 처리**
1. pin === pinConfirm 일치 확인 (AUTH_008)
2. 연속 숫자(123456) / 반복 숫자(111111) 패턴 검증 (AUTH_010)
3. PIN bcrypt 해싱 후 저장

---

#### API 2: `POST /api/v1/auth/signup/complete`

```
Frontend → service-backend → DB (users 테이블 UPDATE)
```

**service-backend 내부 처리**
1. 사용자 status: `INACTIVE` → `ACTIVE`로 변경
2. 신규 accessToken + refreshToken 발급 (완전한 계정으로 갱신)

**데이터 정리**

- `signupStore.clear()` — `sessionStorage['signupFormData']` 삭제

**다음 단계** → `/signup/complete`

---

### 8단계 — 완료 (`signup/complete/page.tsx`)

API 호출 없음.

"모든 설정이 완료되었어요" 화면 표시 후 **[시작하기]** 버튼 → `/home`

---

## 재진입 시나리오 (로그인 후 상태 기반 리다이렉트)

이미 가입한 사용자가 설정을 완료하지 않고 이탈한 경우, 로그인 시 자동으로 누락 단계로 안내합니다.

```
로그인 성공
  │
  ├─ GET /mydata/connections → bankAccounts.length === 0
  │     └─ → /signup/onboarding           (intro 단계부터)
  │
  └─ bankAccounts 존재
        │
        └─ GET /accounts → accountRole 체크
              ├─ DEPOSIT 없음  → /signup/onboarding?step=deposit
              ├─ SALARY 없음   → /signup/onboarding?step=salary
              ├─ EMERGENCY 없음 → /signup/onboarding?step=emergency
              └─ 모두 있음     → /home
```

`?step=` 파라미터로 진입 시 onboarding 페이지는 `GET /mydata/connections`를 먼저 호출하여 `bankAccounts`를 로드한 뒤 해당 단계로 바로 이동합니다.

---

## 데이터 저장 위치 요약

| 데이터 | 저장 위치 | 저장 시점 | 삭제 시점 |
|--------|----------|-----------|-----------|
| email, password, jobType 등 | `sessionStorage['signupFormData']` | signup/page.tsx | PIN 설정 완료 후 |
| userName, phoneNumber, residentNumber, telecom | `sessionStorage['signupFormData']` | signup/phone/page.tsx | PIN 설정 완료 후 |
| accessToken | `sessionStorage['accessToken']` | 로그인 성공 | 로그아웃 |
| refreshToken | `sessionStorage['refreshToken']` | 로그인 성공 | 로그아웃 |
| userId | `sessionStorage['userId']` | 로그인 성공 | 로그아웃 |
| firebaseUid | `sessionStorage['firebaseUid']` | 로그인 성공 | 로그아웃 |
| bankAccounts, stockAccounts | 컴포넌트 state | GET /mydata/connections 응답 | 페이지 언마운트 |
| accountId (역할 설정용) | 컴포넌트 state (depositId 등) | 사용자 선택 | 페이지 언마운트 |

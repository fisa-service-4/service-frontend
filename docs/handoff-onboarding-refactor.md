# 인수인계: 온보딩 Flow / UI 개선

> 브랜치: `refactor/#143-onboarding-flow`
> 작업 기간: 2026-06-14
> 작업자: hyun7931

---

## 1. 작업 배경

기존 회원가입 플로우의 문제점:
- 루트 `/` 가 즉시 `/login`으로 redirect → 랜딩 페이지 없음
- 로그인/회원가입 페이지 UI가 홈·증권 화면 디자인과 불일치
- 입력 스타일 불통일 (`bg-gray-100` / `border` 혼용)
- 진행 상태 표시 없음 (progress bar 전무)
- 온보딩이 단순 드롭다운 1개로 구성 → 실제 연동 흐름 없음
- `USE_MOCK = true` 상태로 API 미연동
- 계좌 선택 UX가 `<select>` 드롭다운 → 카드 리스트로 개선 필요
- `setAccountRole` 저장이 마지막에 일괄 처리 → 각 단계마다 즉시 저장으로 변경

---

## 2. 변경된 파일 목록

### 신규 생성

| 파일 | 설명 |
|------|------|
| `src/app/(auth)/signup/onboarding/_components/bankUtils.ts` | bankCode → 로고/이름 매핑, 은행 코드 Set |
| `src/app/(auth)/signup/onboarding/_components/IntroStep.tsx` | 마이데이터 소개 화면 |
| `src/app/(auth)/signup/onboarding/_components/SelectStep.tsx` | 기관 선택 화면 (마스터 체크박스) |
| `src/app/(auth)/signup/onboarding/_components/LoadingStep.tsx` | 계좌 연동 중 스피너 화면 |
| `src/app/(auth)/signup/onboarding/_components/ConnectedStep.tsx` | 연동 완료 기관 목록 화면 |
| `src/app/(auth)/signup/onboarding/_components/AccountStep.tsx` | 계좌 선택 공용 카드 UI 컴포넌트 |

### 수정

| 파일 | 변경 내용 |
|------|----------|
| `src/app/page.tsx` | `redirect('/login')` → 랜딩 페이지 (로고 + 회원가입/로그인 버튼) |
| `src/app/(auth)/login/page.tsx` | FISA 로고 헤더, 에러 박스 스타일, 회원가입 링크 개선 |
| `src/app/(auth)/signup/page.tsx` | 3단계 progress bar, 체크박스 동의, 입력 스타일 통일 |
| `src/app/(auth)/signup/phone/page.tsx` | progress bar (2/3), 통신사 토글 버튼, 입력 스타일 통일 |
| `src/app/(auth)/signup/verify/page.tsx` | progress bar (3/3), 6자리 도트 UI, 입력 완료 시 자동 진행 |
| `src/app/(auth)/signup/onboarding/page.tsx` | 전면 재설계 (아래 별도 설명) |
| `src/app/(auth)/signup/complete/page.tsx` | 완료 화면 UI 개선 (다크 배경 + 아이콘) |

---

## 3. 온보딩 플로우 상세

### Step 구조

```
intro → select → loading → connected → deposit → salary → emergency → stock → /signup/pin
```

### 각 단계 설명

| Step | 컴포넌트 | 설명 | API |
|------|----------|------|-----|
| `intro` | `IntroStep` | 마이데이터 소개 (기능 카드 3개) | 없음 |
| `select` | `SelectStep` | 기관 체크박스 (UI 전용) | 없음 |
| `loading` | `LoadingStep` | 스피너 + 계좌 로딩 | `GET /api/v1/accounts` |
| `connected` | `ConnectedStep` | 연동된 기관 목록 표시 | 없음 |
| `deposit` | `AccountStep` | 입금 계좌 선택 | `PATCH /api/v1/accounts/{id}/role` (`DEPOSIT`) |
| `salary` | `AccountStep` | 월급 계좌 선택 | `PATCH /api/v1/accounts/{id}/role` (`SALARY`) |
| `emergency` | `AccountStep` | 비상금 계좌 선택 | `PATCH /api/v1/accounts/{id}/role` (`EMERGENCY`) |
| `stock` | `AccountStep` | 투자 계좌 선택 (건너뛰기 가능) | `PATCH /api/v1/accounts/{id}/role` (`STOCK`) |

### API 선택 이유

`loading` 단계에서 `GET /mydata/v1/connections` 대신 `GET /api/v1/accounts`를 사용:

```
GET /api/v1/accounts
  └→ AccountService.getMyAccounts()
      └→ BankServerClient.getConnections(firebaseUid)
          └→ GET /mydata/v1/connections   ← 실제 데이터 소스
              └→ syncLinkedAccounts()    ← 운영 DB INSERT
              └→ account_mapping 조회    ← 역할 조합 후 응답
```

백엔드가 BFF 역할을 하기 때문에 프론트에서 mydata-server를 직접 호출하지 않음.

### 은행/증권 계좌 구분

`GET /api/v1/accounts`는 flat `BankAccount[]`를 반환하므로 `bankCode`로 분류:

```typescript
// bankUtils.ts
export const BANK_CODES = new Set(Object.keys(BANK_LOGO));
// BANK_CODES에 있으면 → 은행 계좌 (deposit/salary/emergency 단계)
// 없으면 → 증권 계좌 (stock 단계)
```

현재 은행 코드: `003(IBK), 004(KB), 011(NH), 020(우리), 023(SC), 081(하나), 088(신한), 090(카카오), 092(토스)`

### 이미 선택된 계좌 비활성화 (disabled badge)

```typescript
// 이전 단계에서 선택한 계좌는 다음 단계에서 disabled + 역할 배지 표시
function getAlreadySelectedIds(currentStep: Step): Map<number, string> {
  const map = new Map<number, string>();
  if (currentStep !== 'deposit'   && depositId)   map.set(Number(depositId), '입금 계좌');
  if (currentStep !== 'salary'    && salaryId)     map.set(Number(salaryId), '월급 계좌');
  if (currentStep !== 'emergency' && emergencyId)  map.set(Number(emergencyId), '비상금 계좌');
  ...
  return map;
}
```

---

## 4. 미완료 / 추후 고려 사항

### `POST /mydata/v1/connect` 미호출

`select` 단계에서 기관 체크박스를 선택하지만 실제로 `connectMyData(provider)`를 호출하지 않음.
현재는 `GET /api/v1/accounts` 호출 시 백엔드가 알아서 mydata-server와 동기화함.

**추후 확인 필요:**
- 신규 가입 직후 첫 연동 시 명시적 `POST /mydata/v1/connect` 호출이 필요한지 백엔드팀과 협의
- 필요하다면 `select → loading` 전환 시점에 추가

### `select` 단계 체크박스 동작

현재 "모든 기관" 마스터 체크박스를 켜면 하위 기관 체크박스가 동기화되지만,
실제 선택값이 API에 전달되지 않음 (UI 표시 목적).
추후 기관별 선택 연동이 필요하면 `SELECT` 단계에서 `connectMyData` 다중 호출로 확장 가능.

---

## 5. 디자인 시스템 (auth 페이지 공통)

| 요소 | 클래스 |
|------|--------|
| 다크 헤더 | `h-14 bg-[#131329]` |
| 다크 배경 (랜딩/완료) | `bg-[#131329]` |
| 입력 필드 | `w-full h-14 bg-gray-100 rounded-xl px-4 text-sm` |
| 주요 버튼 | `h-14 bg-[#131329] text-white rounded-xl font-semibold` |
| 보조 버튼 | `h-14 bg-gray-100 text-gray-600 rounded-xl` |
| 에러 박스 | `bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm` |
| progress bar | `h-1 rounded-full bg-[#131329]` (활성) / `bg-gray-200` (비활성) |

---

## 6. 커밋 이력

```
e28dd69 fix(onboarding): 마이데이터 계좌 조회를 getConnections → GET /api/v1/accounts로 변경
ef1daef style(complete): 안내 문구 제거
a84e3f0 style(complete): 회원가입 완료 화면 UI 개선
ea70931 refactor(onboarding): 마이데이터 연동 플로우 전면 재설계
4a4f950 refactor(auth): 인증번호 - 6자리 자동진행/도트 UI/progress bar
8047b40 refactor(auth): 휴대폰 인증 - 통신사 토글 버튼/입력 스타일 통일
3d71428 refactor(auth): 회원가입 기본정보 - progress bar/체크박스 동의/UI 통일
737b935 refactor(auth): 로그인 페이지 UI 개선 - 로고 헤더/에러박스/회원가입 링크
3c7a6fe feat(auth): 랜딩 페이지 추가 - 로고/회원가입/로그인 버튼
```

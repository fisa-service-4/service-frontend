# 색상 컨벤션

색상은 `src/app/globals.css`의 `@theme` 블록에 정의되어 있습니다.
Tailwind 클래스로 바로 사용할 수 있으며, 임의의 hex 코드(`#1b85ff` 등)를 직접 쓰지 않습니다.

---

## 팔레트

### Primary (브랜드 색상)

| 토큰 | 클래스 예시 | 색상 | 용도 |
|------|------------|------|------|
| Primary-50  | `bg-primary-50`  | `#ecf6ff` | 버튼 hover 배경, 뱃지 배경 |
| Primary-100 | `bg-primary-100` | `#d5ebff` | 강조 배경 |
| Primary-300 | `bg-primary-300` | `#81c7ff` | 보조 강조 |
| Primary-500 | `bg-primary-500` | `#1b85ff` | 기본 버튼, 주요 액션 |
| Primary-700 | `bg-primary-700` | `#0056f8` | 버튼 hover 상태 |
| Primary-900 | `bg-primary-900` | `#0b3a94` | 강한 강조 텍스트 |

### 상태 색상

| 토큰 | 클래스 예시 | 색상 | 용도 |
|------|------------|------|------|
| Success | `text-success` | `#00C24A` | 수익, 완료, 긍정 상태 |
| Error   | `text-error`   | `#FF2B2B` | 손실, 오류, 부정 상태 |

### Gray Scale

| 토큰 | 클래스 예시 | 색상 | 용도 |
|------|------------|------|------|
| Gray-50  | `bg-gray-50`  | `#F8FAFC` | - |
| Gray-100 | `bg-gray-100` | `#F1F5F9` | 비활성 버튼 배경, 입력창 배경 |
| Gray-200 | `bg-gray-200` | `#E2E8F0` | 구분선, 비활성 테두리 |
| Gray-400 | `text-gray-400` | `#94A3B8` | placeholder, 보조 텍스트 |
| Gray-500 | `text-gray-500` | `#64748B` | 설명 텍스트 |
| Gray-700 | `text-gray-700` | `#334155` | 일반 텍스트 |
| Gray-900 | `text-gray-900` | `#0F172A` | 제목, 강조 텍스트 |

### Background

| 토큰 | 클래스 | 색상 | 용도 |
|------|--------|------|------|
| Background      | `bg-bg`      | `#F8FAFC` | 페이지 전체 배경 |
| Background-Card | `bg-bg-card` | `#FFFFFF` | 카드, 모달 등 컨테이너 배경 |

---

## 사용 규칙

### 페이지 배경

페이지 최상위 `div`에 `bg-bg`를 사용합니다.

```tsx
// 올바른 사용
<div className="flex flex-col h-screen bg-bg">

// 사용하지 않음
<div className="flex flex-col h-screen bg-white">
<div className="flex flex-col h-screen" style={{ background: '#F8FAFC' }}>
```

### 카드

카드는 `bg-bg-card`(흰색) + `shadow-sm`을 기본으로 합니다. 테두리는 사용하지 않습니다.

```tsx
// 올바른 사용
<div className="bg-bg-card shadow-sm rounded-2xl p-5">

// 사용하지 않음
<div className="bg-white border-2 border-primary-500 rounded-2xl p-5">
```

### 버튼

```tsx
// 기본 버튼
<button className="bg-primary-500 hover:bg-primary-700 text-white">

// 보조 버튼
<button className="bg-gray-100 text-gray-700">

// 비활성(disabled)
<button className="bg-gray-100 text-gray-400" disabled>
```

### 텍스트

```tsx
<h1 className="text-gray-900">제목</h1>
<p className="text-gray-500">설명</p>
<span className="text-gray-400">보조 / placeholder</span>

// 수익/손실
<span className="text-success">+120,000원</span>
<span className="text-error">-30,000원</span>
```

### 뱃지 / 태그

```tsx
// 주요 상태
<span className="bg-primary-50 text-primary-700 border border-primary-100 rounded-lg px-2.5 py-1 text-xs font-bold">
  완료
</span>
```

---

## 절대 하지 말 것

- `style={{ color: '#1b85ff' }}` 등 인라인 hex 코드 직접 사용 금지
- `bg-sky-500`, `bg-blue-500` 등 Tailwind 기본 색상 사용 금지 — 반드시 위 토큰 사용
- 카드에 컬러 테두리(`border-primary-*`) 사용 금지 — 그림자(`shadow-sm`)로 대체

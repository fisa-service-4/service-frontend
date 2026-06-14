# Onboarding UI 개선 진행 상황

## 진행 순서

- [x] **STEP 1** — `src/app/page.tsx` : 랜딩 페이지
- [ ] **STEP 2** — `src/app/(auth)/login/page.tsx` : 로그인 UI 개선
- [ ] **STEP 3** — `src/app/(auth)/signup/page.tsx` : 기본정보 UI + progress bar
- [ ] **STEP 4** — `src/app/(auth)/signup/phone/page.tsx` : 통신사 토글 + UI 개선
- [ ] **STEP 5** — `src/app/(auth)/signup/verify/page.tsx` : 자동진행 + UI 개선
- [ ] **STEP 6** — `src/app/(auth)/signup/onboarding/page.tsx` : 전면 재설계
  - [ ] 6-1. `intro` sub-step
  - [ ] 6-2. `select` sub-step (기관 선택 체크박스)
  - [ ] 6-3. `loading` sub-step (API 연동)
  - [ ] 6-4. `connected` sub-step (연동 완료)
  - [ ] 6-5. `deposit` sub-step (입금 계좌 카드 선택 + setAccountRole)
  - [ ] 6-6. `salary` sub-step (월급 계좌 카드 선택 + setAccountRole)
  - [ ] 6-7. `emergency` sub-step (비상금 계좌 카드 선택 + setAccountRole)
  - [ ] 6-8. `stock` sub-step (투자 계좌 카드 선택 + setAccountRole)
- [ ] **STEP 7** — `src/app/(auth)/signup/pin/page.tsx` : PIN UI 소폭 개선
- [ ] **STEP 8** — `src/app/(auth)/signup/complete/page.tsx` : 완료 후 /home 리다이렉트

## 디자인 시스템 메모

- Primary: `#1b85ff` (primary-500)
- Dark nav: `#131329`
- Input: `w-full h-14 bg-gray-100 rounded-xl px-4 text-sm outline-none`
- Button: `h-14 rounded-xl font-medium`
- 은행 로고: `public/banks/` — Hana, IBK, KB, Kakao, NH, SC, Shinhan, Toss, Woori

## bankCode → 로고 매핑

| bankCode | 파일 |
|----------|------|
| 003 | /banks/IBK.png |
| 004 | /banks/KB.png |
| 011 | /banks/NH.png |
| 020 | /banks/Woori.png |
| 023 | /banks/SC.png |
| 081 | /banks/Hana.png |
| 088 | /banks/Shinhan.png |
| 090 | /banks/Kakao.png |
| 092 | /banks/Toss.png |

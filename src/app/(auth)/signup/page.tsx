'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { signupStore } from '@/store/signupStore';

const JOB_OPTIONS = [
  { label: '개발자/IT',      value: 'DEVELOPER',   freelancer: true },
  { label: '디자이너',        value: 'DESIGNER',    freelancer: true },
  { label: '마케터',          value: 'MARKETER',    freelancer: true },
  { label: '작가/크리에이터', value: 'CREATOR',     freelancer: true },
  { label: '강사/튜터',       value: 'INSTRUCTOR',  freelancer: true },
  { label: '컨설턴트',        value: 'CONSULTANT',  freelancer: true },
  { label: '프리랜서 (기타)', value: 'FREELANCER',  freelancer: true },
  { label: '직장인',          value: 'EMPLOYEE',    freelancer: false },
];

const STEPS = ['기본 정보', '본인 인증', '인증 확인'];

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [jobType, setJobType] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError]     = useState('');

  function validate() {
    if (!email.trim())  return '이메일을 입력해주세요.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '올바른 이메일 형식이 아닙니다.';
    if (!password)      return '비밀번호를 입력해주세요.';
    if (password.length < 8) return '비밀번호는 영문 대/소문자, 숫자, 특수기호 포함 8자 이상이어야 합니다.';
    if (!jobType)       return '직업유형을 선택해주세요.';
    if (!consent)       return '서비스 이용에 동의해주세요.';
    return '';
  }

  function handleNext() {
    const msg = validate();
    if (msg) { setError(msg); return; }
    setError('');

    const selected = JOB_OPTIONS.find((j) => j.value === jobType);
    signupStore.save({
      email: email.trim(),
      password,
      jobType,
      freelancerYn: selected?.freelancer ?? false,
      termsConsentYn: true,
    });
    router.push('/signup/phone');
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* 상단 헤더 */}
      <div className="h-14 bg-[#131329] flex items-center px-4">
        <button type="button" onClick={() => router.push('/')} className="text-white p-1">
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="flex-1 px-6 pt-6 pb-4 overflow-y-auto">
        {/* 진행 바 */}
        <div className="flex gap-1.5 mb-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i === 0 ? 'bg-primary-500' : 'bg-gray-200'}`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mb-6">1 / {STEPS.length}</p>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">기본 정보</h1>
        <p className="text-sm text-gray-400 mb-7">계정에 사용할 정보를 입력해주세요</p>

        <div className="flex flex-col gap-5">
          {/* 이메일 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">이메일 (아이디)</label>
            <input
              type="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full h-14 bg-gray-100 rounded-xl px-4 text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
          </div>

          {/* 비밀번호 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">비밀번호</label>
            <input
              type="password"
              placeholder="영문 대/소문자, 숫자, 특수기호 포함 8자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full h-14 bg-gray-100 rounded-xl px-4 text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
          </div>

          {/* 직업유형 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">직업유형</label>
            <div className="relative">
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full h-14 bg-gray-100 rounded-xl px-4 text-sm text-gray-800 outline-none appearance-none cursor-pointer"
              >
                <option value="" disabled>선택해주세요</option>
                {JOB_OPTIONS.map((j) => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▼</span>
            </div>
          </div>

          {/* 서비스 이용 동의 */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500 font-medium">서비스 이용 동의</label>
            <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 rounded-xl">
              <div
                className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                  consent ? 'bg-primary-500 border-primary-500' : 'bg-white border-gray-300'
                }`}
                onClick={() => setConsent((v) => !v)}
              >
                {consent && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-700 leading-snug" onClick={() => setConsent((v) => !v)}>
                flon 서비스 이용약관 및 개인정보 처리방침에 동의합니다 <span className="text-primary-500 font-medium">(필수)</span>
              </span>
            </label>
          </div>

        </div>
      </div>

      {/* 에러 메시지 - 고정 높이 (버튼 위) */}
      <div className="px-6 h-8 flex items-center">
        <p className={`text-sm text-red-500 ${error ? 'visible' : 'invisible'}`}>{error || ' '}</p>
      </div>

      {/* 하단 버튼 */}
      <div className="px-6 pb-8">
        <button
          type="button"
          onClick={handleNext}
          className="w-full h-14 bg-primary-500 text-white rounded-xl text-base font-semibold"
        >
          다음
        </button>
      </div>
    </div>
  );
}

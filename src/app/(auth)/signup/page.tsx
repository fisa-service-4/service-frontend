'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signupStore } from '@/store/signupStore';

const JOB_OPTIONS = [
  { label: '개발자/IT',       value: 'DEVELOPER',   freelancer: true },
  { label: '디자이너',         value: 'DESIGNER',    freelancer: true },
  { label: '마케터',           value: 'MARKETER',    freelancer: true },
  { label: '작가/크리에이터',  value: 'CREATOR',     freelancer: true },
  { label: '강사/튜터',        value: 'INSTRUCTOR',  freelancer: true },
  { label: '컨설턴트',         value: 'CONSULTANT',  freelancer: true },
  { label: '프리랜서 (기타)', value: 'FREELANCER',  freelancer: true },
  { label: '직장인',           value: 'EMPLOYEE',    freelancer: false },
];

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [jobType, setJobType]   = useState('');
  const [consent, setConsent]   = useState<boolean | null>(null);
  const [error, setError]       = useState('');

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
    <div className="flex flex-col min-h-screen">
      <div className="h-12 bg-[#131329]" />

      <div className="flex-1 px-6 pt-8 pb-6 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">회원가입</h1>

        <div className="flex flex-col gap-5">
          {/* 이메일 */}
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">ID 설정(이메일)</label>
            <input
              type="email"
              placeholder="이메일을 입력하세요."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full h-14 bg-gray-100 rounded-xl px-4 text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">비밀번호</label>
            <input
              type="password"
              placeholder="영문 대/소문자, 숫자, 특수기호 포함 8~20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full h-14 bg-gray-100 rounded-xl px-4 text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
          </div>

          {/* 직업유형 */}
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">직업유형 선택</label>
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
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs">▼</span>
            </div>
          </div>

          {/* 서비스 이용 동의 */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">서비스 이용 동의</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="consent"
                  checked={consent === false}
                  onChange={() => setConsent(false)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">동의하지 않음</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="consent"
                  checked={consent === true}
                  onChange={() => setConsent(true)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">동의</span>
              </label>
            </div>
          </div>

          {error && <p className="text-red-500 text-xs px-1">{error}</p>}
        </div>
      </div>

      <div className="px-6 pb-4 flex gap-3">
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="flex-1 h-14 bg-gray-200 text-gray-700 rounded-xl text-base font-medium"
        >
          이전
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 h-14 bg-[#131329] text-white rounded-xl text-base font-medium"
        >
          다음
        </button>
      </div>

      <div className="h-8 bg-[#131329]" />
    </div>
  );
}

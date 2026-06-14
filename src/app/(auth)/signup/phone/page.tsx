'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { authApi } from '@/api/auth';
import { signupStore } from '@/store/signupStore';

const CARRIERS = [
  { label: 'SKT',   value: 'SKT'  },
  { label: 'KT',    value: 'KT'   },
  { label: 'LG U+', value: 'LGU'  },
];

const STEPS = ['기본 정보', '본인 인증', '인증 확인'];

export default function SignupPhonePage() {
  const router = useRouter();
  const [userName, setUserName]       = useState('');
  const [birthDate, setBirthDate]     = useState('');
  const [genderDigit, setGenderDigit] = useState('');
  const [carrier, setCarrier]         = useState('');
  const [phone, setPhone]             = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  function validate() {
    if (!userName.trim())                       return '이름을 입력해주세요.';
    if (birthDate.length !== 6)                 return '생년월일 6자리를 입력해주세요.';
    if (!genderDigit)                           return '성별 자리(1자리)를 입력해주세요.';
    if (!carrier)                               return '통신사를 선택해주세요.';
    if (phone.replace(/\D/g, '').length < 10)  return '올바른 휴대폰번호를 입력해주세요.';
    return '';
  }

  async function handleNext() {
    const msg = validate();
    if (msg) { setError(msg); return; }
    setError('');

    const phoneNumber    = phone.replace(/\D/g, '');
    const residentNumber = birthDate + genderDigit;

    setLoading(true);
    try {
      await authApi.phoneSend({
        name:           userName.trim(),
        residentNumber,
        telecom:        carrier,
        phoneNumber,
      });
      signupStore.save({
        userName: userName.trim(),
        phoneNumber,
        residentNumber,
        telecom: carrier,
      });
      router.push('/signup/verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증번호 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 상단 헤더 */}
      <div className="h-14 bg-[#131329] flex items-center px-4">
        <button type="button" onClick={() => router.push('/signup')} className="text-white p-1">
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="flex-1 px-6 pt-6 pb-4 overflow-y-auto">
        {/* 진행 바 */}
        <div className="flex gap-1.5 mb-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= 1 ? 'bg-[#131329]' : 'bg-gray-200'}`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mb-6">2 / {STEPS.length}</p>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">본인 인증</h1>
        <p className="text-sm text-gray-400 mb-7">휴대폰으로 본인 확인을 진행합니다</p>

        <div className="flex flex-col gap-5">
          {/* 이름 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">이름</label>
            <input
              type="text"
              placeholder="실명을 입력하세요"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full h-14 bg-gray-100 rounded-xl px-4 text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
          </div>

          {/* 주민등록번호 앞 7자리 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">주민등록번호 앞 7자리</label>
            <div className="flex items-center h-14 bg-gray-100 rounded-xl px-4 gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="생년월일 6자리"
                maxLength={6}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value.replace(/\D/g, ''))}
                className="w-28 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
              />
              <span className="text-gray-300 font-light">|</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={1}
                placeholder="0"
                value={genderDigit}
                onChange={(e) => setGenderDigit(e.target.value.replace(/\D/g, ''))}
                className="w-5 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none text-center"
              />
              <span className="text-gray-400 tracking-widest text-sm">••••••</span>
            </div>
          </div>

          {/* 통신사 선택 (토글 버튼) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">통신사</label>
            <div className="flex gap-2">
              {CARRIERS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCarrier(c.value)}
                  className={`flex-1 h-12 rounded-xl text-sm font-medium border transition-colors ${
                    carrier === c.value
                      ? 'bg-[#131329] text-white border-[#131329]'
                      : 'bg-gray-100 text-gray-600 border-transparent'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* 휴대폰번호 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">휴대폰번호</label>
            <div className="relative flex items-center h-14 bg-gray-100 rounded-xl px-4">
              <input
                type="tel"
                placeholder="'-' 없이 숫자만 입력"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
              />
              {phone && (
                <button
                  type="button"
                  onClick={() => setPhone('')}
                  className="text-gray-400 text-xl leading-none ml-2"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="px-6 pb-4">
        <button
          type="button"
          onClick={handleNext}
          disabled={loading}
          className="w-full h-14 bg-[#131329] text-white rounded-xl text-base font-semibold disabled:opacity-60 transition-opacity"
        >
          {loading ? '전송 중...' : '인증번호 받기'}
        </button>
      </div>

      <div className="h-8 bg-[#131329]" />
    </div>
  );
}

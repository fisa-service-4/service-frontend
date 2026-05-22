'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/api/auth';
import { signupStore } from '@/store/signupStore';

const CARRIERS: { label: string; value: string }[] = [
  { label: 'SKT', value: 'SKT' },
  { label: 'KT',  value: 'KT'  },
  { label: 'LG U+', value: 'LGU' },
];

export default function SignupPhonePage() {
  const router = useRouter();
  const [userName, setUserName]     = useState('');
  const [birthDate, setBirthDate]   = useState('');
  const [genderDigit, setGenderDigit] = useState('');
  const [carrier, setCarrier]       = useState('');
  const [phone, setPhone]           = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  function validate() {
    if (!userName.trim())       return '이름을 입력해주세요.';
    if (birthDate.length !== 6) return '생년월일 6자리를 입력해주세요.';
    if (!genderDigit)           return '성별 자리를 입력해주세요.';
    if (!carrier)               return '통신사를 선택해주세요.';
    if (phone.replace(/\D/g, '').length < 10) return '올바른 휴대폰번호를 입력해주세요.';
    return '';
  }

  async function handleNext() {
    const msg = validate();
    if (msg) { setError(msg); return; }
    setError('');

    const phoneNumber    = phone.replace(/\D/g, '');
    const residentNumber = birthDate + genderDigit;
    const selectedCarrier = CARRIERS.find((c) => c.label === carrier)?.value ?? carrier;

    setLoading(true);
    try {
      await authApi.phoneSend({
        name:           userName.trim(),
        residentNumber,
        telecom:        selectedCarrier,
        phoneNumber,
      });
      signupStore.save({ userName: userName.trim(), phoneNumber, residentNumber, telecom: selectedCarrier });
      router.push('/signup/verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증번호 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="h-12 bg-[#131329]" />

      <div className="flex-1 px-6 pt-8 pb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-8">휴대폰 본인 인증</h1>

        <div className="flex flex-col gap-5">
          {/* 이름 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">이름</label>
            <input
              type="text"
              placeholder="이름"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full h-14 border border-gray-200 rounded-xl px-4 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-gray-400"
            />
          </div>

          {/* 주민등록번호 앞 7자리 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">주민등록번호 앞 7자리</label>
            <div className="flex items-center h-14 border border-gray-200 rounded-xl px-4 gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="생년월일"
                maxLength={6}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value.replace(/\D/g, ''))}
                className="w-24 text-sm text-gray-800 placeholder-gray-400 outline-none"
              />
              <span className="text-gray-400">-</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={genderDigit}
                onChange={(e) => setGenderDigit(e.target.value.replace(/\D/g, ''))}
                className="w-5 text-sm text-gray-800 outline-none text-center"
              />
              <span className="text-gray-400 tracking-widest text-sm">
                &#42;&#42;&#42;&#42;&#42;&#42;
              </span>
            </div>
          </div>

          {/* 휴대폰번호 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">휴대폰번호</label>
            <div className="flex items-center h-14 border border-gray-200 rounded-xl px-3 gap-2">
              <div className="relative">
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="text-sm text-gray-700 outline-none appearance-none pr-4 cursor-pointer bg-transparent"
                >
                  <option value="">통신사</option>
                  {CARRIERS.map((c) => (
                    <option key={c.value} value={c.label}>{c.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">▼</span>
              </div>

              <div className="w-px h-5 bg-gray-200 mx-1" />

              <input
                type="tel"
                placeholder="휴대폰번호 입력"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none"
              />

              {phone && (
                <button
                  type="button"
                  onClick={() => setPhone('')}
                  className="text-gray-400 text-xl leading-none"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {error && <p className="text-red-500 text-xs px-1">{error}</p>}
        </div>
      </div>

      <div className="px-6 pb-4 flex gap-3">
        <button
          type="button"
          onClick={() => router.push('/signup')}
          className="flex-1 h-14 bg-gray-200 text-gray-700 rounded-xl text-base font-medium"
        >
          이전
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={loading}
          className="flex-1 h-14 bg-[#131329] text-white rounded-xl text-base font-medium disabled:opacity-60"
        >
          {loading ? '전송 중...' : '다음'}
        </button>
      </div>

      <div className="h-8 bg-[#131329]" />
    </div>
  );
}

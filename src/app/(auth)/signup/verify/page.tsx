'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/api/auth';
import { tokenUtils } from '@/utils/token';
import { signupStore } from '@/store/signupStore';
import PinKeypad from '@/components/PinKeypad';

const OTP_SECONDS = 180;
const OTP_LENGTH = 6;

function maskPhone(raw: string) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10) return raw;
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}

export default function SignupVerifyPage() {
  const router = useRouter();
  const [code, setCode]         = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [timeLeft, setTimeLeft] = useState(OTP_SECONDS);

  const formData    = signupStore.get();
  const maskedPhone = maskPhone(formData.phoneNumber ?? '');

  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft]);

  const minutes   = Math.floor(timeLeft / 60);
  const seconds   = timeLeft % 60;
  const timerText = `${minutes}:${String(seconds).padStart(2, '0')}`;

  const handleKey = useCallback((value: string) => {
    setError('');
    if (value === 'backspace') {
      setCode((c) => c.slice(0, -1));
    } else if (code.length < OTP_LENGTH) {
      setCode((c) => c + value);
    }
  }, [code]);

  async function handleResend() {
    if (!formData.phoneNumber) return;
    try {
      await authApi.phoneSend({
        name:           formData.userName      ?? '',
        residentNumber: formData.residentNumber ?? '',
        telecom:        formData.telecom        ?? '',
        phoneNumber:    formData.phoneNumber,
      });
      setTimeLeft(OTP_SECONDS);
      setCode('');
      setError('');
    } catch {
      setError('재전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  async function handleNext() {
    if (code.length !== OTP_LENGTH) {
      setError('인증번호 6자리를 입력해주세요.');
      return;
    }
    if (timeLeft <= 0) {
      setError('인증 시간이 만료되었습니다. 재전송 후 다시 시도해주세요.');
      return;
    }

    setError('');
    setLoading(true);

    // 1. 휴대폰 인증 검증
    try {
      await authApi.phoneVerify(formData.phoneNumber ?? '', code);
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증번호가 올바르지 않습니다.');
      setLoading(false);
      setCode('');
      return;
    }

    // 2. 회원가입
    const data = signupStore.get();
    try {
      await authApi.signup({
        email:          data.email         ?? '',
        password:       data.password      ?? '',
        userName:       data.userName      ?? '',
        phoneNumber:    data.phoneNumber   ?? '',
        freelancerYn:   data.freelancerYn  ?? false,
        jobType:        data.jobType       ?? '',
        termsConsentYn: data.termsConsentYn ?? false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
      setLoading(false);
      return;
    }

    // 3. 로그인 (토큰 취득)
    try {
      const loginRes = await authApi.login({
        email:    data.email    ?? '',
        password: data.password ?? '',
      });
      tokenUtils.setTokens(loginRes.accessToken, loginRes.refreshToken);
    } catch {
      setError('계정 생성 후 로그인에 실패했습니다. 로그인 화면에서 다시 시도해주세요.');
      setLoading(false);
      return;
    }

    router.push('/signup/onboarding');
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="h-12 bg-[#131329]" />

      <div className="flex-1 flex flex-col pt-8">
        <div className="px-6 mb-5">
          <h1 className="text-xl font-bold text-gray-900 mb-5">인증번호 입력</h1>

          {/* 폰 번호 + 타이머 */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-700">{maskedPhone}</span>
            <span className={`text-sm font-medium ${timeLeft > 0 ? 'text-green-500' : 'text-red-400'}`}>
              {timeLeft > 0 ? `${timerText} 시간 연장` : '시간 초과'}
            </span>
          </div>

          {/* 인증번호 입력 필드 */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 h-14 mb-3">
            <input
              type="text"
              readOnly
              placeholder="인증번호 6자리"
              value={code}
              className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none tracking-widest"
            />
            {code && (
              <button
                type="button"
                onClick={() => setCode('')}
                className="text-gray-400 text-xl leading-none"
              >
                ×
              </button>
            )}
            <button
              type="button"
              onClick={handleResend}
              className="bg-gray-700 text-white text-xs px-3 py-1.5 rounded-lg shrink-0"
            >
              재전송
            </button>
          </div>

          {error && <p className="text-red-500 text-xs mb-3 px-1">{error}</p>}

          {/* 이전 / 다음 버튼 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push('/signup/phone')}
              className="flex-1 h-14 bg-white border border-gray-200 text-gray-700 rounded-xl text-base font-medium"
            >
              이전
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={loading || code.length !== OTP_LENGTH}
              className="flex-1 h-14 bg-gray-200 text-gray-700 rounded-xl text-base font-medium disabled:opacity-50 transition-opacity"
            >
              {loading ? '처리 중...' : '다음'}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-3">인증문자가 오지 않나요?</p>
        </div>

        {/* 숫자 키패드 */}
        <div className="mt-auto pb-6">
          <PinKeypad onPress={handleKey} />
        </div>
      </div>

      <div className="h-8 bg-[#131329]" />
    </div>
  );
}

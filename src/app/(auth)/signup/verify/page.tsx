'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { authApi } from '@/api/auth';
import { signupStore } from '@/store/signupStore';
import PinKeypad from '@/components/PinKeypad';

const OTP_SECONDS = 180;
const OTP_LENGTH  = 6;
const STEPS       = ['기본 정보', '본인 인증', '인증 확인'];

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
  const [formData]              = useState(() => signupStore.get());

  const maskedPhone = maskPhone(formData.phoneNumber ?? '');

  // 타이머
  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft]);

  const minutes   = Math.floor(timeLeft / 60);
  const seconds   = timeLeft % 60;
  const timerText = `${minutes}:${String(seconds).padStart(2, '0')}`;

  // 키패드 입력
  const handleKey = useCallback(
    (value: string) => {
      setError('');
      if (value === 'backspace') {
        setCode((c) => c.slice(0, -1));
      } else if (code.length < OTP_LENGTH) {
        setCode((c) => c + value);
      }
    },
    [code],
  );

  // 6자리 입력 완료 시 자동 진행
  useEffect(() => {
    if (code.length === OTP_LENGTH && !loading) {
      handleSubmit(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function handleSubmit(currentCode: string) {
    if (currentCode.length !== OTP_LENGTH) return;
    if (timeLeft <= 0) {
      setError('인증 시간이 만료되었습니다. 재전송 후 다시 시도해주세요.');
      return;
    }

    setError('');
    setLoading(true);

    // 1. 휴대폰 인증 검증
    try {
      await authApi.phoneVerify(formData.phoneNumber ?? '', currentCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증번호가 올바르지 않습니다.');
      setCode('');
      setLoading(false);
      return;
    }

    // 2. 회원가입
    const data = signupStore.get();
    try {
      await authApi.signup({
        email:          data.email          ?? '',
        password:       data.password       ?? '',
        userName:       data.userName       ?? '',
        phoneNumber:    data.phoneNumber    ?? '',
        freelancerYn:   data.freelancerYn   ?? false,
        jobType:        data.jobType        ?? '',
        termsConsentYn: data.termsConsentYn ?? false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
      setCode('');
      setLoading(false);
      return;
    }

    router.push('/login?redirect=/signup/onboarding');
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* 상단 헤더 */}
      <div className="h-14 bg-[#131329] flex items-center px-4">
        <button type="button" onClick={() => router.push('/signup/phone')} className="text-white p-1">
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="flex-1 flex flex-col pt-6">
        <div className="px-6">
          {/* 진행 바 */}
          <div className="flex gap-1.5 mb-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i <= 2 ? 'bg-primary-500' : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mb-6">3 / {STEPS.length}</p>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">인증번호 입력</h1>
          <p className="text-sm text-gray-400 mb-6">{maskedPhone}으로 발송된 6자리 번호를 입력하세요</p>

          {/* 인증번호 표시 도트 */}
          <div className="flex justify-center gap-3 mb-4">
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-colors duration-150 ${
                  i < code.length ? 'bg-primary-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* 타이머 + 재전송 */}
          <div className="flex items-center justify-between mb-4">
            <span className={`text-sm font-medium ${timeLeft > 0 ? 'text-gray-500' : 'text-red-400'}`}>
              {timeLeft > 0 ? `남은 시간 ${timerText}` : '시간 초과'}
            </span>
            <button
              type="button"
              onClick={handleResend}
              className="text-xs text-gray-500 underline underline-offset-2"
            >
              인증번호 재전송
            </button>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* 처리 중 표시 */}
          {loading && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-gray-600 text-sm text-center">처리 중...</p>
            </div>
          )}
        </div>

        {/* 숫자 키패드 */}
        <div className="mt-auto pb-6">
          <PinKeypad onPress={handleKey} />
        </div>
      </div>
    </div>
  );
}

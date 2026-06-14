'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/api/auth';
import { signupStore } from '@/store/signupStore';
import PinKeypad from '@/components/PinKeypad';

const PIN_LENGTH = 6;

type Step = 'setup' | 'confirm';

export default function SignupPinPage() {
  const router = useRouter();
  const [step, setStep]         = useState<Step>('setup');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const current = step === 'setup' ? firstPin : confirmPin;
  const filled  = current.length;

  const handleKey = useCallback((value: string) => {
    setError('');
    const setter = step === 'setup' ? setFirstPin : setConfirmPin;
    if (value === 'backspace') {
      setter((p) => p.slice(0, -1));
    } else if (current.length < PIN_LENGTH) {
      setter((p) => p + value);
    }
  }, [step, current]);

  async function handleAction() {
    if (step === 'setup') {
      if (firstPin.length < PIN_LENGTH) return;
      setStep('confirm');
      return;
    }

    // confirm 단계
    if (confirmPin.length < PIN_LENGTH) return;

    if (firstPin !== confirmPin) {
      setError('PIN번호가 일치하지 않습니다. 다시 입력해주세요.');
      setConfirmPin('');
      return;
    }

    setLoading(true);
    try {
      // PIN 등록 (서버에서 pin/pinConfirm 일치 여부 및 연속·반복 숫자 검증)
      await authApi.registerPin({ pin: firstPin, pinConfirm: confirmPin });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PIN 등록에 실패했습니다.');
      setConfirmPin('');
      setStep('setup');
      setFirstPin('');
      setLoading(false);
      return;
    }

    try {
      // 회원가입 완료
      await authApi.signupComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입 완료 처리에 실패했습니다.');
      setLoading(false);
      return;
    }

    signupStore.clear();
    router.push('/signup/complete');
  }

  function handleBack() {
    if (step === 'confirm') {
      setStep('setup');
      setConfirmPin('');
      setError('');
    } else {
      router.push('/signup/verify');
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="h-12 bg-[#131329]" />

      <div className="flex-1 flex flex-col items-center pt-16 pb-4">
        <p className="text-center text-base text-gray-700 mb-10 leading-loose whitespace-pre-line">
          {step === 'setup'
            ? '잠금해제 비밀번호를\n설정해주세요'
            : '확인을 위해 한 번 더\n입력해주세요'}
        </p>

        {/* PIN 입력 표시 도트 */}
        <div className="flex gap-4 mb-10">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-colors duration-150 ${
                i < filled ? 'bg-primary-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mx-6 mb-6 bg-gray-100 rounded-xl px-6 py-3 w-full max-w-[330px]">
            <p className="text-sm text-gray-700 text-center">{error}</p>
          </div>
        )}

        <div className="mt-auto w-full pb-4">
          <PinKeypad onPress={handleKey} showAsterisk />
        </div>
      </div>

      <div className="px-6 pb-6 pt-2 flex gap-2">
        <button
          type="button"
          onClick={handleBack}
          className="flex-1 h-14 bg-gray-100 text-gray-700 rounded-xl text-base font-medium"
        >
          이전
        </button>
        <button
          type="button"
          onClick={handleAction}
          disabled={loading || current.length < PIN_LENGTH}
          className="flex-1 h-14 bg-[#131329] text-white rounded-xl text-base font-semibold disabled:opacity-40 transition-opacity"
        >
          {loading ? '처리 중...' : '완료'}
        </button>
      </div>
      <div className="h-2 bg-[#131329]" />
    </div>
  );
}

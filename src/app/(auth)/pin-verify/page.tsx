'use client';

import { useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/api/auth';
import { ApiError } from '@/utils/apiClient';
import PinKeypad from '@/components/PinKeypad';

const PIN_LENGTH   = 6;
const MAX_ATTEMPTS = 5;

function PinVerifyContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get('redirect') ?? '/home';

  const [pin, setPin]                           = useState('');
  const [failCount, setFailCount]               = useState(0);
  const [errorMsg, setErrorMsg]                 = useState('');
  const [locked, setLocked]                     = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [showPinLockedModal, setShowPinLockedModal] = useState(false);

  const filled = pin.length;

  const handleKey = useCallback((value: string) => {
    if (locked) return;
    setErrorMsg('');
    if (value === 'backspace') {
      setPin((p) => p.slice(0, -1));
    } else if (pin.length < PIN_LENGTH) {
      setPin((p) => p + value);
    }
  }, [pin, locked]);

  async function handleVerify() {
    if (pin.length < PIN_LENGTH || locked) return;

    setLoading(true);
    try {
      await authApi.verifyPin(pin);
      router.push(redirectTo);
    } catch (err) {
      setPin('');

      if (err instanceof ApiError && err.code === 'AUTH_009') {
        setLocked(true);
        setFailCount(MAX_ATTEMPTS);
        setShowPinLockedModal(true);
      } else {
        const next = failCount + 1;
        setFailCount(next);
        if (next >= MAX_ATTEMPTS) {
          setLocked(true);
          setErrorMsg(`${MAX_ATTEMPTS}회 입력 오류입니다.\n계정이 잠겼습니다.`);
        } else {
          setErrorMsg(
            err instanceof Error
              ? err.message
              : 'PIN번호를 잘못 입력하셨습니다. 다시 입력하세요.'
          );
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setLocked(false);
    setFailCount(0);
    setPin('');
    setErrorMsg('');
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="h-12 bg-[#131329]" />

      <div className="flex-1 flex flex-col pt-12 pb-4">
        <h1 className="text-center text-xl font-bold text-gray-900 mb-10">
          PIN번호 입력
        </h1>

        {/* 도트 인디케이터 */}
        <div className="flex justify-center gap-4 mb-8">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-colors duration-150 ${
                i < filled ? 'bg-gray-900' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* 에러 메시지 */}
        {errorMsg && (
          <div className="mx-6 mb-4 bg-gray-100 rounded-xl px-5 py-4">
            <p className="text-sm text-gray-700 text-center whitespace-pre-line mb-3">
              {errorMsg}
            </p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {MAX_ATTEMPTS}회 중 {failCount}회 틀렸습니다.
              </span>
              {locked ? (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-blue-600 font-semibold"
                >
                  초기화
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setPin(''); setErrorMsg(''); }}
                  className="text-xs text-blue-600 font-semibold"
                >
                  재입력
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-auto pb-4">
          <PinKeypad onPress={handleKey} showAsterisk disabled={locked} />
        </div>
      </div>

      <div className="bg-[#131329] flex">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 h-14 text-white text-base font-medium border-r border-white/10"
        >
          이전
        </button>
        <button
          type="button"
          onClick={handleVerify}
          disabled={loading || pin.length < PIN_LENGTH || locked}
          className="flex-1 h-14 text-white text-base font-medium disabled:opacity-40"
        >
          {loading ? '확인 중...' : '완료'}
        </button>
      </div>

      {/* PIN 잠금 모달 */}
      {showPinLockedModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl mx-6 p-6 flex flex-col items-center">
            <p className="text-base font-bold text-gray-900 mb-2">PIN 잠금</p>
            <p className="text-sm text-gray-500 mb-6 text-center">
              PIN이 잠겼습니다.<br />고객센터에 문의해주세요.
            </p>
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full py-3 bg-sky-500 text-white font-semibold rounded-xl text-sm"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PinVerifyPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen bg-white" />}>
      <PinVerifyContent />
    </Suspense>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import PinKeypad from '@/components/PinKeypad';
import BottomNav from '@/components/main/BottomNav';

type Step = 'current' | 'new' | 'confirm';

const STEP_LABEL: Record<Step, string> = {
  current: '현재 PIN을 입력해주세요',
  new:     '새 PIN을 입력해주세요',
  confirm: '한번 더 입력해주세요',
};

export default function PinChangeView() {
  const router = useRouter();
  const [step, setStep]         = useState<Step>('current');
  const [pin, setPin]           = useState('');
  const [newPin, setNewPin]     = useState('');
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  function handlePress(value: string) {
    if (value === 'backspace') {
      setPin((p) => p.slice(0, -1));
      setErrorMsg('');
      return;
    }
    if (pin.length >= 6) return;

    const next = pin + value;
    setPin(next);

    if (next.length < 6) return;

    setTimeout(() => {
      if (step === 'current') {
        setStep('new');
        setPin('');
      } else if (step === 'new') {
        setNewPin(next);
        setStep('confirm');
        setPin('');
      } else if (step === 'confirm') {
        if (next === newPin) {
          setShowModal(true);
        } else {
          setErrorMsg('PIN이 일치하지 않습니다. 다시 입력해주세요.');
          setPin('');
        }
      }
    }, 200);
  }

  return (
    <div className="flex flex-col h-screen bg-white">

      {/* 헤더 */}
      <div className="flex items-center px-5 py-4 shrink-0 relative">
        <button onClick={() => router.back()} className="absolute left-5">
          <ArrowLeft size={22} className="text-gray-800" />
        </button>
<span className="w-full text-center text-base font-bold text-gray-900">PIN 변경</span>
      </div>

      <div className="flex-1 flex flex-col items-center pt-8 px-4">

        {/* 안내 문구 */}
        <div className="bg-gray-700 rounded-full px-6 py-2.5 mb-10">
          <p className="text-white text-sm font-medium">{STEP_LABEL[step]}</p>
        </div>

        {/* PIN 도트 */}
        <div className="flex gap-4 mb-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-full transition-colors ${
                i < pin.length ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* 에러 메시지 */}
        {errorMsg && (
          <p className="text-sm text-red-500 mb-6">{errorMsg}</p>
        )}

        {/* 키패드 */}
        <PinKeypad onPress={handlePress} />

      </div>

      <BottomNav />

      {/* 성공 모달 */}
      {showModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl mx-6 p-6 flex flex-col items-center">
            <p className="text-base font-bold text-gray-900 mb-2">PIN 변경 완료</p>
            <p className="text-sm text-gray-500 mb-6 text-center">
              PIN이 성공적으로 변경되었습니다.
            </p>
            <button
              onClick={() => router.push('/mypage')}
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

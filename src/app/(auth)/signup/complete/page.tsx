'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

export default function SignupCompletePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
        <div className="w-24 h-24 bg-primary-500/10 rounded-3xl flex items-center justify-center">
          <CheckCircle2 className="text-primary-500" size={48} />
        </div>

        <div className="text-center">
          <p className="text-primary-500 text-sm font-medium mb-2">축하해요!</p>
          <h1 className="text-gray-900 text-3xl font-bold leading-snug">
            모든 설정이
            <br />
            완료되었어요
          </h1>
          <p className="text-gray-400 text-sm mt-3">
            이제 flon에서 자산을 관리해보세요
          </p>
        </div>
      </div>

      <div className="px-6 pb-10">
        <button
          type="button"
          onClick={() => router.push('/home')}
          className="w-full h-14 bg-primary-500 text-white rounded-xl text-base font-semibold"
        >
          시작하기
        </button>
      </div>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { TrendingUp } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-[393px] min-h-screen bg-bg flex flex-col">

        {/* 중앙 로고 영역 */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-4">
          <div className="w-20 h-20 bg-primary-500 rounded-3xl flex items-center justify-center shadow-[0_8px_32px_rgba(27,133,255,0.35)]">
            <TrendingUp className="text-white" size={40} />
          </div>
          <div className="text-center mt-2">
            <h1 className="text-gray-900 text-3xl font-bold tracking-wide">flon</h1>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
              프리랜서를 위한<br />AI 자산관리 플랫폼
            </p>
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="px-6 pb-14 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => router.push('/signup')}
            className="w-full h-14 bg-primary-500 text-white rounded-xl text-base font-semibold shadow-[0_4px_18px_rgba(27,133,255,0.35)]"
          >
            회원가입
          </button>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full h-14 bg-bg-card border border-gray-200 text-gray-700 rounded-xl text-base font-medium"
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}

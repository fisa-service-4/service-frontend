'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupCompletePage() {
  const router = useRouter();

  useEffect(() => {
    const id = setTimeout(() => router.push('/login'), 2500);
    return () => clearTimeout(id);
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="h-12 bg-[#131329]" />

      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-sm text-gray-500 mb-2">축하합니다!</p>
        <h1 className="text-3xl font-bold text-gray-900 text-center leading-snug">
          회원가입
          <br />
          완료
        </h1>
      </div>

      <div className="h-12 bg-[#131329]" />
    </div>
  );
}

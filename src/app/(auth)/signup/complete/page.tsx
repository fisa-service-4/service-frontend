'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp } from 'lucide-react';

export default function SignupCompletePage() {
  const router = useRouter();

  useEffect(() => {
    const id = setTimeout(() => router.push('/login'), 2500);
    return () => clearTimeout(id);
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen bg-[#131329]">
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
        <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center">
          <TrendingUp className="text-white" size={44} />
        </div>

        <div className="text-center">
          <p className="text-primary-300 text-sm font-medium mb-2">축하해요!</p>
          <h1 className="text-white text-3xl font-bold leading-snug">
            회원가입이
            <br />
            완료되었어요
          </h1>
        </div>
      </div>
    </div>
  );
}

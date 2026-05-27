'use client';

import BottomNav from '@/components/main/BottomNav';

export default function StocksPage() {
  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-sm">증권 준비 중</p>
      </div>
      <BottomNav />
    </div>
  );
}

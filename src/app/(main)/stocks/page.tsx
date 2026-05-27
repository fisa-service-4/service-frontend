'use client';

import { useState } from 'react';
import { Menu, Bell } from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import NotificationPanel from '@/components/main/NotificationPanel';

export default function StocksPage() {
  const [showNotification, setShowNotification] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* 1. 상단 헤더 영역 */}
      <div className="flex items-center justify-between px-5 py-4 shrink-0">
        <button>
          <Menu size={24} className="text-gray-800" />
        </button>
        <span className="text-base font-bold text-gray-900">증권</span>
        <button className="p-1" onClick={() => setShowNotification(true)}>
          <Bell size={22} className="text-gray-800" />
        </button>
      </div>

      {/* 2. 본문 영역 (가운데 정렬) */}
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-sm">증권 준비 중</p>
      </div>

      {/* 3. 하단 네비게이션 바 (두 번째 코드 조각에서 누락되었던 부분 추가) */}
      <BottomNav />

      {/* 4. 알림 패널 오버레이 */}
      {showNotification && <NotificationPanel onClose={() => setShowNotification(false)} />}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Menu, Bell } from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import NotificationPanel from '@/components/main/NotificationPanel';

export default function MypagePage() {
  const [showNotification, setShowNotification] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 shrink-0">
          <button>
            <Menu size={24} className="text-gray-800" />
          </button>
          <span className="text-base font-bold text-gray-900">마이페이지</span>
          <button className="p-1" onClick={() => setShowNotification(true)}>
            <Bell size={22} className="text-gray-800" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">마이페이지 준비 중</p>
        </div>
        {showNotification && <NotificationPanel onClose={() => setShowNotification(false)} />}
      </div>
      <BottomNav />
    </div>
  );
import MypageView from '@/components/main/MypageView';

export default function MypagePage() {
  return <MypageView />;
>>>>>>> develop
}

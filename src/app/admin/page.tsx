'use client';

import { useState } from 'react';
import { Menu, User } from 'lucide-react';
import Sidebar from '@/components/admin/Sidebar';
import DashboardView from '@/components/admin/DashboardView';
import LogsView from '@/components/admin/LogsView';
import BottomNav from '@/components/admin/BottomNav';
import type { NavItem } from '@/types/admin';

export default function AdminPage() {
  const [selectedDate, setSelectedDate] = useState('2026-05-24');
  const [activeNav, setActiveNav]       = useState<NavItem>('dashboard');
  const [sidebarOpen, setSidebarOpen]   = useState(false);

  void setSelectedDate;

  return (
    <div className="size-full bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 flex items-center justify-center">
      <div className="relative w-[393px] h-[852px] bg-white shadow-2xl overflow-hidden flex flex-col">

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* 헤더 */}
        <div className="px-5 py-4 shrink-0 bg-gradient-to-r from-slate-800 to-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-1" onClick={() => setSidebarOpen(true)}>
                <Menu size={26} className="text-white" />
              </button>
              <h1 className="text-xl font-bold text-white tracking-wide">관리자</h1>
            </div>
            <button className="p-1 bg-white/20 rounded-full">
              <User size={22} className="text-white" />
            </button>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        {activeNav === 'dashboard' && <DashboardView selectedDate={selectedDate} />}
        {activeNav === 'logs'      && <LogsView />}
        {activeNav === 'users'     && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">사용자 관리 페이지 (준비 중)</p>
          </div>
        )}
        {activeNav === 'settings'  && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">설정 페이지 (준비 중)</p>
          </div>
        )}

        <BottomNav activeNav={activeNav} onNavChange={setActiveNav} />
      </div>
    </div>
  );
}

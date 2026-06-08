'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, User } from 'lucide-react';
import { adminTokenUtils } from '@/utils/token';
import Sidebar from '@/components/admin/Sidebar';
import DashboardView from '@/components/admin/DashboardView';
import LogsView from '@/components/admin/LogsView';
import LoginLogView from '@/components/admin/LoginLogView';
import AiAgentLogView from '@/components/admin/AiAgentLogView';
import UsersView from '@/components/admin/UsersView';
import SettingsView from '@/components/admin/SettingsView';
import BottomNav from '@/components/admin/BottomNav';
import type { NavItem } from '@/types/admin';

type LogSubView = 'login' | 'ai' | 'transaction' | 'notification' | 'error' | 'api' | null;

export default function AdminPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [activeNav, setActiveNav]       = useState<NavItem>('dashboard');

  useEffect(() => {
    if (!adminTokenUtils.getAccessToken()) {
      router.replace('/admin/login');
    }
  }, [router]);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [logSubView, setLogSubView]     = useState<LogSubView>(null);

  const handleNavChange = (nav: NavItem) => {
    setActiveNav(nav);
    setLogSubView(null);
  };

  return (
    <div className="size-full bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 flex items-center justify-center">
      <div className="relative w-[393px] h-[852px] bg-white shadow-2xl overflow-hidden flex flex-col">

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavChange={handleNavChange} />

        {/* 헤더 */}
        <div className="px-5 py-3 shrink-0 bg-gradient-to-r from-slate-800 to-slate-900">
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
        {activeNav === 'dashboard' && <DashboardView selectedDate={selectedDate} onDateChange={setSelectedDate} />}

        {activeNav === 'logs' && logSubView === null && (
          <LogsView onSelect={(key) => setLogSubView(key)} />
        )}
        {activeNav === 'logs' && logSubView === 'login' && (
          <LoginLogView onBack={() => setLogSubView(null)} />
        )}
        {activeNav === 'logs' && logSubView === 'ai' && (
          <AiAgentLogView onBack={() => setLogSubView(null)} />
        )}
        {activeNav === 'logs' && logSubView !== null && logSubView !== 'login' && logSubView !== 'ai' && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">준비 중</p>
          </div>
        )}

        {activeNav === 'users' && <UsersView />}
        {activeNav === 'settings' && <SettingsView />}

        <BottomNav activeNav={activeNav} onNavChange={handleNavChange} />
      </div>
    </div>
  );
}

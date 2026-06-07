'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircle2, Bell, Mail, ShieldCheck, ChevronRight } from 'lucide-react';
import { adminTokenUtils } from '@/utils/token';

interface ToggleProps {
  value: boolean;
  onChange: () => void;
}

function Toggle({ value, onChange }: ToggleProps) {
  return (
    <button
      onClick={onChange}
      className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-colors ${
        value ? 'bg-green-500 text-white' : 'bg-slate-400 text-white'
      }`}
    >
      {value ? 'ON' : 'OFF'}
    </button>
  );
}

export default function SettingsView() {
  const router = useRouter();
  const [slackAlert, setSlackAlert]     = useState(true);
  const [dailyReport, setDailyReport]   = useState(true);
  const [twoFactor, setTwoFactor]       = useState(true);
  const [adminEmail, setAdminEmail] = useState('-');
  const [adminName, setAdminName] = useState('-');

  useEffect(() => {
    setAdminEmail(adminTokenUtils.getUserEmail() ?? '-');
    setAdminName(adminTokenUtils.getUserName() ?? '-');
  }, []);

  function handleLogout() {
    adminTokenUtils.clearTokens();
    router.replace('/admin/login');
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="px-5 pt-5 space-y-4 pb-6">

        {/* 관리자 계정 */}
        <div className="bg-slate-100 rounded-2xl px-4 py-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3">관리자 계정</h3>
          <div className="flex items-center gap-3">
            <UserCircle2 size={40} className="text-slate-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{adminName}</p>
              <p className="text-xs text-gray-500">{adminEmail}</p>
            </div>
          </div>
        </div>

        {/* 알림 설정 */}
        <div className="bg-slate-100 rounded-2xl overflow-hidden">
          <div className="px-4 py-3">
            <h3 className="text-sm font-bold text-gray-800">알림 설정</h3>
          </div>
          <div className="border-t border-slate-200">
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <Bell size={16} className="text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Critical 오류 Slack 알림</p>
                <p className="text-xs text-gray-500">즉시 발송</p>
              </div>
              <Toggle value={slackAlert} onChange={() => setSlackAlert((v) => !v)} />
            </div>

            <div className="mx-4 h-px bg-slate-200" />

            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Mail size={16} className="text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">일간 리포트 이메일</p>
                <p className="text-xs text-gray-500">매일 오전 9시</p>
              </div>
              <Toggle value={dailyReport} onChange={() => setDailyReport((v) => !v)} />
            </div>
          </div>
        </div>

        {/* 보안 */}
        <div className="bg-slate-100 rounded-2xl overflow-hidden">
          <div className="px-4 py-3">
            <h3 className="text-sm font-bold text-gray-800">보안</h3>
          </div>
          <div className="border-t border-slate-200">
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <ShieldCheck size={16} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">2단계 인증</p>
                <p className="text-xs text-gray-500">보안 강화 활성화됨</p>
              </div>
              <Toggle value={twoFactor} onChange={() => setTwoFactor((v) => !v)} />
            </div>

            <div className="mx-4 h-px bg-slate-200" />

            <button onClick={handleLogout} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-200 transition-colors">
              <span className="text-sm font-medium text-gray-900">로그아웃</span>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, ChevronRight, User } from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import { userApi } from '@/api/user';
import type { UserProfile } from '@/types/auth';

export default function MypageView() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [alarmOn, setAlarmOn] = useState(false);

  useEffect(() => {
    userApi.getMe().then((profile) => {
      setUser(profile);
      setAlarmOn(profile.notificationConsentYn);
    }).catch(() => {});
  }, []);

  async function handleAlarmToggle() {
    const next = !alarmOn;
    setAlarmOn(next);
    try {
      await userApi.updateAlarm(next);
    } catch {
      setAlarmOn(!next);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 bg-white shrink-0">
        <button>
          <Menu size={24} className="text-gray-800" />
        </button>
        <span className="text-base font-bold text-gray-900">마이페이지</span>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* 프로필 섹션 */}
        <div className="bg-slate-900 px-5 pb-6 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-slate-700 border-2 border-sky-500 flex items-center justify-center mb-3 mt-2">
            <User size={32} className="text-sky-400" />
          </div>
          <p className="text-white font-bold text-lg mb-1">{user?.userName ?? '-'}</p>
          <p className="text-slate-400 text-sm mb-3">{user?.email ?? '-'}</p>
          {user && (
            <div className="flex gap-2 mb-5">
              {user.jobType && (
                <span className="bg-sky-500/20 text-sky-400 text-xs px-3 py-1 rounded-full border border-sky-500/30">{user.jobType}</span>
              )}
              {user.freelancerYn && (
                <span className="bg-sky-500/20 text-sky-400 text-xs px-3 py-1 rounded-full border border-sky-500/30">3.3% 적용</span>
              )}
            </div>
          )}
          <button className="w-full py-2.5 bg-sky-500 text-white text-sm font-semibold rounded-xl">
            프로필 편집
          </button>
        </div>

        <div className="px-4 py-5 space-y-5">

          {/* 수입/자산 카드 */}
          <div className="flex gap-3">
            <div className="flex-1 bg-white rounded-2xl p-4 border-2 border-sky-500">
              <p className="text-xs text-gray-400 mb-1">이번달 수입</p>
              <p className="text-base font-bold text-gray-900">-</p>
            </div>
            <div className="flex-1 bg-white rounded-2xl p-4 border-2 border-sky-500">
              <p className="text-xs text-gray-400 mb-1">총 자산</p>
              <p className="text-base font-bold text-gray-900">-</p>
            </div>
          </div>

          {/* 계정 관리 */}
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-2 px-1">계정 관리</p>
            <div className="bg-white rounded-2xl divide-y divide-gray-100">
              <button
                onClick={() => router.push('/mypage/accounts')}
                className="w-full flex items-center gap-3 px-4 py-4"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
                  <span className="text-lg">🏦</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">연동 계좌 관리</p>
                  <p className="text-xs text-gray-400">입금/월급/증권/비상금 통장 계좌 설정</p>
                </div>
                <ChevronRight size={18} className="text-sky-500" />
              </button>
              <button
                onClick={() => router.push('/mypage/pin')}
                className="w-full flex items-center gap-3 px-4 py-4"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
                  <span className="text-lg">🔒</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">PIN 변경</p>
                  <p className="text-xs text-gray-400">6자리 PIN 관리</p>
                </div>
                <ChevronRight size={18} className="text-sky-500" />
              </button>
              <div className="w-full flex items-center gap-3 px-4 py-4">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
                  <span className="text-lg">🔔</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">알림 설정</p>
                  <p className="text-xs text-gray-400">앱 push 알림 설정</p>
                </div>
                <button
                  onClick={handleAlarmToggle}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${alarmOn ? 'bg-sky-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                >
                  {alarmOn ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* 계정 관리 (재무) */}
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-2 px-1">계정 관리</p>
            <div className="bg-white rounded-2xl divide-y divide-gray-100">
              <button
                onClick={() => router.push('/mypage/virtual-salary')}
                className="w-full flex items-center gap-3 px-4 py-4"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
                  <span className="text-lg">💳</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">가상 월급 설정</p>
                  <p className="text-xs text-gray-400">목표 금액/이체일/분배 비율</p>
                </div>
                <ChevronRight size={18} className="text-sky-500" />
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-4">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
                  <span className="text-lg">📈</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">투자 성향 설정 변경</p>
                  <p className="text-xs text-gray-400">안정형/중립형/공격형</p>
                </div>
                <span className="text-xs text-sky-600 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full mr-1">1 / 2</span>
                <ChevronRight size={18} className="text-sky-500" />
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-4">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
                  <span className="text-lg">✨</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">AI 브리핑 설정</p>
                  <p className="text-xs text-gray-400">수신 시간/항목 설정</p>
                </div>
                <ChevronRight size={18} className="text-sky-500" />
              </button>
            </div>
          </div>

          {/* 고객 지원 */}
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-2 px-1">고객 지원</p>
            <div className="bg-white rounded-2xl divide-y divide-gray-100">
              {[
                { icon: '📢', label: '공지사항', sub: '' },
                { icon: '❓', label: 'FAQ', sub: '' },
                { icon: '💬', label: '1:1 문의', sub: '' },
                { icon: 'ℹ️', label: '앱 정보', sub: '버전 1.0.0' },
              ].map(({ icon, label, sub }) => (
                <button key={label} className="w-full flex items-center gap-3 px-4 py-4">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
                    <span className="text-lg">{icon}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    {sub && <p className="text-xs text-gray-400">{sub}</p>}
                  </div>
                  <ChevronRight size={18} className="text-sky-500" />
                </button>
              ))}
            </div>
          </div>

          {/* 기타 */}
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-2 px-1">기타</p>
            <div className="bg-white rounded-2xl divide-y divide-gray-100">
              <button className="w-full flex items-center gap-3 px-4 py-4">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
                  <span className="text-lg">🚪</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">로그아웃</p>
                </div>
                <ChevronRight size={18} className="text-sky-500" />
              </button>
              <button
                onClick={() => router.push('/mypage/withdraw')}
                className="w-full flex items-center gap-3 px-4 py-4"
              >
                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                  <span className="text-lg">🗑️</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-red-500">회원 탈퇴</p>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            </div>
          </div>

        </div>
      </div>

      <BottomNav />
    </div>
  );
}

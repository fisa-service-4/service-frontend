'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, ChevronRight, User,
  Landmark, KeyRound, Wallet, Sparkles,
  Megaphone, Info, LogOut, UserX,
} from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import { userApi } from '@/api/user';
import { tokenUtils } from '@/utils/token';
import { apiRequest } from '@/utils/apiClient';
import type { UserProfile } from '@/types/auth';

export default function MypageView() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [alarmOn, setAlarmOn] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

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

  async function handleLogoutConfirm() {
    setLogoutLoading(true);
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // 실패해도 로그아웃 처리
    } finally {
      tokenUtils.clearTokens();
      router.replace('/login');
    }
  }

  return (
    <div className="flex flex-col h-screen bg-bg">

      {/* 헤더 */}
      <div className="px-5 py-3 bg-bg shrink-0" />

      <div className="flex-1 overflow-y-auto">

        {/* 프로필 섹션 */}
        <div className="bg-bg-card px-5 pt-6 pb-6 flex flex-col items-center border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center mb-3">
            <User size={28} className="text-primary-500" />
          </div>
          <p className="text-gray-900 font-bold text-lg mb-0.5">{user?.userName ?? '-'}</p>
          <p className="text-gray-400 text-sm mb-3">{user?.email ?? '-'}</p>
          {user && (
            <div className="flex gap-2">
              {user.jobType && (
                <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">{user.jobType}</span>
              )}
              {user.freelancerYn && (
                <span className="bg-primary-50 text-primary-500 text-xs px-3 py-1 rounded-full border border-primary-100">3.3% 적용</span>
              )}
            </div>
          )}
        </div>

        <div className="px-4 py-5 space-y-5 bg-bg">

          {/* 계정 관리 */}
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-2 px-1">계정 관리</p>
            <div className="bg-white rounded-2xl divide-y divide-gray-100">
              <button
                onClick={() => router.push('/mypage/accounts')}
                className="w-full flex items-center gap-3 px-4 py-4"
              >
                <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                  <Landmark size={18} className="text-primary-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">연동 계좌 관리</p>
                  <p className="text-xs text-gray-400">입금/월급/증권/비상금 통장 계좌 설정</p>
                </div>
                <ChevronRight size={18} className="text-primary-500" />
              </button>
              <button
                onClick={() => router.push('/mypage/pin')}
                className="w-full flex items-center gap-3 px-4 py-4"
              >
                <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                  <KeyRound size={18} className="text-primary-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">PIN 변경</p>
                  <p className="text-xs text-gray-400">6자리 PIN 관리</p>
                </div>
                <ChevronRight size={18} className="text-primary-500" />
              </button>
              <div className="w-full flex items-center gap-3 px-4 py-4">
                <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                  <Bell size={18} className="text-primary-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">알림 설정</p>
                  <p className="text-xs text-gray-400">앱 push 알림 설정</p>
                </div>
                <button
                  onClick={handleAlarmToggle}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${alarmOn ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'}`}
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
                <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                  <Wallet size={18} className="text-primary-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">가상 월급 설정</p>
                  <p className="text-xs text-gray-400">목표 금액/이체일/분배 비율</p>
                </div>
                <ChevronRight size={18} className="text-primary-500" />
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-4">
                <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                  <Sparkles size={18} className="text-primary-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">AI 브리핑 설정</p>
                  <p className="text-xs text-gray-400">수신 시간/항목 설정</p>
                </div>
                <ChevronRight size={18} className="text-primary-500" />
              </button>
            </div>
          </div>

          {/* 고객 지원 */}
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-2 px-1">고객 지원</p>
            <div className="bg-white rounded-2xl divide-y divide-gray-100">
              <button
                onClick={() => router.push('/mypage/notice')}
                className="w-full flex items-center gap-3 px-4 py-4"
              >
                <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                  <Megaphone size={18} className="text-primary-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">공지사항</p>
                </div>
                <ChevronRight size={18} className="text-primary-500" />
              </button>
              <div className="w-full flex items-center gap-3 px-4 py-4">
                <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                  <Info size={18} className="text-primary-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">앱 정보</p>
                  <p className="text-xs text-gray-400">버전 1.0.0</p>
                </div>
              </div>
            </div>
          </div>

          {/* 기타 */}
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-2 px-1">기타</p>
            <div className="bg-white rounded-2xl divide-y divide-gray-100">
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center gap-3 px-4 py-4"
              >
                <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                  <LogOut size={18} className="text-primary-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">로그아웃</p>
                </div>
                <ChevronRight size={18} className="text-primary-500" />
              </button>
              <button
                onClick={() => router.push('/mypage/withdraw')}
                className="w-full flex items-center gap-3 px-4 py-4"
              >
                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                  <UserX size={18} className="text-red-400" />
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

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl px-6 py-6 mx-6 shadow-xl w-72">
            <p className="text-base font-semibold text-gray-900 mb-1 text-center">로그아웃</p>
            <p className="text-sm text-gray-500 text-center mb-5">로그아웃 하시겠습니까?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={logoutLoading}
                className="flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl"
              >
                아니오
              </button>
              <button
                onClick={handleLogoutConfirm}
                disabled={logoutLoading}
                className="flex-1 py-3 bg-primary-500 text-white text-sm font-semibold rounded-xl disabled:opacity-60"
              >
                {logoutLoading ? '처리 중...' : '네'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

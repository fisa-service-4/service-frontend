'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import type { MainNavItem } from '@/components/main/BottomNav';
import ContractRegisterView from '@/components/main/ContractRegisterView';

/* ── 캘린더 데이터 (2026년 5월 기준) ── */
// 5월 1일 = 목요일(4) → 앞에 일~수 4칸은 4월 말
const CALENDAR_ROWS = [
  [{ day: 27, prev: true }, { day: 28, prev: true }, { day: 29, prev: true }, { day: 30, prev: true }, { day: 1 }, { day: 2 }, { day: 3 }],
  [{ day: 4 }, { day: 5 }, { day: 6 }, { day: 7 }, { day: 8 }, { day: 9 }, { day: 10 }],
  [{ day: 11 }, { day: 12 }, { day: 13 }, { day: 14 }, { day: 15 }, { day: 16 }, { day: 17 }],
  [{ day: 18 }, { day: 19 }, { day: 20 }, { day: 21 }, { day: 22 }, { day: 23 }, { day: 24 }],
  [{ day: 25 }, { day: 26 }, { day: 27 }, { day: 28 }, { day: 29 }, { day: 30 }, { day: 31 }],
];

const TODAY = 26;

/* ── 계약 데이터 ── */
const CONTRACTS = [
  { id: 1, name: '-', date: '-', deduction: '-', status: '확정',  active: true  },
  { id: 2, name: '-', date: '-', deduction: '-', status: '입금중', active: false },
];

const STATUS_STYLE: Record<string, string> = {
  확정:  'bg-slate-100 text-slate-600',
  입금중: 'bg-amber-100 text-amber-600',
};

export default function HomePage() {
  const router                          = useRouter();
  const [activeNav, setActiveNav]       = useState<MainNavItem>('home');
  const [month, setMonth]               = useState(5);
  const [showRegister, setShowRegister] = useState(false);

  if (showRegister) {
    return (
      <ContractRegisterView
        onBack={() => setShowRegister(false)}
        onSubmit={() => setShowRegister(false)}
      />
    );
  }

  if (activeNav !== 'home') {
    const labels: Record<string, string> = { assets: '자산', stocks: '증권', mypage: '마이페이지' };
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">{labels[activeNav]} 준비 중</p>
        </div>
        <BottomNav activeNav={activeNav} onNavChange={setActiveNav} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white relative">

      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 shrink-0">
        <button>
          <Menu size={24} className="text-gray-800" />
        </button>
        <button className="px-4 py-1.5 bg-gray-200 rounded-full text-sm font-medium text-gray-700">
          알림
        </button>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto px-4 space-y-5 pb-4 relative">

        {/* 가상 월급 카드 */}
        <div className="bg-white border-2 border-sky-500 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-500">
              이번달 가상 월급{' '}
              <span className="text-gray-900 font-semibold">-</span>
            </span>
            <span className="bg-sky-50 text-sky-600 text-xs font-bold px-2.5 py-1 rounded-lg border border-sky-200">
              D - -
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-1">잔액</p>
          <p className="text-3xl font-bold text-gray-900 mb-5">-</p>

          {/* 프로그레스 바 */}
          <div className="relative mb-4">
            <div className="w-full h-2 bg-sky-100 rounded-full" />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>월급 D-DAY</span>
            <span>-</span>
          </div>
        </div>

        {/* 실수령액 캘린더 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">실수령액 캘린더</h2>
            <button
              onClick={() => setShowRegister(true)}
              className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg"
            >
              + 등록
            </button>
          </div>

          <div className="bg-white border-2 border-sky-500 rounded-2xl p-4">
            {/* 월 네비게이션 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMonth((m) => m - 1)}
                  className="w-7 h-7 bg-sky-50 border border-sky-200 rounded-full flex items-center justify-center text-sky-600"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-base font-bold text-gray-900">{month}월</span>
                <button
                  onClick={() => setMonth((m) => m + 1)}
                  className="w-7 h-7 bg-sky-50 border border-sky-200 rounded-full flex items-center justify-center text-sky-600"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
              <button className="text-xs bg-sky-50 text-sky-600 border border-sky-200 px-3 py-1.5 rounded-lg">
                계약 리스트
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 mb-2">
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                <p
                  key={d}
                  className={`text-center text-xs font-medium ${
                    i === 0 ? 'text-red-400' : i === 6 ? 'text-sky-500' : 'text-gray-400'
                  }`}
                >
                  {d}
                </p>
              ))}
            </div>

            {/* 날짜 그리드 */}
            {CALENDAR_ROWS.map((row, ri) => (
              <div key={ri} className="grid grid-cols-7 mb-0.5">
                {row.map((cell, ci) => {
                  const isPrev  = !!cell.prev;
                  const isToday = !isPrev && cell.day === TODAY;
                  const isSun   = ci === 0;
                  const isSat   = ci === 6;

                  return (
                    <div key={ci} className="flex flex-col items-center py-0.5">
                      <div
                        className={`w-8 h-8 flex items-center justify-center text-sm rounded-full
                          ${isPrev   ? 'text-gray-300' : ''}
                          ${isToday  ? 'bg-sky-500 text-white font-bold' : ''}
                          ${!isPrev && !isToday
                            ? isSun ? 'text-red-400' : isSat ? 'text-sky-500' : 'text-gray-800'
                            : ''}
                        `}
                      >
                        {cell.day}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* 범례 */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-sky-500" />
                <span className="text-xs text-gray-400">가상 월급</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-sky-200" />
                <span className="text-xs text-gray-400">입금 예정</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center shrink-0">
                  <span className="text-[9px] text-white font-bold">26</span>
                </div>
                <span className="text-xs text-gray-400">오늘</span>
              </div>
            </div>
          </div>
        </div>

        {/* 이번달 받을 돈 */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3">이번달 받을 돈</h2>
          <div className="space-y-3">
            {CONTRACTS.map((c) => (
              <div
                key={c.id}
                className={`rounded-2xl p-4 border-2 bg-white ${
                  c.active ? 'border-sky-500' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 ${
                        c.active ? 'bg-sky-500' : 'bg-gray-400'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.date} · {c.deduction}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 mb-1">-</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${STATUS_STYLE[c.status]}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* AI 상담사 플로팅 버튼 */}
      <button onClick={() => router.push('/chat')} className="absolute bottom-20 right-5 z-10 flex flex-col items-center drop-shadow-xl">
        {/* 헤드셋 */}
        <div className="relative w-9 h-4 mb-[-3px]">
          {/* 헤드밴드 */}
          <div className="absolute inset-x-1 top-0 h-3 border-t-[2px] border-l-[2px] border-r-[2px] border-sky-400 rounded-t-full" />
          {/* 왼쪽 귀걸이 */}
          <div className="absolute left-0 top-2 w-1.5 h-2 bg-sky-400 rounded-sm" />
          {/* 오른쪽 귀걸이 */}
          <div className="absolute right-0 top-2 w-1.5 h-2 bg-sky-400 rounded-sm" />
        </div>

        {/* 얼굴 */}
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex flex-col items-center justify-center shadow-lg">
          {/* 눈 */}
          <div className="flex gap-2 mb-1">
            <div className="w-1 h-1.5 bg-white rounded-full" />
            <div className="w-1 h-1.5 bg-white rounded-full" />
          </div>
          {/* 입 */}
          <div className="w-4 h-2 border-b-2 border-white rounded-b-full" />
        </div>

        {/* 마이크 붐 */}
        <div className="self-end mr-1 mt-[-5px] flex items-center gap-0.5">
          <div className="w-3 h-[2px] bg-sky-400 rounded-full" />
          <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
        </div>
      </button>

      {/* 하단 탭 */}
      <BottomNav activeNav={activeNav} onNavChange={setActiveNav} />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import ContractRegisterView from '@/components/main/ContractRegisterView';
import NotificationPanel from '@/components/main/NotificationPanel';

type CalendarCell = { day: number; prev?: boolean; next?: boolean };

function buildCalendarRows(year: number, month: number): CalendarCell[][] {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const cells: CalendarCell[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, prev: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d });
  }
  let next = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: next++, next: true });
  }

  const rows: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

const _today = new Date();
const TODAY_DAY   = _today.getDate();
const TODAY_MONTH = _today.getMonth() + 1;
const TODAY_YEAR  = _today.getFullYear();

const CONTRACTS = [
  { id: 1, name: '-', date: '-', deduction: '-', status: '확정',  active: true  },
  { id: 2, name: '-', date: '-', deduction: '-', status: '입금중', active: false },
];

const STATUS_STYLE: Record<string, string> = {
  확정:  'bg-slate-100 text-slate-600',
  입금중: 'bg-amber-100 text-amber-600',
};

export default function HomePage() {
  const router                              = useRouter();
  const [year,  setYear]                    = useState(TODAY_YEAR);
  const [month, setMonth]                   = useState(TODAY_MONTH);
  const [showRegister, setShowRegister]     = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  if (showRegister) {
    return (
      <ContractRegisterView
        onBack={() => setShowRegister(false)}
        onSubmit={() => setShowRegister(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">

      {/* 콘텐츠 영역 (알림 오버레이 포함) */}
      <div className="flex-1 flex flex-col relative overflow-hidden">

      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 shrink-0">
        <button>
          <Menu size={24} className="text-gray-800" />
        </button>
        <button className="p-1" onClick={() => setShowNotification(true)}>
          <Bell size={22} className="text-gray-800" />
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
                  onClick={() => { if (month === 1) { setYear((y) => y - 1); setMonth(12); } else { setMonth((m) => m - 1); } }}
                  className="w-7 h-7 bg-sky-50 border border-sky-200 rounded-full flex items-center justify-center text-sky-600"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-base font-bold text-gray-900">{year}년 {month}월</span>
                <button
                  onClick={() => { if (month === 12) { setYear((y) => y + 1); setMonth(1); } else { setMonth((m) => m + 1); } }}
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
            {buildCalendarRows(year, month).map((row, ri) => (
              <div key={ri} className="grid grid-cols-7 mb-0.5">
                {row.map((cell: CalendarCell, ci: number) => {
                  const isPrev  = !!cell.prev;
                  const isNext  = !!cell.next;
                  const isToday = !isPrev && !isNext
                    && year === TODAY_YEAR && month === TODAY_MONTH && cell.day === TODAY_DAY;
                  const isSun   = ci === 0;
                  const isSat   = ci === 6;

                  return (
                    <div key={ci} className="flex flex-col items-center py-0.5">
                      <div
                        className={`w-8 h-8 flex items-center justify-center text-sm rounded-full
                          ${isPrev || isNext ? 'text-gray-300' : ''}
                          ${isToday  ? 'bg-sky-500 text-white font-bold' : ''}
                          ${!isPrev && !isNext && !isToday
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
                  <span className="text-[9px] text-white font-bold">{TODAY_DAY}</span>
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
        <div className="relative w-9 h-4 mb-[-3px]">
          <div className="absolute inset-x-1 top-0 h-3 border-t-[2px] border-l-[2px] border-r-[2px] border-sky-400 rounded-t-full" />
          <div className="absolute left-0 top-2 w-1.5 h-2 bg-sky-400 rounded-sm" />
          <div className="absolute right-0 top-2 w-1.5 h-2 bg-sky-400 rounded-sm" />
        </div>
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex flex-col items-center justify-center shadow-lg">
          <div className="flex gap-2 mb-1">
            <div className="w-1 h-1.5 bg-white rounded-full" />
            <div className="w-1 h-1.5 bg-white rounded-full" />
          </div>
          <div className="w-4 h-2 border-b-2 border-white rounded-b-full" />
        </div>
        <div className="self-end mr-1 mt-[-5px] flex items-center gap-0.5">
          <div className="w-3 h-[2px] bg-sky-400 rounded-full" />
          <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
        </div>
      </button>

      {/* 알림 패널 */}
      {showNotification && <NotificationPanel onClose={() => setShowNotification(false)} />}

      </div>{/* 콘텐츠 영역 끝 */}

      {/* 하단 탭 */}
      <BottomNav />
    </div>
  );
}

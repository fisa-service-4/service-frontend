'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import ContractRegisterView from '@/components/main/ContractRegisterView';
import NotificationPanel from '@/components/main/NotificationPanel';
import { getHomeSummary, getContracts } from '@/api/virtualSalary';
import type { HomeSummary, Contract, ContractStatus } from '@/types/virtualSalary';

type CalendarCell = { day: number; prev?: boolean; next?: boolean };

function buildCalendarRows(year: number, month: number): CalendarCell[][] {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const cells: CalendarCell[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrevMonth - i, prev: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  let next = 1;
  while (cells.length % 7 !== 0) cells.push({ day: next++, next: true });

  const rows: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

const _today = new Date();
const TODAY_DAY   = _today.getDate();
const TODAY_MONTH = _today.getMonth() + 1;
const TODAY_YEAR  = _today.getFullYear();

const fmt = (n: number) => `₩ ${n.toLocaleString()}`;

const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  PENDING:   '입금 예정',
  PAID:      '입금 완료',
  DELAYED:   '미입금',
  CANCELLED: '취소',
};

const CONTRACT_STATUS_STYLE: Record<ContractStatus, string> = {
  PENDING:   'bg-amber-100 text-amber-600',
  PAID:      'bg-sky-100 text-sky-600',
  DELAYED:   'bg-red-100 text-red-600',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const TAX_TYPE_LABEL: Record<string, string> = {
  BUSINESS: '사업소득 3.3%',
  ETC:      '기타소득 8.8%',
  ARTIST:   '예술인 8.8%',
};

export default function HomePage() {
  const [showNotification, setShowNotification] = useState(false);
  const router = useRouter();
  const [year,  setYear]  = useState(TODAY_YEAR);
  const [month, setMonth] = useState(TODAY_MONTH);
  const [showRegister, setShowRegister] = useState(false);

  const [summary, setSummary]                         = useState<HomeSummary | null>(null);
  const [loading, setLoading]                         = useState(true);
  const [error, setError]                             = useState<string | null>(null);
  const [refreshKey, setRefreshKey]                   = useState(0);
  const [otherMonthContracts, setOtherMonthContracts] = useState<Contract[]>([]);

  // 홈 통합 데이터 조회 — setState는 모두 콜백 안에서만 호출
  useEffect(() => {
    let cancelled = false;
    getHomeSummary()
      .then(data  => { if (!cancelled) { setSummary(data); setError(null); } })
      .catch(err  => { if (!cancelled) setError(err instanceof Error ? err.message : '데이터를 불러오는 데 실패했습니다.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  // 계약 등록 후 또는 수동 새로고침 시 호출 (이벤트 핸들러에서만 사용)
  const refetch = () => { setLoading(true); setRefreshKey(k => k + 1); };

  // 다른 달 이동 시 해당 달 계약 조회
  useEffect(() => {
    if (year === TODAY_YEAR && month === TODAY_MONTH) return;
    let cancelled = false;
    const date = `${year}-${String(month).padStart(2, '0')}-01`;
    getContracts({ date })
      .then(data => { if (!cancelled) setOtherMonthContracts(data); })
      .catch(()  => { if (!cancelled) setOtherMonthContracts([]); });
    return () => { cancelled = true; };
  }, [year, month]);

  // 캘린더 입금 예정 마커 집합
  const incomeMarkers = useMemo((): Set<number> => {
    if (year === TODAY_YEAR && month === TODAY_MONTH) {
      if (!summary) return new Set();
      return new Set(summary.calendarData.map(e => parseInt(e.date.split('-')[2], 10)));
    }
    return new Set(
      otherMonthContracts
        .filter(c => c.contractStatus !== 'CANCELLED')
        .map(c => parseInt(c.expectedPaymentDate.split('-')[2], 10)),
    );
  }, [year, month, summary, otherMonthContracts]);

  // 가상월급 지급일 마커 (dday 역산)
  const paydayMarker = useMemo((): number | null => {
    if (!summary) return null;
    const paydayDate = new Date(_today);
    paydayDate.setDate(_today.getDate() + summary.dashboard.dday);
    if (paydayDate.getFullYear() === year && paydayDate.getMonth() + 1 === month) {
      return paydayDate.getDate();
    }
    return null;
  }, [summary, year, month]);

  const { dashboard } = summary ?? {};
  const dday = dashboard?.dday ?? null;
  const ddayLabel = dday === null ? '-' : dday === 0 ? 'D-DAY' : `D-${dday}`;

  if (showRegister) {
    return (
      <ContractRegisterView
        onBack={() => setShowRegister(false)}
        onSubmit={() => { setShowRegister(false); refetch(); }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="flex-1 flex flex-col relative overflow-hidden">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0">
          <button><Menu size={24} className="text-gray-800" /></button>
          <button className="p-1" onClick={() => setShowNotification(true)}>
            <Bell size={22} className="text-gray-800" />
          </button>
        </div>

        {/* 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto px-4 space-y-5 pb-4 relative">

          {/* 에러 배너 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* 가상 월급 카드 */}
          <div className="bg-white border-2 border-sky-500 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">
                이번달 가상 월급{' '}
                <span className="text-gray-900 font-semibold">
                  {loading || !dashboard ? '-' : fmt(dashboard.targetSalary)}
                </span>
              </span>
              <span className="bg-sky-50 text-sky-600 text-xs font-bold px-2.5 py-1 rounded-lg border border-sky-200">
                {loading ? 'D--' : ddayLabel}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-1">잔액</p>
            <p className="text-3xl font-bold text-gray-900 mb-5">
              {loading || !dashboard ? '-' : fmt(dashboard.currentBalance)}
            </p>

            {/* 프로그레스 바 */}
            <div className="w-full h-2 bg-sky-100 rounded-full mb-4">
              <div
                className="h-2 bg-sky-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(dashboard?.progressRate ?? 0, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>월급 D-DAY</span>
              <span>{loading ? '-' : ddayLabel}</span>
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
                    onClick={() => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else { setMonth(m => m - 1); } }}
                    className="w-7 h-7 bg-sky-50 border border-sky-200 rounded-full flex items-center justify-center text-sky-600"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-base font-bold text-gray-900">{year}년 {month}월</span>
                  <button
                    onClick={() => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else { setMonth(m => m + 1); } }}
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
                  <p key={d} className={`text-center text-xs font-medium ${i === 0 ? 'text-red-400' : i === 6 ? 'text-sky-500' : 'text-gray-400'}`}>
                    {d}
                  </p>
                ))}
              </div>

              {/* 날짜 그리드 */}
              {buildCalendarRows(year, month).map((row, ri) => (
                <div key={ri} className="grid grid-cols-7 mb-0.5">
                  {row.map((cell: CalendarCell, ci: number) => {
                    const isPrev   = !!cell.prev;
                    const isNext   = !!cell.next;
                    const isToday  = !isPrev && !isNext && year === TODAY_YEAR && month === TODAY_MONTH && cell.day === TODAY_DAY;
                    const isSun    = ci === 0;
                    const isSat    = ci === 6;
                    const isPayday = !isPrev && !isNext && paydayMarker === cell.day;
                    const isIncome = !isPrev && !isNext && incomeMarkers.has(cell.day);

                    return (
                      <div key={ci} className="flex flex-col items-center py-0.5">
                        <div className={`w-8 h-8 flex items-center justify-center text-sm rounded-full
                          ${isPrev || isNext ? 'text-gray-300' : ''}
                          ${isToday ? 'bg-sky-500 text-white font-bold' : ''}
                          ${!isPrev && !isNext && !isToday
                            ? isSun ? 'text-red-400' : isSat ? 'text-sky-500' : 'text-gray-800'
                            : ''}
                        `}>
                          {cell.day}
                        </div>
                        {/* 마커 영역 — 높이 고정으로 레이아웃 안정 */}
                        <div className="h-1.5 flex justify-center mt-0.5">
                          {!isPrev && !isNext && (isPayday || isIncome) && (
                            <div className={`w-1.5 h-1.5 rounded-full ${isPayday ? 'bg-sky-500' : 'bg-sky-200'}`} />
                          )}
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
            {loading ? (
              <div className="text-sm text-gray-400 text-center py-6">불러오는 중...</div>
            ) : !summary?.contracts.length ? (
              <div className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-2xl">
                이번달 등록된 계약이 없어요
              </div>
            ) : (
              <div className="space-y-3">
                {summary.contracts.map((c: Contract) => {
                  const isActive = c.contractStatus === 'PENDING';
                  return (
                    <div
                      key={c.contractId}
                      className={`rounded-2xl p-4 border-2 bg-white ${isActive ? 'border-sky-500' : 'border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 ${isActive ? 'bg-sky-500' : 'bg-gray-400'}`} />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{c.clientName}</p>
                            <p className="text-xs text-gray-400">
                              {c.expectedPaymentDate} · {TAX_TYPE_LABEL[c.taxType] ?? c.taxType}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900 mb-1">
                            {c.settlement ? fmt(c.settlement.actualIncome) : '-'}
                          </p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${CONTRACT_STATUS_STYLE[c.contractStatus]}`}>
                            {CONTRACT_STATUS_LABEL[c.contractStatus]}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* AI 상담사 플로팅 버튼 */}
        <button onClick={() => router.push('/chat')} className="absolute bottom-20 right-5 z-10 flex flex-col items-center drop-shadow-xl">
          <div className="relative w-9 h-4 -mb-0.75">
            <div className="absolute inset-x-1 top-0 h-3 border-t-2 border-l-2 border-r-2 border-sky-400 rounded-t-full" />
            <div className="absolute left-0 top-2 w-1.5 h-2 bg-sky-400 rounded-sm" />
            <div className="absolute right-0 top-2 w-1.5 h-2 bg-sky-400 rounded-sm" />
          </div>
          <div className="w-11 h-11 rounded-full bg-linear-to-br from-sky-400 to-sky-600 flex flex-col items-center justify-center shadow-lg">
            <div className="flex gap-2 mb-1">
              <div className="w-1 h-1.5 bg-white rounded-full" />
              <div className="w-1 h-1.5 bg-white rounded-full" />
            </div>
            <div className="w-4 h-2 border-b-2 border-white rounded-b-full" />
          </div>
          <div className="self-end mr-1 -mt-1.25 flex items-center gap-0.5">
            <div className="w-3 h-0.5 bg-sky-400 rounded-full" />
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          </div>
        </button>

        {/* 알림 패널 */}
        {showNotification && <NotificationPanel onClose={() => setShowNotification(false)} />}

      </div>

      <BottomNav />
    </div>
  );
}

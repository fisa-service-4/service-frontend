'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getContracts } from '@/api/virtualSalary';
import type { CalendarEntry, Contract } from '@/types/virtualSalary';

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

interface Props {
  calendarData: CalendarEntry[];
  dday: number | null;
  onRegisterClick: () => void;
}

export default function IncomeCalendar({ calendarData, dday, onRegisterClick }: Props) {
  const router = useRouter();
  const [year,  setYear]  = useState(TODAY_YEAR);
  const [month, setMonth] = useState(TODAY_MONTH);
  const [otherMonthContracts, setOtherMonthContracts] = useState<Contract[]>([]);

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

  // 입금 예정 마커 집합
  const incomeMarkers = useMemo((): Set<number> => {
    if (year === TODAY_YEAR && month === TODAY_MONTH) {
      return new Set(calendarData.map(e => parseInt(e.date.split('-')[2], 10)));
    }
    return new Set(
      otherMonthContracts
        .filter(c => c.contractStatus !== 'CANCELLED')
        .map(c => parseInt(c.expectedPaymentDate.split('-')[2], 10)),
    );
  }, [year, month, calendarData, otherMonthContracts]);

  // 가상월급 지급일 마커 (dday 역산)
  const paydayMarker = useMemo((): number | null => {
    if (dday === null) return null;
    const paydayDate = new Date(_today);
    paydayDate.setDate(_today.getDate() + dday);
    if (paydayDate.getFullYear() === year && paydayDate.getMonth() + 1 === month) {
      return paydayDate.getDate();
    }
    return null;
  }, [dday, year, month]);

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else { setMonth(m => m - 1); } };
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else { setMonth(m => m + 1); } };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-900">실수령액 캘린더</h2>
        <button
          onClick={onRegisterClick}
          className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg"
        >
          + 등록
        </button>
      </div>

      <div className="bg-bg-card shadow-md rounded-2xl p-4">
        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={prevMonth}
              className="w-7 h-7 bg-sky-50 border border-sky-200 rounded-full flex items-center justify-center text-sky-600"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-base font-bold text-gray-900">{year}년 {month}월</span>
            <button
              onClick={nextMonth}
              className="w-7 h-7 bg-sky-50 border border-sky-200 rounded-full flex items-center justify-center text-sky-600"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <button
            onClick={() => router.push('/contracts')}
            className="text-xs bg-sky-50 text-sky-600 border border-sky-200 px-3 py-1.5 rounded-lg"
          >
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
  );
}

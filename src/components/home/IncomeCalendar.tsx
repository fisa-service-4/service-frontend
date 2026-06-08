"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getContracts } from "@/api/virtualSalary";
import type { CalendarEntry, Contract } from "@/types/virtualSalary";

type CalendarCell = { day: number; prev?: boolean; next?: boolean };

function buildCalendarRows(year: number, month: number): CalendarCell[][] {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const cells: CalendarCell[] = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: daysInPrevMonth - i, prev: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  let next = 1;
  while (cells.length % 7 !== 0) cells.push({ day: next++, next: true });

  const rows: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

const _today = new Date();
const TODAY_DAY = _today.getDate();
const TODAY_MONTH = _today.getMonth() + 1;
const TODAY_YEAR = _today.getFullYear();

function getContractBadge(c: Contract): { label: string; style: string } {
  if (c.contractStatus === "PAID")
    return { label: "입금 완료", style: "bg-gray-100 text-gray-500" };
  if (c.contractStatus === "CANCELLED")
    return { label: "취소", style: "bg-gray-100 text-gray-400" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pay = new Date(c.expectedPaymentDate);
  pay.setHours(0, 0, 0, 0);
  const tbcStart = new Date(pay);
  tbcStart.setDate(pay.getDate() - 2);
  const tbcEnd = new Date(pay);
  tbcEnd.setDate(pay.getDate() + 2);

  if (today > tbcEnd)
    return { label: "실패", style: "bg-red-100 text-red-600" };
  if (today >= tbcStart)
    return { label: "확인 중", style: "bg-amber-100 text-amber-600" };
  if (c.contractStatus === "DELAYED")
    return { label: "실패", style: "bg-red-100 text-red-600" };
  return { label: "입금 전", style: "bg-primary-100 text-primary-700" };
}

const fmt = (n: number | undefined | null) =>
  n != null ? n.toLocaleString() + " 원" : "-";

interface Props {
  calendarData: CalendarEntry[];
  contracts: Contract[];
  dday: number | null;
  onRegisterClick: () => void;
}

export default function IncomeCalendar({
  calendarData,
  contracts,
  dday,
  onRegisterClick,
}: Props) {
  const router = useRouter();
  const [year, setYear] = useState(TODAY_YEAR);
  const [month, setMonth] = useState(TODAY_MONTH);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [otherMonthContracts, setOtherMonthContracts] = useState<Contract[]>(
    [],
  );

  useEffect(() => {
    if (year === TODAY_YEAR && month === TODAY_MONTH) return;
    let cancelled = false;
    const date = `${year}-${String(month).padStart(2, "0")}-01`;
    getContracts({ date })
      .then((data) => {
        if (!cancelled) setOtherMonthContracts(data);
      })
      .catch(() => {
        if (!cancelled) setOtherMonthContracts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [year, month]);

  const currentContracts =
    year === TODAY_YEAR && month === TODAY_MONTH
      ? contracts
      : otherMonthContracts;

  const incomeMarkers = useMemo((): Set<number> => {
    if (year === TODAY_YEAR && month === TODAY_MONTH) {
      return new Set(
        calendarData.map((e) => parseInt(e.date.split("-")[2], 10)),
      );
    }
    return new Set(
      otherMonthContracts
        .filter((c) => c.contractStatus !== "CANCELLED")
        .map((c) => parseInt(c.expectedPaymentDate.split("-")[2], 10)),
    );
  }, [year, month, calendarData, otherMonthContracts]);

  const paydayMarker = useMemo((): number | null => {
    if (dday === null) return null;
    const paydayDate = new Date(_today);
    paydayDate.setDate(_today.getDate() + dday);
    if (
      paydayDate.getFullYear() === year &&
      paydayDate.getMonth() + 1 === month
    ) {
      return paydayDate.getDate();
    }
    return null;
  }, [dday, year, month]);

  const filteredContracts = useMemo(() => {
    const byDate = (a: Contract, b: Contract) =>
      a.expectedPaymentDate.localeCompare(b.expectedPaymentDate);
    if (selectedDay === null) return [...currentContracts].sort(byDate);
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${year}-${pad(month)}-${pad(selectedDay)}`;
    return currentContracts
      .filter((c) => c.expectedPaymentDate === dateStr)
      .sort(byDate);
  }, [selectedDay, currentContracts, year, month]);

  const prevMonth = () => {
    setSelectedDay(null);
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const nextMonth = () => {
    setSelectedDay(null);
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleDayClick = (day: number) =>
    setSelectedDay((prev) => (prev === day ? null : day));

  const listTitle =
    selectedDay !== null
      ? `${month}월 ${selectedDay}일 계약`
      : `${month}월 계약 목록`;

  return (
    <div>
      {/* 섹션 헤더 — 제목 + 전체 보기 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-900">계약 캘린더</h2>
        <button
          onClick={() => router.push("/contracts")}
          className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg"
        >
          전체 보기
        </button>
      </div>

      <div className="bg-bg-card shadow-md rounded-2xl p-4">
        {/* 월 네비게이션 + 등록 버튼 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={prevMonth}
              className="w-7 h-7 bg-primary-50 border border-primary-100 rounded-full flex items-center justify-center text-primary-700"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-base font-bold text-gray-900 w-24 text-center">
              {year}년 {month}월
            </span>
            <button
              onClick={nextMonth}
              className="w-7 h-7 bg-primary-50 border border-primary-100 rounded-full flex items-center justify-center text-primary-700"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <button
            onClick={onRegisterClick}
            className="w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center text-white text-lg leading-none"
          >
            +
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
            <p
              key={d}
              className={`text-center text-xs font-medium ${i === 0 ? "text-red-400" : i === 6 ? "text-primary-500" : "text-gray-400"}`}
            >
              {d}
            </p>
          ))}
        </div>

        {/* 날짜 그리드 */}
        {buildCalendarRows(year, month).map((row, ri) => (
          <div key={ri} className="grid grid-cols-7 mb-0.5">
            {row.map((cell: CalendarCell, ci: number) => {
              const isPrev = !!cell.prev;
              const isNext = !!cell.next;
              const isToday =
                !isPrev &&
                !isNext &&
                year === TODAY_YEAR &&
                month === TODAY_MONTH &&
                cell.day === TODAY_DAY;
              const isSun = ci === 0;
              const isSat = ci === 6;
              const isPayday = !isPrev && !isNext && paydayMarker === cell.day;
              const isIncome =
                !isPrev && !isNext && incomeMarkers.has(cell.day);
              const isSelected = !isPrev && !isNext && selectedDay === cell.day;

              return (
                <div
                  key={ci}
                  className={`flex flex-col items-center py-0.5 ${!isPrev && !isNext ? "cursor-pointer" : ""}`}
                  onClick={() => {
                    if (!isPrev && !isNext) handleDayClick(cell.day);
                  }}
                >
                  <div
                    className={`w-8 h-8 flex items-center justify-center text-sm rounded-full
                    ${isPrev || isNext ? "text-gray-300" : ""}
                    ${isToday ? "bg-primary-500 text-white font-bold" : ""}
                    ${isSelected && !isToday ? "bg-primary-100 text-primary-700 font-bold ring-2 ring-primary-500" : ""}
                    ${
                      !isPrev && !isNext && !isToday && !isSelected
                        ? isSun
                          ? "text-red-400"
                          : isSat
                            ? "text-primary-500"
                            : "text-gray-800"
                        : ""
                    }
                  `}
                  >
                    {cell.day}
                  </div>
                  <div className="h-2 flex justify-center items-center gap-0.5 mt-0.5">
                    {!isPrev && !isNext && isPayday && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-700" />
                    )}
                    {!isPrev && !isNext && isIncome && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
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
            <div className="w-2 h-2 rounded-full bg-primary-700" />
            <span className="text-xs text-gray-400">가상 월급</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary-500" />
            <span className="text-xs text-gray-400">입금 예정</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
              <span className="text-[9px] text-white font-bold">
                {TODAY_DAY}
              </span>
            </div>
            <span className="text-xs text-gray-400">오늘</span>
          </div>
        </div>

        {/* 캘린더 하단 계약 리스트 */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-900">{listTitle}</h3>
            {selectedDay !== null && (
              <button
                onClick={() => setSelectedDay(null)}
                className="text-xs text-primary-500"
              >
                전체 보기
              </button>
            )}
          </div>

          {filteredContracts.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">
              {selectedDay !== null
                ? "해당 날짜에 계약이 없어요"
                : "등록된 계약이 없어요"}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredContracts.map((c) => (
                <li
                  key={c.contractId}
                  className="flex items-center justify-between py-2.5 cursor-pointer"
                  onClick={() => router.push(`/contracts/${c.contractId}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {c.clientName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {c.expectedPaymentDate}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-gray-800">
                      {c.contractStatus === "PAID"
                        ? fmt(
                            c.settlement?.actualIncome ??
                              c.actualIncome ??
                              c.contractAmount,
                          )
                        : c.contractStatus === "DELAYED" ||
                            (new Date().setHours(0, 0, 0, 0) >
                              new Date(c.expectedPaymentDate).setHours(
                                0,
                                0,
                                0,
                                0,
                              ) +
                                2 * 86_400_000)
                          ? "-"
                          : fmt(
                              c.settlement?.actualIncome ??
                                c.actualIncome ??
                                c.contractAmount,
                            )}
                    </p>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${getContractBadge(c).style}`}
                    >
                      {getContractBadge(c).label}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

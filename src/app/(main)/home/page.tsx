"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/main/BottomNav";
import ContractRegisterView from "@/components/main/ContractRegisterView";
import VirtualSalaryCard from "@/components/home/VirtualSalaryCard";
import IncomeCalendar from "@/components/home/IncomeCalendar";
import { getHomeSummary } from "@/api/virtualSalary";
import type { HomeSummary } from "@/types/virtualSalary";

export default function HomePage() {
  const router = useRouter();
  const [showRegister, setShowRegister] = useState(false);

  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getHomeSummary()
      .then((data) => {
        if (!cancelled) {
          setSummary(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error
              ? err.message
              : "데이터를 불러올 수 없습니다.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const refetch = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  };

  if (showRegister) {
    return (
      <ContractRegisterView
        onBack={() => setShowRegister(false)}
        onSubmit={() => {
          setShowRegister(false);
          refetch();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-bg">
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* 헤더 */}
        <div className="px-5 py-3 bg-bg shrink-0" />

        {/* 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-5 pb-4 relative">
          {/* 오류 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* 카드 클릭 시 가상월급 설정으로 이동 */}
          <div
            onClick={() => router.push("/mypage/virtual-salary")}
            className="cursor-pointer"
          >
            <VirtualSalaryCard
              dashboard={summary?.dashboard}
              loading={loading}
            />
          </div>

          <IncomeCalendar
            calendarData={summary?.calendarData ?? []}
            contracts={summary?.contracts ?? []}
            dday={summary?.dashboard.dday ?? null}
            onRegisterClick={() => setShowRegister(true)}
          />
        </div>

        {/* AI 챗봇 플로팅 버튼 */}
        <button
          onClick={() => router.push("/chat")}
          className="absolute bottom-6 right-5 z-10 flex flex-col items-center drop-shadow-xl"
        >
          <div className="relative w-9 h-4 -mb-0.75">
            <div className="absolute inset-x-1 top-0 h-3 border-t-2 border-l-2 border-r-2 border-primary-300 rounded-t-full" />
            <div className="absolute left-0 top-2 w-1.5 h-2 bg-primary-300 rounded-sm" />
            <div className="absolute right-0 top-2 w-1.5 h-2 bg-primary-300 rounded-sm" />
          </div>
          <div className="w-11 h-11 rounded-full bg-linear-to-br from-primary-300 to-primary-700 flex flex-col items-center justify-center shadow-lg">
            <div className="flex gap-2 mb-1">
              <div className="w-1 h-1.5 bg-white rounded-full" />
              <div className="w-1 h-1.5 bg-white rounded-full" />
            </div>
            <div className="w-4 h-2 border-b-2 border-white rounded-b-full" />
          </div>
          <div className="self-end mr-1 -mt-1.25 flex items-center gap-0.5">
            <div className="w-3 h-0.5 bg-primary-300 rounded-full" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary-300" />
          </div>
        </button>

      </div>

      <BottomNav />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
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
            err instanceof Error ? err.message : "데이터를 불러올 수 없습니다.",
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
          className="absolute bottom-6 right-5 z-10 animate-float"
          aria-label="AI 챗봇 열기"
        >
          <div className="relative">
            <svg
              viewBox="0 0 200 200"
              width="68"
              height="68"
              xmlns="http://www.w3.org/2000/svg"
              style={{ filter: 'drop-shadow(0 6px 18px rgba(27,133,255,0.45))' }}
            >
              <defs>
                <linearGradient id="faceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c2deff" />
                  <stop offset="100%" stopColor="#a8cfff" />
                </linearGradient>
              </defs>
              <rect x="96" y="34" width="8" height="18" rx="4" fill="#81c7ff" />
              <circle cx="100" cy="30" r="7" fill="#1b85ff" />
              <circle cx="100" cy="30" r="3.5" fill="white" fillOpacity="0.9" />
              <rect x="40" y="52" width="120" height="100" rx="20" ry="20" fill="url(#faceGrad)" stroke="#81c7ff" strokeWidth="2" />
              <rect x="30" y="80" width="12" height="22" rx="5" fill="#81c7ff" />
              <rect x="158" y="80" width="12" height="22" rx="5" fill="#81c7ff" />
              <rect x="60" y="74" width="30" height="22" rx="7" fill="#1b85ff" />
              <rect x="66" y="79" width="10" height="10" rx="3" fill="white" fillOpacity="0.9" />
              <rect x="110" y="74" width="30" height="22" rx="7" fill="#1b85ff" />
              <rect x="116" y="79" width="10" height="10" rx="3" fill="white" fillOpacity="0.9" />
              <path d="M74 114 Q100 132 126 114" stroke="#1b85ff" strokeWidth="4" strokeLinecap="round" fill="none" />
              <rect x="82" y="152" width="36" height="14" rx="6" fill="white" fillOpacity="0.25" />
            </svg>

            {/* 온라인 뱃지 */}
            <span className="absolute top-1 right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-success border-2 border-white" />
            </span>
          </div>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

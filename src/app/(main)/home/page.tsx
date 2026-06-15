"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bell } from "lucide-react";
import BottomNav from "@/components/main/BottomNav";
import ContractRegisterView from "@/components/main/ContractRegisterView";
import NotificationPanel from "@/components/main/NotificationPanel";
import VirtualSalaryCard from "@/components/home/VirtualSalaryCard";
import IncomeCalendar from "@/components/home/IncomeCalendar";
import { getHomeSummary } from "@/api/virtualSalary";
import type { HomeSummary } from "@/types/virtualSalary";

export default function HomePage() {
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(false);
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
        <div className="flex items-center justify-end px-5 py-3 bg-bg shrink-0">
          <button className="p-1" onClick={() => setShowNotification(true)}>
            <Bell size={22} className="text-gray-800" />
          </button>
        </div>

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
          className="absolute bottom-6 right-5 z-10 drop-shadow-xl animate-float"
        >
          <Image src="/chatbot_a4.svg" alt="AI 챗봇" width={64} height={64} />
        </button>

        {showNotification && (
          <NotificationPanel onClose={() => setShowNotification(false)} />
        )}
      </div>

      <BottomNav />
    </div>
  );
}

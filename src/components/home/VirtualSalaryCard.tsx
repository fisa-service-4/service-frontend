"use client";

import { useRouter } from "next/navigation";
import type { DashboardData } from "@/types/virtualSalary";

const fmt = (n: number) => `${n.toLocaleString()} 원`;

interface Props {
  dashboard: DashboardData | undefined;
  loading: boolean;
  showSettingButton?: boolean;
}

function getProgressColor(remaining: number): {
  bar: string;
  bg: string;
  text: string;
} {
  if (remaining >= 80)
    return {
      bar: "bg-primary-500",
      bg: "bg-primary-50",
      text: "text-primary-500",
    };
  if (remaining >= 30)
    return { bar: "bg-amber-600", bg: "bg-amber-50", text: "text-amber-600" };
  return { bar: "bg-red-600", bg: "bg-red-50", text: "text-red-600" };
}

export default function VirtualSalaryCard({
  dashboard,
  loading,
  showSettingButton = true,
}: Props) {
  const router = useRouter();
  const rawDday = dashboard?.dday ?? null;
  // 서버는 UTC 기준으로 dday를 계산하므로, KST와 UTC의 날짜 차이만큼 보정
  const dday = rawDday !== null
    ? (() => {
        const utcNow = new Date();
        const kstNow = new Date(Date.now() + 9 * 3600 * 1000);
        const utcMidnight = Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth(), utcNow.getUTCDate());
        const kstMidnight = Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate());
        const dayDiff = Math.round((kstMidnight - utcMidnight) / 86_400_000);
        return rawDday - dayDiff;
      })()
    : null;
  const ddayLabel = dday === null ? "-" : dday === 0 ? "D-DAY" : `D-${dday}`;
  const paydayOfMonth = dashboard?.payday ?? (dday !== null
    ? (() => {
        const kstNow = new Date(Date.now() + 9 * 3600 * 1000);
        const target = new Date(
          Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate() + dday)
        );
        return target.getUTCDate();
      })()
    : null);
  const remainingRate = dashboard
    ? Math.round(Math.max(0, 100 - (dashboard.progressRate ?? 0)))
    : 0;
  const progressColor = getProgressColor(remainingRate);

  return (
    <div className="bg-bg-card shadow-md rounded-2xl p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-700 font-semibold">
          월급일 /{" "}
          {loading ? "-" : paydayOfMonth ? `매월 ${paydayOfMonth}일` : "-"}
        </span>
        <span className="bg-primary-50 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-primary-100">
          {loading ? "D--" : ddayLabel}
        </span>
      </div>

      <p className="text-xs text-gray-400 mb-2">
        <span className="text-sm text-gray-700 font-semibold">잔액</span>{" "}
        <span className="text-gray-500">/</span>{" "}
        <span className="text-gray-500">
          가상 월급{" "}
          <span className="font-semibold text-gray-500">
            {loading || !dashboard ? "-" : fmt(dashboard.targetSalary)}
          </span>
        </span>
      </p>
      <div className="flex items-end justify-between mb-3">
        <p className="text-3xl font-bold text-gray-900">
          {loading || !dashboard ? "-" : fmt(dashboard.currentBalance)}
        </p>
        <span
          className={`text-[10px] font-semibold mb-1 ${progressColor.text}`}
        >
          잔여 {remainingRate}%
        </span>
      </div>

      {/* 잔액 진행 바 */}
      <div
        className={`w-full h-3 rounded-full overflow-hidden ${progressColor.bg}`}
      >
        <div
          className={`h-3 rounded-full transition-all duration-700 ${progressColor.bar}`}
          style={{
            width: `${
              !dashboard
                ? 0
                : Math.max(
                    2,
                    Math.min(100 - (dashboard.progressRate ?? 0), 100),
                  )
            }%`,
          }}
        />
      </div>

      {!loading && !dashboard && showSettingButton && (
        <button
          onClick={() => router.push("/mypage/virtual-salary")}
          className="mt-4 w-full py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-xl"
        >
          가상 월급 설정하기
        </button>
      )}
    </div>
  );
}

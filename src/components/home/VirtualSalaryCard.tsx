'use client';

import type { DashboardData } from '@/types/virtualSalary';

const fmt = (n: number) => `₩ ${n.toLocaleString()}`;

interface Props {
  dashboard: DashboardData | undefined;
  loading: boolean;
}

export default function VirtualSalaryCard({ dashboard, loading }: Props) {
  const dday = dashboard?.dday ?? null;
  const ddayLabel = dday === null ? '-' : dday === 0 ? 'D-DAY' : `D-${dday}`;

  return (
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
  );
}

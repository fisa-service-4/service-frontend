'use client';

import { useRouter } from 'next/navigation';
import type { DashboardData } from '@/types/virtualSalary';

const fmt = (n: number) => `${n.toLocaleString()} 원`;

interface Props {
  dashboard: DashboardData | undefined;
  loading: boolean;
  showSettingButton?: boolean;
}

export default function VirtualSalaryCard({ dashboard, loading, showSettingButton = true }: Props) {
  const router = useRouter();
  const dday = dashboard?.dday ?? null;
  const ddayLabel = dday === null ? '-' : dday === 0 ? 'D-DAY' : `D-${dday}`;
  // dday(남은 일수)로 실제 월급일 역산
  const paydayOfMonth = dday !== null
    ? new Date(Date.now() + dday * 86_400_000).getDate()
    : null;

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

      {/* 잔액 바: 컬러 = 남은 금액, 회색 = 사용한 금액 */}
      <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
        <div
          className="h-2 bg-sky-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100 - (dashboard?.progressRate ?? 0), 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>월급</span>
        <span>{loading ? '-' : paydayOfMonth ? `매월 ${paydayOfMonth}일` : '-'}</span>
      </div>

      {/* 설정 미완료 시 유도 버튼 */}
      {!loading && !dashboard && showSettingButton && (
        <button
          onClick={() => router.push('/mypage/virtual-salary')}
          className="mt-4 w-full py-2.5 bg-sky-500 text-white text-sm font-semibold rounded-xl"
        >
          가상 월급 설정하기
        </button>
      )}
    </div>
  );
}

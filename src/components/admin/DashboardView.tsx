'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Users, Zap, Activity, AlertTriangle } from 'lucide-react';
import { StatCard as StatCardType, ErrorLog, ApiStatus, AdminActivity } from '@/types/admin';
import StatCard from './StatCard';
import ErrorLogList from './ErrorLogList';
import ApiStatusList from './ApiStatusList';
import AdminActivityList from './AdminActivityList';
import { adminApiRequest } from '@/utils/apiClient';

const recentErrors: ErrorLog[]         = [];
const apiStatuses: ApiStatus[]         = [];
const adminActivities: AdminActivity[] = [];

interface PagedResponse {
  totalElements: number;
}

interface DashboardStats {
  todayAiRequests: number;
  todayApiCalls: number;
  todayErrors: number;
  avgApiResponseMs: number | null;
}

interface DashboardViewProps {
  selectedDate: string;
}

export default function DashboardView({ selectedDate }: DashboardViewProps) {
  const [totalUsers, setTotalUsers] = useState<string>('-');
  const [stats, setStats]           = useState<DashboardStats | null>(null);

  useEffect(() => {
    adminApiRequest<PagedResponse>('/admin/users?page=0&size=1')
      .then((data) => setTotalUsers(data.totalElements.toLocaleString()))
      .catch(() => {});

    adminApiRequest<DashboardStats>('/admin/monitoring/dashboard')
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  const statCards: StatCardType[] = [
    { title: '총 사용자 수', value: totalUsers,                                                                                    icon: <Users size={24} className="text-white" />,         gradient: 'from-sky-400 to-sky-500'    },
    { title: 'AI 호출 수',   value: '-',                                                                                           icon: <Zap size={24} className="text-white" />,           gradient: 'from-cyan-400 to-cyan-500'  },
    { title: 'API 응답속도', value: stats ? (stats.avgApiResponseMs != null ? `${stats.avgApiResponseMs}ms` : '-') : '-',          icon: <Activity size={24} className="text-white" />,      gradient: 'from-blue-400 to-blue-500'  },
    { title: '오류 수',      value: '-',                                                                                           icon: <AlertTriangle size={24} className="text-white" />, gradient: 'from-slate-400 to-slate-500'},
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-slate-50">
      <div className="px-5 pt-5 pb-3">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
            대시보드
          </h2>
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200">
            <span className="text-sm text-gray-700">{selectedDate}</span>
            <ChevronDown size={16} className="text-gray-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {statCards.map((card, index) => (
            <StatCard key={index} card={card} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <ErrorLogList errors={recentErrors} />
          <ApiStatusList statuses={apiStatuses} />
        </div>

        <AdminActivityList activities={adminActivities} />
      </div>
    </div>
  );
}

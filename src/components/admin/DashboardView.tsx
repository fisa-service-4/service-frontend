'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Users, Zap, Activity, AlertTriangle } from 'lucide-react';
import { StatCard as StatCardType, ErrorLog, ApiStatus, AdminActivity } from '@/types/admin';
import StatCard from './StatCard';
import ErrorLogList from './ErrorLogList';
import ApiStatusList from './ApiStatusList';
import AdminActivityList from './AdminActivityList';
import { adminApiRequest } from '@/utils/apiClient';

const recentErrors: ErrorLog[]         = [];
const apiStatuses: ApiStatus[]         = [];
const adminActivities: AdminActivity[] = [];

const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const DAY_NAMES   = ['일','월','화','수','목','금','토'];

interface PagedResponse {
  totalElements: number;
}

interface DashboardStats {
  todayAiRequests: number;
  todayApiCalls: number;
  todayErrors: number;
  avgApiResponseMs: number | null;
  activeSessionCount: number;
}

interface DashboardViewProps {
  selectedDate: string;
  onDateChange?: (date: string) => void;
}

export default function DashboardView({ selectedDate, onDateChange }: DashboardViewProps) {
  const [totalUsers, setTotalUsers]   = useState<string>('-');
  const [stats, setStats]             = useState<DashboardStats | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calYear, setCalYear]         = useState(() => new Date(selectedDate).getFullYear());
  const [calMonth, setCalMonth]       = useState(() => new Date(selectedDate).getMonth());
  const calendarRef                   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = () => {
      adminApiRequest<PagedResponse>('/admin/users?page=0&size=1')
        .then((data) => setTotalUsers(data.totalElements.toLocaleString()))
        .catch(() => {});

      adminApiRequest<DashboardStats>('/admin/monitoring/dashboard')
        .then((data) => setStats(data))
        .catch(() => {});
    };

    fetchData();
    const timer = setInterval(fetchData, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!showCalendar) return;
    function handleClickOutside(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const handleSelectDay = (day: number) => {
    const date = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateChange?.(date);
    setShowCalendar(false);
  };

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay    = new Date(calYear, calMonth, 1).getDay();
  const cells       = [...Array<null>(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const statCards: StatCardType[] = [
    { title: '총 사용자 수', value: totalUsers,                                                                           icon: <Users size={24} className="text-white" />,         gradient: 'from-sky-400 to-sky-500'    },
    { title: 'AI 호출 수',   value: stats ? stats.todayAiRequests.toLocaleString() : '-',                                icon: <Zap size={24} className="text-white" />,           gradient: 'from-cyan-400 to-cyan-500'  },
    { title: 'API 응답속도', value: stats ? (stats.avgApiResponseMs != null ? `${stats.avgApiResponseMs}ms` : '-') : '-', icon: <Activity size={24} className="text-white" />,      gradient: 'from-blue-400 to-blue-500'  },
    { title: '오류 수',      value: stats ? stats.todayErrors.toLocaleString() : '-',                                    icon: <AlertTriangle size={24} className="text-white" />, gradient: 'from-slate-400 to-slate-500'},
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-slate-50">
      <div className="px-5 pt-5 pb-3">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
            대시보드
          </h2>
          <div className="relative" ref={calendarRef}>
            <button
              onClick={() => setShowCalendar(v => !v)}
              className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200"
            >
              <span className="text-sm text-gray-700">{selectedDate}</span>
              <ChevronDown size={16} className="text-gray-500" />
            </button>

            {showCalendar && (
              <div className="absolute right-0 top-10 z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-64">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded">
                    <ChevronLeft size={16} className="text-gray-600" />
                  </button>
                  <span className="text-sm font-semibold text-gray-800">{calYear}년 {MONTH_NAMES[calMonth]}</span>
                  <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded">
                    <ChevronRight size={16} className="text-gray-600" />
                  </button>
                </div>
                <div className="grid grid-cols-7 mb-1">
                  {DAY_NAMES.map(d => (
                    <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                  {cells.map((day, i) => {
                    if (day === null) return <div key={i} />;
                    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSelected = dateStr === selectedDate;
                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectDay(day)}
                        className={`text-xs py-1 rounded-full transition-colors ${
                          isSelected ? 'bg-sky-500 text-white font-semibold' : 'text-gray-700 hover:bg-sky-50'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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

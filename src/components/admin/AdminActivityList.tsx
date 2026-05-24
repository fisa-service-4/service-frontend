import { ChevronRight } from 'lucide-react';
import { AdminActivity } from '@/types/admin';

interface AdminActivityListProps {
  activities: AdminActivity[];
}

export default function AdminActivityList({ activities }: AdminActivityListProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">최근 관리자 활동</h3>
        <button className="text-xs text-sky-600 flex items-center gap-1">
          더보기 <ChevronRight size={14} />
        </button>
      </div>
      {activities.length === 0 ? (
        <div className="flex items-center justify-center h-16 text-xs text-gray-400">데이터 없음</div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium text-gray-800 line-clamp-1">{activity.action}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">{activity.admin}</div>
                <div className="text-xs text-gray-500">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

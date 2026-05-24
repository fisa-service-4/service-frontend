import { ChevronRight } from 'lucide-react';
import { ApiStatus } from '@/types/admin';
import { getApiStatusColor } from '@/utils/admin';

interface ApiStatusListProps {
  statuses: ApiStatus[];
}

export default function ApiStatusList({ statuses }: ApiStatusListProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-sm">API 상태</h3>
        <button className="text-xs text-sky-600 flex items-center gap-1">
          더보기 <ChevronRight size={14} />
        </button>
      </div>
      {statuses.length === 0 ? (
        <div className="flex items-center justify-center h-16 text-xs text-gray-400">데이터 없음</div>
      ) : (
        <div className="space-y-2">
          {statuses.map((api) => (
            <div key={api.id} className={`${getApiStatusColor(api.status)} border rounded-lg p-2`}>
              <div className="text-xs text-gray-700 font-medium line-clamp-1 mb-1">{api.endpoint}</div>
              <div className="text-xs text-gray-500">{api.responseTime}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

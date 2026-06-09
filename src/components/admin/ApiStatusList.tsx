import { ChevronRight } from 'lucide-react';
import { ApiStatus } from '@/types/admin';

interface ApiStatusListProps {
  statuses: ApiStatus[];
  onShowDetail: () => void;
}

const STATUS_DOT: Record<string, string> = {
  online:  'text-emerald-500',
  offline: 'text-red-500',
};

export default function ApiStatusList({ statuses, onShowDetail }: ApiStatusListProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-sm">서비스 상태</h3>
        <button
          onClick={onShowDetail}
          className="text-xs text-sky-600 flex items-center gap-1"
        >
          더보기 <ChevronRight size={14} />
        </button>
      </div>
      {statuses.length === 0 ? (
        <div className="flex items-center justify-center h-16 text-xs text-gray-400">데이터 없음</div>
      ) : (
        <ul className="space-y-1.5">
          {statuses.slice(0, 5).map((api) => (
            <li key={api.id} className="flex items-center gap-1.5 text-xs text-gray-700">
              <span className={`${STATUS_DOT[api.status] ?? 'text-gray-400'} text-[9px] shrink-0`}>●</span>
              <span className="flex-1 truncate">{api.endpoint}</span>
              <span className={`shrink-0 font-semibold ${api.status === 'online' ? 'text-emerald-600' : 'text-red-500'}`}>
                {api.status === 'online' ? 'UP' : 'DOWN'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

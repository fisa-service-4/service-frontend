import { ChevronRight } from 'lucide-react';
import { ErrorLog } from '@/types/admin';
import { getSeverityColor } from '@/utils/admin';

interface ErrorLogListProps {
  errors: ErrorLog[];
}

export default function ErrorLogList({ errors }: ErrorLogListProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-sm">최근 오류</h3>
        <button className="text-xs text-sky-600 flex items-center gap-1">
          더보기 <ChevronRight size={14} />
        </button>
      </div>
      {errors.length === 0 ? (
        <div className="flex items-center justify-center h-16 text-xs text-gray-400">데이터 없음</div>
      ) : (
        <div className="space-y-2">
          {errors.map((error) => (
            <div key={error.id} className={`${getSeverityColor(error.severity)} border rounded-lg p-2`}>
              <div className="text-xs text-gray-700 line-clamp-1 mb-1">{error.message}</div>
              <div className="text-xs text-gray-500">{error.time}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { ChevronRight } from 'lucide-react';
import { ErrorLog } from '@/types/admin';

interface ErrorLogListProps {
  errors: ErrorLog[];
  onShowDetail?: () => void;
}

const LEVEL_DOT: Record<string, string> = {
  CRITICAL: 'text-red-500',
  ERROR:    'text-orange-500',
  WARN:     'text-amber-400',
  INFO:     'text-slate-400',
};

const LEVEL_TEXT: Record<string, string> = {
  CRITICAL: 'text-red-500',
  ERROR:    'text-orange-500',
  WARN:     'text-amber-500',
  INFO:     'text-slate-400',
};

export default function ErrorLogList({ errors, onShowDetail }: ErrorLogListProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-sm">최근 오류</h3>
        <button onClick={onShowDetail} className="text-xs text-sky-600 flex items-center gap-1">
          더보기 <ChevronRight size={14} />
        </button>
      </div>
      {errors.length === 0 ? (
        <div className="flex items-center justify-center h-16 text-xs text-gray-400">데이터 없음</div>
      ) : (
        <ul className="space-y-1.5">
          {errors.map((error) => (
            <li key={error.id} className="flex items-center gap-1.5 text-xs text-gray-700">
              <span className={`${LEVEL_DOT[error.errorLevel] ?? 'text-gray-400'} text-[9px] shrink-0`}>●</span>
              <span className="flex-1 truncate">
                {error.errorMessage.length > 10 ? `${error.errorMessage.slice(0, 10)}...` : error.errorMessage}
              </span>
              <span className={`shrink-0 font-semibold ${LEVEL_TEXT[error.errorLevel] ?? 'text-gray-400'}`}>
                {error.errorLevel}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

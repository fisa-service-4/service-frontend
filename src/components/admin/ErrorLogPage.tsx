'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { adminApiRequest } from '@/utils/apiClient';

type LevelFilter    = '전체' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
type ResolvedFilter = '전체' | '미해결' | '해결';

const LEVEL_FILTERS:    LevelFilter[]    = ['전체', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];
const RESOLVED_FILTERS: ResolvedFilter[] = ['전체', '미해결', '해결'];

const LEVEL_BADGE: Record<string, string> = {
  INFO:     'bg-blue-100 text-blue-700',
  WARN:     'bg-yellow-100 text-yellow-700',
  ERROR:    'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

interface ErrorLog {
  errorLogId:   number;
  serviceName:  string;
  errorLevel:   string;
  errorCode:    string;
  errorMessage: string;
  requestUri:   string;
  resolvedYn:   boolean;
  resolvedAt:   string | null;
  createdAt:    string;
}

interface PagedResponse {
  content:       ErrorLog[];
  page:          number;
  size:          number;
  totalElements: number;
  totalPages:    number;
}

interface Props {
  onBack: () => void;
}

const PAGE_SIZE = 15;

function formatDate(dateStr: string) {
  return dateStr.replace('T', ' ').substring(0, 16);
}

function getPageNumbers(current: number, total: number): number[] {
  const max  = 5;
  const half = Math.floor(max / 2);
  let start  = Math.max(0, current - half);
  let end    = start + max - 1;
  if (end >= total) { end = total - 1; start = Math.max(0, end - max + 1); }
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

export default function ErrorLogPage({ onBack }: Props) {
  const [levelFilter,    setLevelFilter]    = useState<LevelFilter>('전체');
  const [resolvedFilter, setResolvedFilter] = useState<ResolvedFilter>('전체');
  const [page,           setPage]           = useState(0);
  const [logs,           setLogs]           = useState<ErrorLog[]>([]);
  const [totalElements,  setTotalElements]  = useState(0);
  const [totalPages,     setTotalPages]     = useState(1);
  const [loading,        setLoading]        = useState(false);
  const [resolvingId,    setResolvingId]    = useState<number | null>(null);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE), sort: 'createdAt,desc' });
    if (levelFilter    !== '전체')  params.set('errorLevel', levelFilter);
    if (resolvedFilter === '미해결') params.set('resolvedYn', 'false');
    if (resolvedFilter === '해결')   params.set('resolvedYn', 'true');

    adminApiRequest<PagedResponse>(`/admin/logs/error?${params}`)
      .then((data) => {
        setLogs(data.content);
        setTotalElements(data.totalElements);
        setTotalPages(Math.max(1, data.totalPages));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [levelFilter, resolvedFilter, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleLevelFilter = (f: LevelFilter) => {
    setLevelFilter(f);
    setPage(0);
  };

  const handleResolvedFilter = (f: ResolvedFilter) => {
    setResolvedFilter(f);
    setPage(0);
  };

  const handleResolve = async (errorLogId: number) => {
    setResolvingId(errorLogId);
    try {
      await adminApiRequest(`/admin/logs/error/${errorLogId}`, {
        method: 'PATCH',
        body: JSON.stringify({ resolvedYn: true }),
      });
      fetchLogs();
    } catch {
      // silent
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white flex flex-col">

      {/* 타이틀 */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="text-slate-600 hover:text-slate-900 transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-900">시스템 오류 로그</h2>
        </div>
        <p className="text-sm text-gray-500 mt-0.5 pl-7">전체 {totalElements}건</p>
      </div>

      {/* errorLevel 필터 */}
      <div className="px-5 mb-2 flex gap-2 flex-wrap">
        {LEVEL_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => handleLevelFilter(f)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              levelFilter === f
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 해결 여부 필터 */}
      <div className="px-5 mb-4 flex gap-2">
        {RESOLVED_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => handleResolvedFilter(f)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              resolvedFilter === f
                ? 'bg-sky-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 로그 목록 */}
      <div className="flex-1 px-5">
        <div className="bg-slate-100 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">
              불러오는 중...
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">
              데이터 없음
            </div>
          ) : (
            logs.map((log, idx) => (
              <div key={log.errorLogId} className={log.resolvedYn ? 'opacity-50' : ''}>
                <div className="px-4 py-3">
                  {/* errorLevel 배지 · serviceName · 해결/해결됨 */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md shrink-0 ${LEVEL_BADGE[log.errorLevel] ?? 'bg-slate-200 text-slate-700'}`}>
                        {log.errorLevel}
                      </span>
                      <span className="text-sm font-semibold text-gray-700 truncate">{log.serviceName}</span>
                    </div>
                    {log.resolvedYn ? (
                      <span className="text-xs text-gray-400 font-medium shrink-0 ml-2">해결됨</span>
                    ) : (
                      <button
                        onClick={() => void handleResolve(log.errorLogId)}
                        disabled={resolvingId === log.errorLogId}
                        className="shrink-0 ml-2 text-xs font-semibold px-3 py-1 rounded-lg bg-slate-700 text-white disabled:opacity-40"
                      >
                        {resolvingId === log.errorLogId ? '처리 중...' : '해결'}
                      </button>
                    )}
                  </div>
                  {/* 에러 메시지 (최대 2줄) */}
                  <p className="text-sm text-gray-800 line-clamp-2 mb-1">{log.errorMessage}</p>
                  {/* requestUri · createdAt */}
                  <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
                    <span className="truncate">{log.requestUri}</span>
                    <span className="shrink-0">{formatDate(log.createdAt)}</span>
                  </div>
                </div>
                {idx < logs.length - 1 && <div className="mx-4 h-px bg-slate-200" />}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-center gap-1 py-5">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="p-1 text-gray-500 disabled:text-gray-300"
        >
          <ChevronLeft size={18} />
        </button>

        {getPageNumbers(page, totalPages).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
              p === page
                ? 'bg-slate-700 text-white'
                : 'text-gray-500 hover:bg-slate-100'
            }`}
          >
            {p + 1}
          </button>
        ))}

        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          className="p-1 text-gray-500 disabled:text-gray-300"
        >
          <ChevronRight size={18} />
        </button>
      </div>

    </div>
  );
}

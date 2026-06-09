'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { adminApiRequest } from '@/utils/apiClient';

interface ApiLog {
  apiLogId:     number;
  traceId:      string;
  serviceName:  string;
  apiName:      string;
  httpMethod:   string;
  responseCode: string;
  durationMs:   number;
  requestedAt:  string;
}

interface PagedResponse {
  content:       ApiLog[];
  page:          number;
  size:          number;
  totalElements: number;
  totalPages:    number;
}

interface Props {
  onBack: () => void;
}

const PAGE_SIZE = 15;

const METHOD_BADGE: Record<string, string> = {
  GET:    'bg-green-100 text-green-700',
  POST:   'bg-blue-100 text-blue-700',
  PATCH:  'bg-orange-100 text-orange-700',
  PUT:    'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700',
};

function getStatusBadge(code: string): string {
  const n = parseInt(code, 10);
  if (n >= 500) return 'bg-red-100 text-red-700';
  if (n >= 400) return 'bg-yellow-100 text-yellow-700';
  return 'bg-green-100 text-green-700';
}

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

export default function ApiCallLogView({ onBack }: Props) {
  const [page,          setPage]          = useState(0);
  const [logs,          setLogs]          = useState<ApiLog[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages,    setTotalPages]    = useState(1);
  const [loading,       setLoading]       = useState(false);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      size: String(PAGE_SIZE),
      sort: 'requestedAt,desc',
    });

    adminApiRequest<PagedResponse>(`/admin/logs/api?${params}`)
      .then((data) => {
        setLogs(data.content);
        setTotalElements(data.totalElements);
        setTotalPages(Math.max(1, data.totalPages));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="flex-1 overflow-y-auto bg-white flex flex-col">

      {/* 타이틀 */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="text-slate-600 hover:text-slate-900 transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-900">API 호출 이력</h2>
        </div>
        <p className="text-sm text-gray-500 mt-0.5 pl-7">전체 {totalElements.toLocaleString()}건</p>
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
              <div key={log.apiLogId}>
                <div className="px-4 py-3">
                  {/* 1행: 메서드 배지 · 응답코드 배지 · 응답시간 · 요청시각 */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md shrink-0 ${METHOD_BADGE[log.httpMethod] ?? 'bg-slate-200 text-slate-700'}`}>
                      {log.httpMethod}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md shrink-0 ${getStatusBadge(log.responseCode)}`}>
                      {log.responseCode}
                    </span>
                    <span className="text-xs text-gray-500 shrink-0">{log.durationMs}ms</span>
                    <span className="text-xs text-gray-400 ml-auto shrink-0">{formatDate(log.requestedAt)}</span>
                  </div>
                  {/* 2행: apiName (URI) */}
                  <p className="text-sm text-gray-800 truncate mb-0.5">{log.apiName}</p>
                  {/* 3행: serviceName */}
                  <p className="text-xs text-gray-400">{log.serviceName}</p>
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

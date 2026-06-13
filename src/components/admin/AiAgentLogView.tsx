'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { adminApiRequest } from '@/utils/apiClient';

type SessionType = 'CHAT' | 'TRANSFER' | 'STOCK' | 'ANALYSIS';
type FilterType  = '전체' | SessionType;

const FILTERS: FilterType[] = ['전체', 'CHAT', 'TRANSFER', 'STOCK', 'ANALYSIS'];

const SESSION_TYPE_STYLE: Record<SessionType, string> = {
  CHAT:     'bg-sky-100 text-sky-700',
  TRANSFER: 'bg-blue-100 text-blue-700',
  STOCK:    'bg-emerald-100 text-emerald-700',
  ANALYSIS: 'bg-purple-100 text-purple-700',
};

interface AiChatSession {
  sessionId:       number;
  userId:          number;
  sessionType:     string;
  lastUserMessage: string | null;
  updatedAt:       string;
}

interface PageResponse {
  content:       AiChatSession[];
  page:          number;
  size:          number;
  totalElements: number;
  totalPages:    number;
}

interface AiAgentLogViewProps {
  onBack: () => void;
}

const PAGE_SIZE = 20;

function formatDate(iso: string) {
  if (!iso) return '';
  const [datePart, timePart] = iso.split('T');
  return timePart ? `${datePart} ${timePart.substring(0, 5)}` : datePart;
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

export default function AiAgentLogView({ onBack }: AiAgentLogViewProps) {
  const [filter,        setFilter]        = useState<FilterType>('전체');
  const [page,          setPage]          = useState(0);
  const [sessions,      setSessions]      = useState<AiChatSession[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages,    setTotalPages]    = useState(1);
  const [loading,       setLoading]       = useState(false);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
    if (filter !== '전체') params.set('sessionType', filter);

    adminApiRequest<PageResponse>(`/admin/logs/ai?${params}`)
      .then((data) => {
        setSessions(data.content);
        setTotalElements(data.totalElements);
        setTotalPages(Math.max(1, data.totalPages));
      })
      .catch((err) => console.error('[AiAgentLogView]', err))
      .finally(() => setLoading(false));
  }, [filter, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    setPage(0);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white flex flex-col">

      {/* 타이틀 */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-slate-600 hover:text-slate-900 transition-colors shrink-0">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-900">AI 에이전트 로그</h2>
        </div>
        <p className="text-sm text-gray-500 mt-0.5 pl-7">전체 {totalElements.toLocaleString()}건</p>
      </div>

      {/* 필터 탭 */}
      <div className="px-5 mb-4 flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-slate-700 text-white'
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
          ) : sessions.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">
              데이터 없음
            </div>
          ) : (
            sessions.map((session, idx) => (
              <div key={session.sessionId}>
                <div className="px-4 py-4">
                  {/* 1행: 이름 */}
                  <p className="text-sm font-semibold text-gray-900 mb-1">사용자: {session.userId}</p>
                  {/* 2행: 세션 타입 배지 */}
                  {(() => {
                    const badge = (filter !== '전체' ? filter : session.sessionType) as SessionType;
                    return (
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-md font-medium mb-1 ${SESSION_TYPE_STYLE[badge] ?? 'bg-slate-200 text-slate-700'}`}>
                        {badge}
                      </span>
                    );
                  })()}
                  {/* 3행: 질문 내용 · 이메일 · 일시 */}
                  <div className="flex items-end justify-between gap-2">
                    <p className="text-xs text-gray-900 flex-1">
                      {session.lastUserMessage
                        ? session.lastUserMessage.length > 50
                          ? session.lastUserMessage.slice(0, 50) + '...'
                          : session.lastUserMessage
                        : ''}
                    </p>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className="text-xs text-gray-900">{formatDate(session.updatedAt)}</span>
                    </div>
                  </div>
                </div>
                {idx < sessions.length - 1 && <div className="mx-4 h-px bg-slate-200" />}
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
              p === page ? 'bg-slate-700 text-white' : 'text-gray-500 hover:bg-slate-100'
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

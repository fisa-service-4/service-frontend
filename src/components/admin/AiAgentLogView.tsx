'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

type IntentFilter = '전체' | '지출 분석' | '투자 조언' | '자산 요약';
type LogStatus    = '성공' | 'TIMEOUT' | '실패';

const FILTERS: IntentFilter[] = ['전체', '지출 분석', '투자 조언', '자산 요약'];

const STATUS_STYLE: Record<LogStatus, string> = {
  '성공':    'bg-green-500 text-white',
  'TIMEOUT': 'bg-red-400 text-white',
  '실패':    'bg-red-400 text-white',
};

const INTENT_STYLE: Record<string, string> = {
  '투자 조언': 'bg-sky-100 text-sky-700',
  '지출 분석': 'bg-purple-100 text-purple-700',
  '자산 요약': 'bg-amber-100 text-amber-700',
};

interface AiLog {
  id: number;
  userName: string;
  userId: string;
  intent: string;
  message: string;
  tokens: string;
  status: LogStatus;
  loggedAt: string;
}

const logs: AiLog[] = [
  { id: 1, userName: '-', userId: '-', intent: '투자 조언', message: '-', tokens: '-', status: '성공',   loggedAt: '-' },
  { id: 2, userName: '-', userId: '-', intent: '지출 분석', message: '-', tokens: '-', status: 'TIMEOUT', loggedAt: '-' },
];

const statCards = [
  { label: '총 질의'  },
  { label: '에러 응답' },
  { label: '평균 토큰' },
  { label: '오늘 누적' },
];

interface AiAgentLogViewProps {
  onBack: () => void;
}

export default function AiAgentLogView({ onBack }: AiAgentLogViewProps) {
  const [filter, setFilter] = useState<IntentFilter>('전체');
  const [page, setPage]     = useState(1);
  const totalPages          = 1;

  const filtered = logs.filter(
    (log) => filter === '전체' || log.intent === filter,
  );

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
        <p className="text-sm text-gray-500 mt-0.5 pl-7">전체 -건</p>
      </div>

      {/* 통계 카드 2×2 */}
      <div className="px-5 mb-4 grid grid-cols-2 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="bg-slate-100 rounded-2xl px-4 py-4">
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className="text-xl font-bold text-gray-900">-</p>
          </div>
        ))}
      </div>

      {/* 필터 탭 */}
      <div className="px-5 mb-4 flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
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
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">
              데이터 없음
            </div>
          ) : (
            filtered.map((log, idx) => (
              <div key={log.id}>
                <div className={`px-4 py-3 ${log.status !== '성공' ? 'bg-red-50' : ''}`}>
                  {/* 첫 번째 줄: 이름 · ID · 토큰 */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-gray-900">{log.userName}</span>
                      <span className="text-sm font-medium text-sky-500">{log.userId}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{log.tokens}tok</span>
                  </div>

                  {/* 두 번째 줄: 인텐트 배지 · 메시지 */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium shrink-0 ${INTENT_STYLE[log.intent] ?? 'bg-slate-200 text-slate-700'}`}>
                      {log.intent}
                    </span>
                    <span className="text-sm text-gray-700 truncate">{log.message}</span>
                  </div>

                  {/* 세 번째 줄: 상태 배지 · 날짜 */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${STATUS_STYLE[log.status]}`}>
                      {log.status}
                    </span>
                    <span className="text-xs text-gray-400">{log.loggedAt}</span>
                  </div>
                </div>
                {idx < filtered.length - 1 && <div className="mx-4 h-px bg-slate-200" />}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-center gap-1 py-5">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="p-1 text-gray-500 disabled:text-gray-300"
        >
          <ChevronLeft size={18} />
        </button>

        <button className="w-8 h-8 rounded-full text-sm font-medium bg-slate-700 text-white">
          1
        </button>

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="p-1 text-gray-500 disabled:text-gray-300"
        >
          <ChevronRight size={18} />
        </button>
      </div>

    </div>
  );
}

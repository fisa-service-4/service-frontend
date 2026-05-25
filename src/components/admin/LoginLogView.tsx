'use client';

import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

type FilterType = '전체' | '로그인' | '로그아웃' | '실패';

const FILTERS: FilterType[] = ['전체', '로그인', '로그아웃', '실패'];

const STATUS_STYLE: Record<string, string> = {
  로그인:  'bg-slate-200 text-slate-700',
  로그아웃: 'bg-slate-200 text-slate-700',
  실패:    'bg-slate-200 text-slate-700',
};

const RESULT_STYLE: Record<string, string> = {
  성공: 'bg-green-500 text-white',
  실패: 'bg-red-400 text-white',
};

interface LoginLog {
  id: number;
  userName: string;
  userId: string;
  loginType: '로그인' | '로그아웃' | '실패';
  result: '성공' | '실패';
  device: string;
  ip: string;
  loggedAt: string;
}

const mockLogs: LoginLog[] = [
  { id: 1, userName: '-', userId: '-', loginType: '로그인',  result: '성공', device: '-', ip: '-', loggedAt: '-' },
  { id: 2, userName: '-', userId: '-', loginType: '로그아웃', result: '성공', device: '-', ip: '-', loggedAt: '-' },
  { id: 3, userName: '-', userId: '-', loginType: '로그인',  result: '실패', device: '-', ip: '-', loggedAt: '-' },
];

interface LoginLogViewProps {
  onBack: () => void;
}

export default function LoginLogView({ onBack }: LoginLogViewProps) {
  const [filter, setFilter]   = useState<FilterType>('전체');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const totalPages            = 1;

  const filtered = mockLogs.filter((log) => {
    const matchFilter = filter === '전체' || log.loginType === filter || (filter === '실패' && log.result === '실패');
    const matchSearch = search === '' || log.userName.includes(search) || log.userId.includes(search);
    return matchFilter && matchSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-white flex flex-col">
      {/* 타이틀 */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-slate-600 hover:text-slate-900 transition-colors shrink-0">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-900">로그인 이력</h2>
        </div>
        <p className="text-sm text-gray-500 mt-0.5 pl-7">전체 -건</p>
      </div>

      {/* 검색바 */}
      <div className="px-5 mb-3">
        <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-3">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="이름 / 이메일 등 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
          />
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="px-5 mb-4 flex gap-2">
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
                <div className="px-4 py-3">
                  {/* 첫 번째 줄: 이름 · USER_ID · 결과 배지 */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-gray-900">{log.userName}</span>
                      <span className="text-sm font-medium text-sky-500">{log.userId}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${RESULT_STYLE[log.result]}`}>
                      {log.result}
                    </span>
                  </div>
                  {/* 두 번째 줄: 로그인 타입 배지 · 디바이스 */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-md ${STATUS_STYLE[log.loginType]}`}>
                      {log.loginType}
                    </span>
                    <span className="text-sm text-gray-700">{log.device}</span>
                  </div>
                  {/* 세 번째 줄: IP · 날짜 */}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{log.ip}</span>
                    <span>{log.loggedAt}</span>
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

        <button
          className="w-8 h-8 rounded-full text-sm font-medium bg-slate-700 text-white"
        >
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

      {/* 뒤로가기 (개발용 — 실제로는 BottomNav/사이드바로 이동) */}
      <button
        onClick={onBack}
        className="hidden"
        aria-label="back"
      />
    </div>
  );
}

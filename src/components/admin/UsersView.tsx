'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, UserCircle2 } from 'lucide-react';
import { adminApiRequest } from '@/utils/apiClient';
import UserDetailView from './UserDetailView';

type StatusFilter = '전체' | '활성' | '비활성';

const FILTERS: StatusFilter[] = ['전체', '활성', '비활성'];

const STATUS_STYLE: Record<string, string> = {
  활성:   'bg-green-500 text-white',
  비활성: 'bg-slate-400 text-white',
  정지:   'bg-red-400 text-white',
};

interface User {
  id: number;
  name: string;
  email: string;
  status: '활성' | '비활성' | '정지';
}

const users: User[] = [
  { id: 1, name: '-', email: '-', status: '활성'   },
  { id: 2, name: '-', email: '-', status: '비활성'  },
  { id: 3, name: '-', email: '-', status: '활성'   },
];

interface PagedResponse {
  totalElements: number;
}

const statCards = [
  { label: '전체 사용자' },
  { label: '활성 회원'   },
  { label: '정지 회원'   },
  { label: '오늘 신규'   },
];

export default function UsersView() {
  const [filter, setFilter]         = useState<StatusFilter>('전체');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [totalUsers, setTotalUsers] = useState<string>('-');
  const totalPages                  = 1;

  useEffect(() => {
    adminApiRequest<PagedResponse>('/admin/users?page=0&size=1')
      .then((data) => setTotalUsers(data.totalElements.toLocaleString()))
      .catch(() => {});
  }, []);

  if (selectedUser) {
    return <UserDetailView user={selectedUser} onBack={() => setSelectedUser(null)} />;
  }

  const filtered = users.filter((u) => {
    const matchFilter = filter === '전체' || u.status === filter;
    const matchSearch = search === '' || u.name.includes(search) || u.email.includes(search);
    return matchFilter && matchSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-white flex flex-col">

      {/* 통계 카드 2×2 */}
      <div className="px-5 pt-5 pb-4 grid grid-cols-2 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="bg-slate-100 rounded-2xl px-4 py-4">
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className="text-xl font-bold text-gray-900">
              {card.label === '전체 사용자' ? totalUsers : '-'}
            </p>
          </div>
        ))}
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

      {/* 사용자 목록 */}
      <div className="flex-1 px-5">
        <div className="bg-slate-100 rounded-2xl overflow-hidden">
          {/* 목록 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <span className="text-sm font-semibold text-gray-800">사용자 목록</span>
            <span className="text-xs text-gray-500">-/-</span>
          </div>

          {/* 목록 아이템 */}
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">
              데이터 없음
            </div>
          ) : (
            filtered.map((user, idx) => (
              <div key={user.id}>
                <button
                  onClick={() => setSelectedUser(user)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-200 transition-colors text-left"
                >
                  <UserCircle2 size={36} className="text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md shrink-0 ${STATUS_STYLE[user.status]}`}>
                    {user.status}
                  </span>
                  <ChevronRight size={18} className="text-gray-400 shrink-0" />
                </button>
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

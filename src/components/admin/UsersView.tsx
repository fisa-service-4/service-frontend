'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, UserCircle2 } from 'lucide-react';
import { adminApiRequest } from '@/utils/apiClient';
import UserDetailView from './UserDetailView';

type StatusFilter = '전체' | '활성' | '비활성';

const FILTERS: StatusFilter[] = ['전체', '활성', '비활성'];

const ONLINE_BADGE: Record<string, string> = {
  true:  'bg-green-500 text-white',
  false: 'bg-slate-400 text-white',
};

const ACCOUNT_STATUS_MAP: Record<string, '활성' | '비활성' | '정지'> = {
  ACTIVE:    '활성',
  INACTIVE:  '비활성',
  SUSPENDED: '정지',
  LOCKED:    '정지',
  WITHDRAW:  '비활성',
};

interface ApiUser {
  userId: number;
  name: string;
  email: string;
  jobType: string;
  freelancerYn: boolean;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  isOnline: boolean;
}

interface PagedUsersResponse {
  content: ApiUser[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

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
  const [filter, setFilter]                 = useState<StatusFilter>('전체');
  const [search, setSearch]                 = useState('');
  const [page, setPage]                     = useState(0);
  const [users, setUsers]                   = useState<ApiUser[]>([]);
  const [totalPages, setTotalPages]         = useState(1);
  const [selectedUser, setSelectedUser]     = useState<ApiUser | null>(null);
  const [totalUsers, setTotalUsers]         = useState<string>('-');
  const [activeSessions, setActiveSessions] = useState<string>('-');
  const [lockedUsers, setLockedUsers]       = useState<string>('-');

  useEffect(() => {
    const fetchStats = () => {
      adminApiRequest<PagedResponse>('/admin/users?page=0&size=1')
        .then((data) => setTotalUsers(data.totalElements.toLocaleString()))
        .catch(() => {});

      adminApiRequest<PagedResponse>('/admin/users?loginStatus=ONLINE&page=0&size=1')
        .then((data) => setActiveSessions(data.totalElements.toLocaleString()))
        .catch(() => {});

      adminApiRequest<PagedResponse>('/admin/users?status=LOCKED&page=0&size=1')
        .then((data) => setLockedUsers(data.totalElements.toLocaleString()))
        .catch(() => {});
    };

    fetchStats();
    const timer = setInterval(fetchStats, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loginStatus =
      filter === '활성'   ? 'ONLINE'  :
      filter === '비활성' ? 'OFFLINE' : undefined;

    const params = new URLSearchParams({ sort: 'name', page: String(page), size: '20' });
    if (loginStatus) params.set('loginStatus', loginStatus);
    if (search)      params.set('keyword', search);

    adminApiRequest<PagedUsersResponse>(`/admin/users?${params}`)
      .then((data) => {
        setUsers(data.content);
        setTotalPages(data.totalPages);
      })
      .catch(() => {});
  }, [filter, search, page]);

  const handleFilterChange = (f: StatusFilter) => {
    setFilter(f);
    setPage(0);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  if (selectedUser) {
    return (
      <UserDetailView
        user={{
          id: selectedUser.userId,
          name: selectedUser.name,
          email: selectedUser.email,
          status: ACCOUNT_STATUS_MAP[selectedUser.status] ?? '비활성',
          isOnline: selectedUser.isOnline,
        }}
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white flex flex-col">

      {/* 통계 카드 2×2 */}
      <div className="px-5 pt-5 pb-4 grid grid-cols-2 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="bg-slate-100 rounded-2xl px-4 py-4">
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className="text-xl font-bold text-gray-900">
              {card.label === '전체 사용자' ? totalUsers
               : card.label === '활성 회원'  ? activeSessions
               : card.label === '정지 회원'  ? lockedUsers
               : '-'}
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
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
          />
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="px-5 mb-4 flex gap-2">
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

      {/* 사용자 목록 */}
      <div className="flex-1 px-5">
        <div className="bg-slate-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <span className="text-sm font-semibold text-gray-800">사용자 목록</span>
            <span className="text-xs text-gray-500">{page + 1}/{totalPages}</span>
          </div>

          {users.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">
              데이터 없음
            </div>
          ) : (
            users.map((user, idx) => (
              <div key={user.userId}>
                <button
                  onClick={() => setSelectedUser(user)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-200 transition-colors text-left"
                >
                  <UserCircle2 size={36} className="text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md shrink-0 ${ONLINE_BADGE[String(user.isOnline)]}`}>
                    {user.isOnline ? '온라인' : '오프라인'}
                  </span>
                  <ChevronRight size={18} className="text-gray-400 shrink-0" />
                </button>
                {idx < users.length - 1 && <div className="mx-4 h-px bg-slate-200" />}
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

        <button className="w-8 h-8 rounded-full text-sm font-medium bg-slate-700 text-white">
          {page + 1}
        </button>

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

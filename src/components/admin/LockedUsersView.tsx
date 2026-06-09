'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, UserCircle2 } from 'lucide-react';
import { adminApiRequest } from '@/utils/apiClient';

interface ApiUser {
  userId: number;
  name: string;
  email: string;
  status: string;
}

interface PagedUsersResponse {
  content: ApiUser[];
}

interface Props {
  onBack: () => void;
}

export default function LockedUsersView({ onBack }: Props) {
  const [users, setUsers]               = useState<ApiUser[]>([]);
  const [loading, setLoading]           = useState(true);
  const [unsuspendingId, setUnsuspendingId] = useState<number | null>(null);
  const [showSuccess, setShowSuccess]   = useState(false);

  useEffect(() => {
    adminApiRequest<PagedUsersResponse>('/admin/users?status=LOCKED&page=0&size=100')
      .then((data) => setUsers(data.content))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const handleUnsuspend = async (userId: number) => {
    setUnsuspendingId(userId);
    try {
      await adminApiRequest(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setUsers((prev) => prev.filter((u) => u.userId !== userId));
      }, 1000);
    } catch {
      // silent
    } finally {
      setUnsuspendingId(null);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-white overflow-hidden">

      {/* 헤더 */}
      <div className="flex items-center px-5 py-3 border-b border-slate-200 shrink-0">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft size={22} className="text-gray-800" />
        </button>
        <span className="text-base font-bold text-gray-900">정지 회원 목록</span>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto px-5 pt-4">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-sm text-gray-400">
            불러오는 중...
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-gray-400">
            정지된 회원이 없습니다
          </div>
        ) : (
          <div className="bg-slate-100 rounded-2xl overflow-hidden">
            {users.map((user, idx) => (
              <div key={user.userId}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <UserCircle2 size={36} className="text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => void handleUnsuspend(user.userId)}
                    disabled={unsuspendingId === user.userId}
                    className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-500 text-white disabled:opacity-40"
                  >
                    {unsuspendingId === user.userId ? '처리 중...' : '정지해제'}
                  </button>
                </div>
                {idx < users.length - 1 && <div className="mx-4 h-px bg-slate-200" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 정지해제 성공 모달 (1초 자동 닫힘) */}
      {showSuccess && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl px-8 py-6 shadow-lg">
            <p className="text-base font-semibold text-gray-900">정지가 해제되었습니다</p>
          </div>
        </div>
      )}
    </div>
  );
}

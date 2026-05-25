'use client';

import { useState } from 'react';
import { ArrowLeft, UserCircle2, ChevronUp, ChevronDown } from 'lucide-react';

const STATUS_STYLE: Record<string, string> = {
  활성:   'bg-green-500 text-white',
  비활성: 'bg-slate-400 text-white',
  정지:   'bg-red-400 text-white',
};

const ACTIVITY_BADGE: Record<string, string> = {
  로그인: 'bg-sky-100 text-sky-700',
  'AI 질의': 'bg-sky-100 text-sky-700',
  이체:   'bg-amber-100 text-amber-700',
};

interface User {
  id: number;
  name: string;
  email: string;
  status: '활성' | '비활성' | '정지';
}

interface UserDetailViewProps {
  user: User;
  onBack: () => void;
}

export default function UserDetailView({ user, onBack }: UserDetailViewProps) {
  const [accountsExpanded, setAccountsExpanded] = useState(true);

  const infoRows = [
    { label: '이메일',   value: '-' },
    { label: '연락처',   value: '-' },
    { label: '업종',     value: '-' },
    { label: '가입일',   value: '-' },
    { label: '최종 접속', value: '-' },
  ];

  const accounts: { name: string; balance: string }[] = [];

  const activities = [
    { type: '로그인',   detail: '-', time: '-' },
    { type: 'AI 질의',  detail: '-', time: '-' },
    { type: '이체',     detail: '-', time: '-' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-white">

      {/* 프로필 */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-slate-600 hover:text-slate-900 transition-colors shrink-0">
            <ArrowLeft size={20} />
          </button>
          <UserCircle2 size={48} className="text-slate-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">{user.name}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${STATUS_STYLE[user.status]}`}>{user.status}</span>
            </div>
            <span className="text-sm text-gray-500">{user.email}</span>
          </div>
        </div>
      </div>

      <div className="mx-5 h-px bg-slate-200 mb-4" />

      {/* 기본 정보 */}
      <div className="px-5 mb-5 space-y-3">
        {infoRows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{row.label}</span>
            <span className="text-sm text-gray-900 font-medium">{row.value}</span>
          </div>
        ))}
      </div>

      {/* 금융 자산 요약 */}
      <div className="mx-5 mb-4 bg-slate-100 rounded-2xl overflow-hidden">
        <div className="px-4 py-3">
          <h3 className="text-sm font-bold text-gray-800">금융 자산 요약</h3>
        </div>

        {/* 마이데이터 연동 계좌 */}
        <div className="border-t border-slate-200">
          <button
            onClick={() => setAccountsExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-200 transition-colors"
          >
            <span className="text-sm text-gray-800">마이데이터 연동 계좌</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-gray-800">-개</span>
              {accountsExpanded
                ? <ChevronUp size={16} className="text-gray-500" />
                : <ChevronDown size={16} className="text-gray-500" />
              }
            </div>
          </button>

          {accountsExpanded && (
            <div className="px-4 pb-2 space-y-1.5">
              {accounts.map((acc, idx) => (
                <div key={idx} className="flex items-center justify-between pl-3">
                  <span className="text-xs text-gray-600">{acc.name}</span>
                  <span className="text-xs text-gray-700 font-medium">{acc.balance} 원</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 자산 요약 */}
        <div className="border-t border-slate-200 px-4 py-3 space-y-2">
          {[
            { label: '예금 잔액', value: '-원' },
            { label: '투자 자산', value: '-원' },
            { label: '총 자산',   value: '-원' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{item.label}</span>
              <span className="text-sm font-semibold text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="mx-5 mb-6 bg-slate-100 rounded-2xl overflow-hidden">
        <div className="px-4 py-3">
          <h3 className="text-sm font-bold text-gray-800">최근 활동</h3>
        </div>
        <div className="border-t border-slate-200">
          {activities.map((act, idx) => (
            <div key={idx}>
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${ACTIVITY_BADGE[act.type]}`}>
                    {act.type}
                  </span>
                  <span className="text-xs text-gray-400">{act.time}</span>
                </div>
                <p className="text-xs text-gray-600 pl-1">{act.detail}</p>
              </div>
              {idx < activities.length - 1 && <div className="mx-4 h-px bg-slate-200" />}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

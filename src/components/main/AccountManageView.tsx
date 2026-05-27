'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil } from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';

const ACCOUNT_ROLES = [
  { role: 'DEPOSIT',   label: '입금 통장' },
  { role: 'SALARY',    label: '월급 통장' },
  { role: 'STOCK',     label: '증권 통장' },
  { role: 'EMERGENCY', label: '비상금 통장' },
];

interface AccountCard {
  accountName: string;
  bankName: string;
  accountNumber: string;
  balance: number;
}

const MOCK_ACCOUNTS: Record<string, AccountCard | null> = {
  DEPOSIT:   null,
  SALARY:    null,
  STOCK:     null,
  EMERGENCY: null,
};

function formatKRW(n: number) {
  return `₩ ${n.toLocaleString('ko-KR')}`;
}

export default function AccountManageView() {
  const router = useRouter();

  const hasAnyAccount = ACCOUNT_ROLES.some(({ role }) => MOCK_ACCOUNTS[role] !== null);

  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* 헤더 */}
      <div className="flex items-center px-5 py-4 bg-white shrink-0 relative">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-800" />
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">
          계좌 관리
        </span>
      </div>

      {hasAnyAccount ? (
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
          <p className="text-sm text-gray-500 text-center">
            🔗 연결된 계좌 정보를 확인하세요.
          </p>
          {ACCOUNT_ROLES.map(({ role, label }) => {
            const account = MOCK_ACCOUNTS[role];
            return (
              <div key={role}>
                <div className="flex items-center justify-between mb-2">
                  <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 shadow-sm">
                    {label}
                  </button>
                  {account && (
                    <button className="p-1">
                      <Pencil size={16} className="text-gray-400" />
                    </button>
                  )}
                </div>
                {account ? (
                  <div className="bg-gray-100 rounded-2xl px-4 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">{account.accountName}</p>
                      <p className="text-sm font-bold text-gray-900">
                        {account.bankName} {account.accountNumber}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {formatKRW(account.balance)}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-2xl px-4 py-4 flex items-center justify-center">
                    <p className="text-sm text-gray-400">-</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">연동된 계좌가 없습니다</p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

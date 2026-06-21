'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import { getAccountTransactions } from '@/api/bank';
import type { AccountTransaction } from '@/types/bank';

const BANK_NAME: Record<string, string> = {
  '004': 'KB국민은행',
  '011': 'NH농협은행',
  '020': '우리은행',
  '023': 'SC제일은행',
  '081': '하나은행',
  '088': '신한은행',
  '090': '카카오뱅크',
  '092': '토스뱅크',
};

const TRANSACTION_TYPE_LABEL: Record<string, string> = {
  INCOME:  '수입',
  EXPENSE: '지출',
};

interface BankAccount {
  accountId: number;
  accountName: string;
  bankCode: string;
  accountNumber: string;
  balance: number | null;
}

interface Props {
  account: BankAccount;
  onBack: () => void;
}

function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

function toKST(isoStr: string): string {
  return new Date(isoStr).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function toKSTDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function groupByDate(
  transactions: AccountTransaction[],
): Map<string, AccountTransaction[]> {
  const map = new Map<string, AccountTransaction[]>();
  for (const tx of transactions) {
    const dateKey = toKSTDate(tx.transactionOccurredAt);
    if (!map.has(dateKey)) map.set(dateKey, []);
    map.get(dateKey)!.push(tx);
  }
  return map;
}

export default function BankAccountDetailView({ account, onBack }: Props) {
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  const now        = new Date();
  const year       = now.getFullYear();
  const month      = now.getMonth();
  const fromDate   = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay    = new Date(year, month + 1, 0).getDate();
  const toDate     = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const monthLabel = `${month + 1}월`;

  useEffect(() => {
    setLoading(true);
    setError('');
    getAccountTransactions(account.accountId, fromDate, toDate)
      .then((data) => setTransactions(Array.isArray(data) ? data : []))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.accountId]);

  const bankName = BANK_NAME[account.bankCode] ?? account.bankCode;
  const headerName = account.accountName.replace(bankName, '').trim() || account.accountName;

  const totalIncome  = transactions.filter((t) => t.transactionType === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.transactionType === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

  const grouped = groupByDate(transactions);

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* 헤더 */}
      <div className="relative flex items-center px-5 py-3 bg-bg shrink-0 border-b border-gray-100">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft size={22} className="text-gray-800" />
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">
          계좌 상세 조회
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* 계좌 카드 */}
        <div className="bg-gray-700 rounded-2xl px-5 py-5 flex items-end justify-between">
          <div className="flex flex-col gap-0.5">
            <p className="text-xl font-bold text-white">{headerName}</p>
            <p className="text-sm text-gray-300">{bankName}</p>
            <p className="text-xs text-gray-400">{account.accountNumber}</p>
          </div>
          <p className="text-xl font-bold text-white leading-tight">
            {account.balance != null ? `${formatKRW(account.balance)} 원` : '-'}
          </p>
        </div>

        {/* 이번 달 내역 */}
        <div className="bg-bg-card shadow-md rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">이번 달 내역</h2>
            <span className="text-xs text-gray-400">{monthLabel}</span>
          </div>

          {/* 총 수입 / 총 지출 요약 */}
          {!loading && !error && (
            <div className="flex gap-3 mb-5">
              <div className="flex-1 bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">총 수입</p>
                <p className={`text-sm font-bold ${totalIncome > 0 ? 'text-primary-500' : 'text-slate-800'}`}>
                  {totalIncome > 0 ? `${formatKRW(totalIncome)} 원` : '0 원'}
                </p>
              </div>
              <div className="flex-1 bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">총 지출</p>
                <p className={`text-sm font-bold ${totalExpense > 0 ? 'text-red-500' : 'text-slate-800'}`}>
                  {totalExpense > 0 ? `${formatKRW(totalExpense)} 원` : '0 원'}
                </p>
              </div>
            </div>
          )}

          {/* 로딩 스켈레톤 */}
          {loading && (
            <div className="space-y-3 py-2">
              <div className="flex gap-3 mb-5">
                <div className="flex-1 bg-gray-200 rounded-xl h-14 animate-pulse" />
                <div className="flex-1 bg-gray-200 rounded-xl h-14 animate-pulse" />
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <div className="space-y-1.5">
                    <div className="bg-gray-200 rounded h-3 w-24 animate-pulse" />
                    <div className="bg-gray-200 rounded h-2.5 w-14 animate-pulse" />
                  </div>
                  <div className="flex flex-col items-end space-y-1.5">
                    <div className="bg-gray-200 rounded h-3 w-20 animate-pulse" />
                    <div className="bg-gray-200 rounded h-2.5 w-16 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 에러 */}
          {!loading && error && (
            <p className="text-sm text-red-400 text-center py-6">{error}</p>
          )}

          {/* 거래 없음 */}
          {!loading && !error && transactions.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">이번 달 거래 내역이 없습니다.</p>
          )}

          {/* 거래 목록 */}
          {!loading && !error && transactions.length > 0 && (
            <div className="space-y-4">
              {Array.from(grouped.entries()).map(([date, txList]) => (
                <div key={date}>
                  <p className="text-xs text-gray-400 mb-2">{date}</p>
                  <div>
                    {txList.map((tx, idx) => {
                      const isIncome = tx.transactionType === 'INCOME';
                      const label    = tx.merchantName ?? TRANSACTION_TYPE_LABEL[tx.transactionType] ?? tx.transactionType;
                      const timeStr  = toKST(tx.transactionOccurredAt);
                      return (
                        <div key={tx.transactionId}>
                          <div className="flex items-center justify-between py-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{label}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{timeStr}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-bold ${isIncome ? 'text-blue-500' : 'text-red-500'}`}>
                                {formatKRW(tx.amount)} 원
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                잔액 {formatKRW(tx.balanceAfter)}원
                              </p>
                            </div>
                          </div>
                          {idx < txList.length - 1 && (
                            <div className="border-b border-gray-100" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

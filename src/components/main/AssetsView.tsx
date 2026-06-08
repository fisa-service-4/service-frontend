'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Bell } from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import { getAccounts, getAccountsWithRoles } from '@/api/bank';
import { connectMyData } from '@/api/mydata';
import type { BankAccount } from '@/types/bank';
import { getStockAccounts, getCashBalance } from '@/api/stock';
import type { StockAccount } from '@/api/stock';
import TransferView from '@/components/main/TransferView';
import NotificationPanel from '@/components/main/NotificationPanel';

type AssetTab = 'all' | 'bank' | 'stock';
type SubView = 'overview' | 'transfer' | 'connect';

interface StockAccountWithBalance extends StockAccount {
  cashBalance: number;
}

const INSTITUTIONS = [
  { code: '004', name: 'KB국민은행' },
  { code: '011', name: 'NH농협은행' },
  { code: '020', name: '우리은행' },
  { code: '023', name: 'SC제일은행' },
  { code: '081', name: '하나은행' },
  { code: '088', name: '신한은행' },
  { code: '090', name: '카카오뱅크' },
  { code: '092', name: '토스뱅크' },
];

const BANK_NAME: Record<string, string> = {
  ...Object.fromEntries(INSTITUTIONS.map((i) => [i.code, i.name])),
  '039': '한국투자증권',
  '239': '미래에셋증권',
  '240': '삼성증권',
  '243': '한국투자증권',
  '247': 'NH투자증권',
  '261': '교보증권',
  '266': 'SK증권',
};

const ACCOUNT_ROLE_LABEL: Record<string, string> = {
  DEPOSIT:   '입금',
  SALARY:    '월급',
  EMERGENCY: '비상금',
  STOCK:     '주식',
};

function formatKRW(amount: number | null | undefined): string {
  if (amount == null) return '-';
  return `${amount.toLocaleString('ko-KR')} 원`;
}

function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />;
}

export default function AssetsView() {
  const [subView, setSubView]                   = useState<SubView>('overview');
  const [activeTab, setActiveTab]               = useState<AssetTab>('all');
  const [accounts, setAccounts]                 = useState<BankAccount[]>([]);

  const [loading, setLoading]                   = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [stockAccounts, setStockAccounts]       = useState<StockAccountWithBalance[]>([]);
  const [connectLoading, setConnectLoading]     = useState(false);
  const [connectError, setConnectError]         = useState('');

  useEffect(() => {
    getAccounts()
      .then((accs) => setAccounts(accs))
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getStockAccounts()
      .then(async (res) => {
        const accs = res.accounts ?? [];
        const withBalance = await Promise.all(
          accs.map(async (acc) => {
            try {
              const bal = await getCashBalance(acc.accountId);
              return { ...acc, cashBalance: bal.cashBalance };
            } catch {
              return { ...acc, cashBalance: 0 };
            }
          })
        );
        setStockAccounts(withBalance);
      })
      .catch(() => setStockAccounts([]));
  }, []);

  async function handleConnect(provider: string) {
    setConnectLoading(true);
    setConnectError('');
    try {
      await connectMyData(provider);
      const accs = await getAccounts();
      setAccounts(accs);
      setSubView('overview');
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : '연결 중 오류가 발생했습니다.');
    } finally {
      setConnectLoading(false);
    }
  }

  async function handleTransferComplete() {
    setSubView('overview');
    try {
      const accs = await getAccountsWithRoles();
      setAccounts(accs);
    } catch {}
  }

  if (subView === 'transfer') {
    return (
      <TransferView
        accounts={accounts}
        onBack={() => setSubView('overview')}
        onComplete={handleTransferComplete}
      />
    );
  }

  if (subView === 'connect') {
    return (
      <div className="flex flex-col h-screen bg-bg">
        <div className="relative flex items-center px-5 py-3 bg-bg shrink-0 border-b border-gray-100">
          <button onClick={() => { setSubView('overview'); setConnectError(''); }} className="mr-3">
            <ArrowLeft size={22} className="text-gray-800" />
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">계좌 연결</span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <p className="text-sm text-gray-500 mb-5">연결할 금융기관을 선택해 주세요.</p>
          <div className="grid grid-cols-2 gap-3">
            {INSTITUTIONS.map((inst) => (
              <button
                key={inst.code}
                onClick={() => handleConnect(inst.code)}
                disabled={connectLoading}
                className="py-4 bg-bg-card shadow-md rounded-2xl text-sm font-semibold text-gray-800 active:text-sky-600 disabled:opacity-50 transition-colors"
              >
                {inst.name}
              </button>
            ))}
          </div>
          {connectError && (
            <p className="text-xs text-red-500 mt-4 text-center">{connectError}</p>
          )}
          {connectLoading && (
            <p className="text-xs text-gray-400 mt-4 text-center">연결 중...</p>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  const bankOnlyAccounts = accounts.filter((a) => a.accountRole !== 'STOCK');
  const bankTotal        = bankOnlyAccounts.reduce((sum, a) => sum + (a.balance ?? 0), 0);
  const stockTotal       = stockAccounts.reduce((sum, a) => sum + (a.cashBalance ?? 0), 0);
  const totalAsset       = bankTotal + stockTotal;
  const hasAccounts      = bankOnlyAccounts.length > 0;
  const bankRatio        = totalAsset > 0 ? Math.round((bankTotal / totalAsset) * 100) : 0;
  const stockRatio       = totalAsset > 0 ? Math.round((stockTotal / totalAsset) * 100) : 0;

  return (
    <div className="flex flex-col h-screen bg-bg">
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* 헤더 */}
        <div className="flex items-center justify-end px-5 py-4 shrink-0">
          <button className="p-1" onClick={() => setShowNotification(true)}>
            <Bell size={22} className="text-gray-800" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-5 pb-6">
          
          {/* ── 총 자산 카드 ── */}
          <div className="bg-bg-card shadow-md rounded-2xl p-5">
            {loading ? (
              <div className="space-y-3">
                <SkeletonCard className="h-3 w-16" />
                <SkeletonCard className="h-10 w-44" />
                <SkeletonCard className="h-6 w-28 rounded-full" />
                <div className="flex gap-3 pt-1">
                  <SkeletonCard className="flex-1 h-14" />
                  <SkeletonCard className="flex-1 h-14" />
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-1">총 자산</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {formatKRW(totalAsset)}
                </p>
                <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-600 text-xs font-bold px-2.5 py-1 rounded-lg border border-sky-200 mb-4">
                  지난달 대비 -
                </span>
                <div className="flex gap-3">
                  <div className="flex-1 bg-gray-100 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">은행 잔액</p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatKRW(bankTotal)}
                    </p>
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">증권 예수금</p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatKRW(stockTotal)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── 자산 구성 ── */}
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3">자산 구성</h2>
            <div className="bg-bg-card shadow-md rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                <span className="text-sm text-gray-700 w-8 shrink-0">은행</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-500"
                    style={{ width: `${bankRatio}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-10 text-right">
                  {bankRatio}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-200 shrink-0" />
                <span className="text-sm text-gray-700 w-8 shrink-0">증권</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-300 rounded-full transition-all duration-500"
                    style={{ width: `${stockRatio}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-10 text-right">
                  {stockRatio}%
                </span>
              </div>
            </div>
          </div>

          {/* ── 탭 ── */}
          <div className="bg-gray-100 rounded-xl p-1 flex gap-1">
            {(['all', 'bank', 'stock'] as AssetTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === tab
                    ? 'bg-bg-card text-gray-900 shadow-md'
                    : 'text-gray-400'
                }`}
              >
                {tab === 'all' ? '전체' : tab === 'bank' ? '은행' : '증권'}
              </button>
            ))}
          </div>

          {/* ── 연동계좌 (전체 탭) — 은행 + 증권 합산 ── */}
          {activeTab === 'all' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900">연동계좌</h2>
                <button
                  onClick={() => setSubView('connect')}
                  className="bg-sky-50 text-sky-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-sky-200"
                >
                  + 계좌 추가
                </button>
              </div>

              {hasAccounts || stockAccounts.length > 0 || loading ? (
                <div className="bg-bg-card shadow-md rounded-2xl p-2 space-y-2">
                  {loading ? (
                    <>
                      <div className="bg-gray-200 rounded-xl h-16 animate-pulse" />
                      <div className="bg-gray-200 rounded-xl h-16 animate-pulse" />
                    </>
                  ) : (
                    <>
                      {bankOnlyAccounts.map((account) => (
                        <div
                          key={`bank-${account.accountId}`}
                          className="flex items-center justify-between bg-gray-100 rounded-xl px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {BANK_NAME[account.bankCode] ?? account.bankCode}
                            </p>
                            <p className="text-xs font-medium text-gray-900 mt-0.5">
                              {ACCOUNT_ROLE_LABEL[account.accountRole ?? ''] ?? '입출금'}{' '}
                              · {account.accountNumber}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-gray-900">
                            {formatKRW(account.balance)}
                          </p>
                        </div>
                      ))}
                      {stockAccounts.map((account) => (
                        <div
                          key={`stock-${account.accountId}`}
                          className="flex items-center justify-between bg-gray-100 rounded-xl px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {BANK_NAME[account.bankCode] ?? account.bankCode}
                            </p>
                            <p className="text-xs font-medium text-gray-900 mt-0.5">
                              {account.accountName} · {account.accountNumber}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-gray-900">
                            {formatKRW(account.cashBalance)}
                          </p>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-bg-card shadow-md rounded-2xl p-8 flex flex-col items-center text-center">
                  <p className="text-base font-bold text-gray-900 mb-1">계좌를 연동해주세요</p>
                  <p className="text-xs text-gray-400 mb-5">
                    계좌 연동 시 모든 금융·자산을 한눈에 볼 수 있어요
                  </p>
                  <button
                    onClick={() => setSubView('connect')}
                    className="w-full py-3 bg-sky-500 text-white rounded-2xl text-sm font-semibold"
                  >
                    + 계좌 연결하기
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── 연동 계좌 (은행 탭) ── */}
          {activeTab === 'bank' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900">연동 계좌</h2>
                <button
                  onClick={() => setSubView('transfer')}
                  className="bg-gray-100 text-gray-700 text-sm font-medium px-4 py-1.5 rounded-xl"
                >
                  이체
                </button>
              </div>

              {hasAccounts || loading ? (
                <div className="bg-bg-card shadow-md rounded-2xl p-2 space-y-2">
                  {loading ? (
                    <>
                      <div className="bg-gray-200 rounded-xl h-16 animate-pulse" />
                      <div className="bg-gray-200 rounded-xl h-16 animate-pulse" />
                    </>
                  ) : bankOnlyAccounts.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-8">
                      해당 유형의 계좌가 없습니다.
                    </p>
                  ) : (
                    bankOnlyAccounts.map((account) => (
                      <div
                        key={account.accountId}
                        className="flex items-center justify-between bg-gray-100 rounded-xl px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {BANK_NAME[account.bankCode] ?? account.bankCode}
                          </p>
                          <p className="text-xs font-medium text-gray-900 mt-0.5">
                            {ACCOUNT_ROLE_LABEL[account.accountRole ?? ''] ?? '입출금'}{' '}
                            · {account.accountNumber}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">
                          {formatKRW(account.balance)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="bg-bg-card shadow-md rounded-2xl p-8 flex flex-col items-center text-center">
                  <p className="text-base font-bold text-gray-900 mb-1">계좌를 연동해주세요</p>
                  <p className="text-xs text-gray-400 mb-5">
                    계좌 연동 시 모든 금융·자산을 한눈에 볼 수 있어요
                  </p>
                  <button
                    onClick={() => setSubView('connect')}
                    className="w-full py-3 bg-sky-500 text-white rounded-2xl text-sm font-semibold"
                  >
                    + 계좌 연결하기
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── 연동계좌 (증권 탭) ── */}
          {activeTab === 'stock' && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-3">연동계좌</h2>
              <div className="bg-bg-card shadow-md rounded-2xl p-2 space-y-2">
                {stockAccounts.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-8">
                    연동된 증권 계좌가 없습니다.
                  </p>
                ) : (
                  stockAccounts.map((account) => (
                    <div
                      key={account.accountId}
                      className="flex items-center justify-between bg-gray-100 rounded-xl px-4 py-3"
                    >
                      <div>
                        <p className="text-xs font-semibold text-gray-900">
                          {BANK_NAME[account.bankCode] ?? account.bankCode}
                        </p>
                        <p className="text-sm font-medium text-gray-800 mt-0.5">
                          {account.accountName} · {account.accountNumber}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        {formatKRW(account.cashBalance)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {showNotification && <NotificationPanel onClose={() => setShowNotification(false)} />}
      <BottomNav />
    </div>
  );
}
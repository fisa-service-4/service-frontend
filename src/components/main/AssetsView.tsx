'use client';

import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import type { MainNavItem } from '@/components/main/BottomNav';
import { getAccounts } from '@/api/bank';
import { getMyStockAccounts, getMyPortfolio } from '@/api/mydata';
import type { BankAccount, Portfolio } from '@/types/bank';
import TransferView from '@/components/main/TransferView';

type AssetTab = 'all' | 'bank' | 'stock';

interface AssetsViewProps {
  activeNav: MainNavItem;
  onNavChange: (nav: MainNavItem) => void;
}

const BANK_NAME: Record<string, string> = {
  '004': 'KB국민은행',
  '011': 'NH농협은행',
  '020': '우리은행',
  '023': 'SC제일은행',
  '027': '씨티은행',
  '032': '부산은행',
  '039': '경남은행',
  '045': '새마을금고',
  '071': '우체국',
  '081': '하나은행',
  '088': '신한은행',
  '090': '카카오뱅크',
  '092': '토스뱅크',
};

const ACCOUNT_ROLE_LABEL: Record<string, string> = {
  DEPOSIT:   '입출금',
  SALARY:    '월급',
  EMERGENCY: '비상금',
  STOCK:     '주식',
};

function formatKRW(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`;
}

function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`bg-sky-100 rounded-xl animate-pulse ${className}`} />;
}

export default function AssetsView({ activeNav, onNavChange }: AssetsViewProps) {
  const [subView, setSubView]           = useState<'overview' | 'transfer'>('overview');
  const [activeTab, setActiveTab]       = useState<AssetTab>('all');
  const [accounts, setAccounts]         = useState<BankAccount[]>([]);
  const [portfolio, setPortfolio]       = useState<Portfolio | null>(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([getAccounts(), getMyStockAccounts()])
      .then(([accs, { content: stockAccounts }]) => {
        setAccounts(accs);
        if (stockAccounts.length === 0) return;
        return getMyPortfolio(stockAccounts[0].accountId);
      })
      .then((port) => { if (port) setPortfolio(port); })
      .catch(() => { setAccounts([]); setPortfolio(null); })
      .finally(() => setLoading(false));
  }, []);

  if (subView === 'transfer') {
    return (
      <TransferView
        accounts={accounts}
        onBack={() => setSubView('overview')}
        activeNav={activeNav}
        onNavChange={onNavChange}
      />
    );
  }

  const displayAccounts =
    activeTab === 'bank'
      ? accounts.filter((a) => a.accountRole !== 'STOCK')
      : activeTab === 'stock'
      ? accounts.filter((a) => a.accountRole === 'STOCK')
      : accounts;

  const hasAccounts = accounts.length > 0;
  const bankRatio   = portfolio?.assetRatio.cash  ?? 0;
  const stockRatio  = portfolio?.assetRatio.stock ?? 0;

  return (
    <div className="flex flex-col h-screen bg-white">

      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 shrink-0">
        <button aria-label="메뉴">
          <Menu size={24} className="text-gray-800" />
        </button>
        <h1 className="text-base font-bold text-gray-900">통합 자산 현황</h1>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-5 pb-6">

        {/* ── 총 자산 카드 ── */}
        <div className="bg-white border-2 border-sky-500 rounded-2xl p-5">
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
                {formatKRW(portfolio?.totalAsset ?? 0)}
              </p>
              <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-600 text-xs font-bold px-2.5 py-1 rounded-lg border border-sky-200 mb-4">
                지난달 대비 -
              </span>
              <div className="flex gap-3">
                <div className="flex-1 bg-sky-50 border border-sky-100 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">은행 잔액</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatKRW(portfolio?.cashAsset ?? 0)}
                  </p>
                </div>
                <div className="flex-1 bg-sky-50 border border-sky-100 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">증권 평가 금액</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatKRW(portfolio?.stockAsset ?? 0)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── 자산 구성 ── */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3">자산 구성</h2>
          <div className="bg-white border-2 border-sky-500 rounded-2xl p-5 space-y-4">

            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
              <span className="text-sm text-gray-700 w-8 shrink-0">은행</span>
              <div className="flex-1 h-2 bg-sky-100 rounded-full overflow-hidden">
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
              <div className="flex-1 h-2 bg-sky-100 rounded-full overflow-hidden">
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
        <div className="bg-gray-600 rounded-2xl p-1.5 flex gap-1">
          {(['all', 'bank', 'stock'] as AssetTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-300'
              }`}
            >
              {tab === 'all' ? '전체' : tab === 'bank' ? '은행' : '증권'}
            </button>
          ))}
        </div>

        {/* ── 연동 계좌 ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">연동 계좌</h2>
            {activeTab === 'bank' ? (
              <button
                onClick={() => setSubView('transfer')}
                className="bg-gray-100 text-gray-700 text-sm font-medium px-4 py-1.5 rounded-xl"
              >
                이체
              </button>
            ) : activeTab === 'stock' ? (
              <button className="bg-gray-100 text-gray-700 text-sm font-medium px-4 py-1.5 rounded-xl">
                전체 주식 보기
              </button>
            ) : (
              <button className="bg-sky-50 text-sky-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-sky-200">
                + 계좌 추가
              </button>
            )}
          </div>

          {hasAccounts || loading ? (
            <div className="bg-gray-600 rounded-2xl p-2 space-y-2">
              {loading ? (
                <>
                  <div className="bg-white/10 rounded-xl h-16 animate-pulse" />
                  <div className="bg-white/10 rounded-xl h-16 animate-pulse" />
                </>
              ) : displayAccounts.length === 0 ? (
                <p className="text-center text-sm text-gray-300 py-8">
                  해당 유형의 계좌가 없습니다.
                </p>
              ) : (
                displayAccounts.map((account) => (
                  <div
                    key={account.accountId}
                    className="flex items-center justify-between bg-white rounded-xl px-4 py-3"
                  >
                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        {BANK_NAME[account.bankCode] ?? account.bankCode}
                      </p>
                      <p className="text-sm font-medium text-gray-800 mt-0.5">
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
            /* 빈 상태 */
            <div className="bg-white border-2 border-sky-500 rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-sky-50 border-2 border-sky-500 rounded-full flex items-center justify-center mb-4">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path
                    d="M6 14.5L11.5 20L22 8"
                    stroke="#0ea5e9"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-base font-bold text-gray-900 mb-1">계좌를 연동해주세요</p>
              <p className="text-xs text-gray-400 mb-5">
                계좌 연동 시 모든 금융·자산을
                <br />
                한눈에 볼 수 있어요
              </p>
              <button className="w-full py-3 bg-sky-500 text-white rounded-2xl text-sm font-semibold">
                + 계좌 연결하기
              </button>
            </div>
          )}
        </div>

      </div>

      <BottomNav activeNav={activeNav} onNavChange={onNavChange} />
    </div>
  );
}

'use client';

import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import type { BankAccountSummary, StockAccountSummary } from '@/api/mydata';
import { BANK_LOGO } from './bankUtils';

export type AnyAccount = BankAccountSummary | StockAccountSummary;

const STEP_LABELS = ['입금 계좌', '월급 계좌', '비상금 계좌', '투자 계좌'] as const;

interface Props {
  title: string;
  subtitle: string;
  /** 0=deposit, 1=salary, 2=emergency, 3=stock */
  stepIndex: number;
  accounts: AnyAccount[];
  selected: number | '';
  onSelect: (id: number | '') => void;
  /** accountId → 역할 라벨 (예: '입금 계좌') — disabled 처리용 */
  alreadySelectedIds: Map<number, string>;
  onNext: () => Promise<void>;
  onBack: () => void;
  nextLabel?: string;
  showSkip?: boolean;
  onSkip?: () => Promise<void>;
  loading: boolean;
  error: string;
}

export default function AccountStep({
  title,
  subtitle,
  stepIndex,
  accounts,
  selected,
  onSelect,
  alreadySelectedIds,
  onNext,
  onBack,
  nextLabel = '다음',
  showSkip = false,
  onSkip,
  loading,
  error,
}: Props) {
  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* 헤더 */}
      <div className="h-14 bg-[#131329] flex items-center px-4">
        <button type="button" onClick={onBack} className="text-white p-1">
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="flex-1 px-6 pt-6 overflow-y-auto pb-2">
        {/* 진행 바 (4단계) */}
        <div className="flex gap-1.5 mb-1">
          {STEP_LABELS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-primary-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mb-6">
          {stepIndex + 1} / {STEP_LABELS.length}
        </p>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
        <p className="text-sm text-gray-400 mb-6">{subtitle}</p>

        {/* 계좌 카드 목록 */}
        <div className="flex flex-col gap-3">
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">연동된 계좌가 없어요</p>
              {showSkip && (
                <p className="text-xs text-gray-300 mt-1">건너뛰기를 선택할 수 있어요</p>
              )}
            </div>
          ) : (
            accounts.map((account) => {
              const isSelected = selected === account.accountId;
              const roleBadge  = alreadySelectedIds.get(account.accountId);
              const isDisabled = !!roleBadge;

              return (
                <button
                  key={account.accountId}
                  type="button"
                  disabled={isDisabled || loading}
                  onClick={() => onSelect(isSelected ? '' : account.accountId)}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-primary-500 bg-primary-500/5'
                      : isDisabled
                      ? 'border-transparent bg-gray-100 opacity-60 cursor-not-allowed'
                      : 'border-transparent bg-bg-card shadow-md active:bg-gray-50'
                  }`}
                >
                  {/* 은행 로고 */}
                  <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                    {BANK_LOGO[account.bankCode] ? (
                      <Image
                        src={BANK_LOGO[account.bankCode]}
                        alt=""
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    ) : (
                      <span className="text-xs text-gray-500 font-bold">
                        {account.bankCode}
                      </span>
                    )}
                  </div>

                  {/* 계좌 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {account.accountName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {account.accountNumber}
                    </p>
                    {'balance' in account && (
                      <p className="text-sm font-semibold text-gray-700 mt-1">
                        {(account as BankAccountSummary).balance.toLocaleString('ko-KR')}원
                      </p>
                    )}
                  </div>

                  {/* 우측: 배지 or 선택 인디케이터 */}
                  {isDisabled ? (
                    <span className="text-xs bg-gray-200 text-gray-500 px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap">
                      {roleBadge}
                    </span>
                  ) : (
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-primary-500 border-primary-500'
                          : 'border-gray-200'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 12 12">
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="px-6 pb-8 pt-3 flex gap-2">
        {showSkip && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={loading}
            className="flex-1 h-14 bg-gray-100 text-gray-600 rounded-xl text-base font-medium disabled:opacity-60"
          >
            건너뛰기
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={loading || selected === ''}
          className="flex-1 h-14 bg-primary-500 text-white rounded-xl text-base font-semibold disabled:opacity-40 transition-opacity"
        >
          {loading ? '저장 중...' : nextLabel}
        </button>
      </div>
    </div>
  );
}

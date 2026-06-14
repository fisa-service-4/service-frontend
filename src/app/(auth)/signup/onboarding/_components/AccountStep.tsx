'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import type { BankAccountSummary, StockAccountSummary } from '@/api/mydata';
import { BANK_LOGO, BANK_NAME } from './bankUtils';

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
  // 기관별 그룹화
  const grouped = useMemo(() => {
    const map = new Map<string, AnyAccount[]>();
    for (const account of accounts) {
      const key = account.bankCode;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(account);
    }
    return map;
  }, [accounts]);

  // 첫 번째 기관 자동 펼침
  const [openCode, setOpenCode] = useState<string | null>(() => accounts[0]?.bankCode ?? null);

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* 헤더 */}
      <div className="h-14 bg-[#131329] flex items-center px-4">
        <button type="button" onClick={onBack} className="text-white p-1">
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="flex-1 min-h-0 px-6 pt-6 overflow-y-auto pb-2">
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

        {/* 기관별 Accordion */}
        {accounts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">연동된 계좌가 없어요</p>
            {showSkip && (
              <p className="text-xs text-gray-300 mt-1">건너뛰기를 선택할 수 있어요</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {Array.from(grouped.entries()).map(([bankCode, groupAccounts]) => {
              const isOpen = openCode === bankCode;
              return (
                <div key={bankCode} className="rounded-2xl overflow-hidden border border-gray-100">
                  {/* Accordion 헤더 */}
                  <button
                    type="button"
                    onClick={() => setOpenCode(isOpen ? null : bankCode)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-bg-card"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                      {BANK_LOGO[bankCode] ? (
                        <Image
                          src={BANK_LOGO[bankCode]}
                          alt={BANK_NAME[bankCode] ?? bankCode}
                          width={36}
                          height={36}
                          className="object-contain"
                        />
                      ) : (
                        <span className="text-xs text-gray-500 font-bold">{bankCode}</span>
                      )}
                    </div>
                    <span className="flex-1 text-left text-sm font-semibold text-gray-900">
                      {BANK_NAME[bankCode] ?? bankCode}
                    </span>
                    <span className="text-xs text-gray-400 mr-1">{groupAccounts.length}개</span>
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Accordion 바디 */}
                  {isOpen && (
                    <div className="flex flex-col divide-y divide-gray-100 bg-gray-50/50 px-3 pb-2 pt-1">
                      {groupAccounts.map((account) => {
                        const isSelected = selected === account.accountId;
                        const roleBadge  = alreadySelectedIds.get(account.accountId);
                        const isDisabled = !!roleBadge;

                        return (
                          <button
                            key={account.accountId}
                            type="button"
                            disabled={isDisabled || loading}
                            onClick={() => onSelect(isSelected ? '' : account.accountId)}
                            className={`w-full flex items-center gap-3 px-2 py-3.5 rounded-xl text-left transition-all ${
                              isSelected
                                ? 'bg-primary-500/5'
                                : isDisabled
                                ? 'opacity-50 cursor-not-allowed'
                                : 'active:bg-gray-100'
                            }`}
                          >
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
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 에러 메시지 - 고정 높이 */}
      <div className="px-6 h-8 flex items-center">
        <p className={`text-sm text-red-500 ${error ? 'visible' : 'invisible'}`}>{error || ' '}</p>
      </div>

      {/* 하단 버튼 */}
      <div className="px-6 pb-8 flex gap-2">
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

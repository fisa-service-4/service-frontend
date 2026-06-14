'use client';

import Image from 'next/image';
import { CheckCircle } from 'lucide-react';
import type { BankAccountSummary, StockAccountSummary } from '@/api/mydata';
import { BANK_LOGO, BANK_NAME } from './bankUtils';

interface Props {
  bankAccounts: BankAccountSummary[];
  stockAccounts: StockAccountSummary[];
  onNext: () => void;
}

interface InstitutionItem {
  code: string;
  type: 'bank' | 'stock';
}

export default function ConnectedStep({ bankAccounts, stockAccounts, onNext }: Props) {
  // 고유 bankCode 추출 (중복 제거)
  const bankCodes  = [...new Set(bankAccounts.map((a) => a.bankCode))];
  const stockCodes = [...new Set(stockAccounts.map((a) => a.bankCode))];

  const institutions: InstitutionItem[] = [
    ...bankCodes.map((code) => ({ code, type: 'bank' as const })),
    ...stockCodes.map((code) => ({ code, type: 'stock' as const })),
  ];

  const totalCount = bankAccounts.length + stockAccounts.length;

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <div className="h-14 bg-[#131329]" />

      <div className="flex-1 px-6 pt-8 overflow-y-auto">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle size={26} className="text-primary-500" />
          <h1 className="text-2xl font-bold text-gray-900">연결을 완료했어요</h1>
        </div>
        <p className="text-sm text-gray-400 mb-8 pl-9">
          총 {totalCount}개의 계좌를 불러왔어요
        </p>

        <div className="flex flex-col gap-2.5">
          {institutions.length > 0 ? (
            institutions.map(({ code, type }) => (
              <div
                key={`${type}-${code}`}
                className="flex items-center gap-3 bg-bg-card shadow-sm rounded-2xl px-4 py-3.5"
              >
                {BANK_LOGO[code] ? (
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                    <Image
                      src={BANK_LOGO[code]}
                      alt={BANK_NAME[code] ?? code}
                      width={36}
                      height={36}
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                    <span className="text-xs text-gray-500 font-bold">{code}</span>
                  </div>
                )}

                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {BANK_NAME[code] ?? code}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {type === 'bank' ? '은행' : '증권'}
                  </p>
                </div>

                <CheckCircle size={16} className="text-primary-500 shrink-0" />
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">연동된 계좌 정보를 찾을 수 없어요</p>
              <p className="text-xs text-gray-300 mt-1">
                계속 진행하면 계좌 역할을 직접 설정할 수 있어요
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-8 pt-4">
        <button
          type="button"
          onClick={onNext}
          className="w-full h-14 bg-primary-500 text-white rounded-xl text-base font-semibold"
        >
          확인
        </button>
      </div>
    </div>
  );
}

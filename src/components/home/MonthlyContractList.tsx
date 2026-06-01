'use client';

import type { Contract, ContractStatus } from '@/types/virtualSalary';

const fmt = (n: number) => `${n.toLocaleString()} 원`;

const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  PENDING:   '입금 예정',
  PAID:      '입금 완료',
  DELAYED:   '미입금',
  CANCELLED: '취소',
};

const CONTRACT_STATUS_STYLE: Record<ContractStatus, string> = {
  PENDING:   'bg-amber-100 text-amber-600',
  PAID:      'bg-sky-100 text-sky-600',
  DELAYED:   'bg-red-100 text-red-600',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const TAX_TYPE_LABEL: Record<string, string> = {
  BUSINESS: '사업소득 3.3%',
  ETC:      '기타소득 8.8%',
  ARTIST:   '예술인 8.8%',
};

interface Props {
  contracts: Contract[];
  loading: boolean;
}

export default function MonthlyContractList({ contracts, loading }: Props) {
  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-3">이번달 받을 돈</h2>

      {loading ? (
        <div className="text-sm text-gray-400 text-center py-6">불러오는 중...</div>
      ) : contracts.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-2xl">
          이번달 등록된 계약이 없어요
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((c: Contract) => {
            const isActive = c.contractStatus === 'PENDING';
            return (
              <div
                key={c.contractId}
                className={`rounded-2xl p-4 border-2 bg-white ${isActive ? 'border-sky-500' : 'border-gray-200'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 ${isActive ? 'bg-sky-500' : 'bg-gray-400'}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{c.clientName}</p>
                      <p className="text-xs text-gray-400">
                        {c.expectedPaymentDate} · {TAX_TYPE_LABEL[c.taxType] ?? c.taxType}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 mb-1">
                      {c.settlement ? fmt(c.settlement.actualIncome) : '-'}
                    </p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${CONTRACT_STATUS_STYLE[c.contractStatus]}`}>
                      {CONTRACT_STATUS_LABEL[c.contractStatus]}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

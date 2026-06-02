"use client";

import type { Contract } from "@/types/virtualSalary";

const fmt = (n: number | undefined | null) => n != null ? `${n.toLocaleString()} 원` : '-';

function getContractBadge(c: Contract): { label: string; style: string } {
  if (c.contractStatus === "PAID")      return { label: "입금 완료", style: "bg-gray-100 text-gray-500" };
  if (c.contractStatus === "CANCELLED") return { label: "취소",      style: "bg-gray-100 text-gray-500" };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const pay   = new Date(c.expectedPaymentDate); pay.setHours(0, 0, 0, 0);
  const tbcStart = new Date(pay); tbcStart.setDate(pay.getDate() - 2);
  const tbcEnd   = new Date(pay); tbcEnd.setDate(pay.getDate() + 2);

  if (today > tbcEnd)    return { label: "실패",    style: "bg-red-100 text-red-600"     };
  if (today >= tbcStart) return { label: "확인 중", style: "bg-amber-100 text-amber-600" };
  if (c.contractStatus === "DELAYED") return { label: "실패", style: "bg-red-100 text-red-600" };
  return { label: "입금 전", style: "bg-primary-100 text-primary-700" };
}

const TAX_TYPE_LABEL: Record<string, string> = {
  BUSINESS: "사업소득 3.3%",
  ETC: "기타소득 8.8%",
  ARTIST: "예술인 8.8%",
};

const TAX_RATE: Record<string, number> = {
  BUSINESS: 0.033,
  ETC: 0.088,
  ARTIST: 0.088,
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
        <div className="text-sm text-gray-400 text-center py-6">
          불러오는 중...
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-2xl">
          등록된 계약이 없어요
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((c: Contract) => {
            const isActive = c.contractStatus === "PENDING";
            return (
              <div
                key={c.contractId}
                className={`rounded-2xl p-4 border-2 bg-white ${isActive ? "border-primary-500" : "border-gray-200"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 ${isActive ? "bg-primary-500" : "bg-gray-400"}`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {c.clientName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {c.expectedPaymentDate} ·{" "}
                        {TAX_TYPE_LABEL[c.taxType] ?? c.taxType}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 mb-1">
                      {c.contractStatus === 'DELAYED'
                        ? '-'
                        : fmt(c.settlement?.actualIncome ?? c.actualIncome ?? (c.contractAmount != null ? Math.floor(c.contractAmount * (1 - (TAX_RATE[c.taxType] ?? 0.033))) : undefined))}
                    </p>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-md ${getContractBadge(c).style}`}
                    >
                      {getContractBadge(c).label}
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

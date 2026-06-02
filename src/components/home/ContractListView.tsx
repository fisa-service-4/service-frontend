'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { getContracts } from '@/api/virtualSalary';
import type { Contract } from '@/types/virtualSalary';
import BottomNav from '@/components/main/BottomNav';

const fmt = (n: number) => `${n.toLocaleString()} 원`;

function getDday(expectedPaymentDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pay = new Date(expectedPaymentDate);
  pay.setHours(0, 0, 0, 0);
  const diff = Math.floor((pay.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return 'D-Day';
  if (diff > 0)  return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

function getContractBadge(contract: Contract): { label: string; style: string } {
  if (contract.contractStatus === 'PAID')      return { label: '입금완료', style: 'bg-gray-100 text-gray-500' };
  if (contract.contractStatus === 'CANCELLED') return { label: '취소',     style: 'bg-gray-100 text-gray-400' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pay = new Date(contract.expectedPaymentDate);
  pay.setHours(0, 0, 0, 0);
  const tbcStart = new Date(pay); tbcStart.setDate(pay.getDate() - 2);
  const tbcEnd   = new Date(pay); tbcEnd.setDate(pay.getDate() + 2);

  if (today > tbcEnd)    return { label: '실패',    style: 'bg-red-100 text-red-600'     };
  if (today >= tbcStart) return { label: '확인 중', style: 'bg-amber-100 text-amber-600' };
  if (contract.contractStatus === 'DELAYED') return { label: '실패', style: 'bg-red-100 text-red-600' };
  return { label: '입금 전', style: 'bg-primary-100 text-primary-700' };
}

const _today = new Date();
const TODAY_YEAR  = _today.getFullYear();
const TODAY_MONTH = _today.getMonth() + 1;

function ContractRow({ contract, onClick }: { contract: Contract; onClick: () => void }) {
  const { label, style } = getContractBadge(contract);
  const isActive = contract.contractStatus === 'PENDING';

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-3 text-left"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{contract.clientName}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {fmt(contract.contractAmount)} · {contract.expectedPaymentDate}
          {isActive && (
            <span className="ml-2 font-semibold text-primary-500">{getDday(contract.expectedPaymentDate)}</span>
          )}
        </p>
      </div>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ml-3 ${style}`}>
        {label}
      </span>
    </button>
  );
}

export default function ContractListView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [year,      setYear]      = useState(() => Number(searchParams.get('year'))  || TODAY_YEAR);
  const [month,     setMonth]     = useState(() => Number(searchParams.get('month')) || TODAY_MONTH);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    const date = `${year}-${String(month).padStart(2, '0')}-01`;
    getContracts({ date })
      .then(setContracts)
      .catch(() => setContracts([]))
      .finally(() => setLoading(false));
  }, [year, month]);

  const prevMonth = () => {
    const ny = month === 1 ? year - 1 : year;
    const nm = month === 1 ? 12 : month - 1;
    setYear(ny);
    setMonth(nm);
    router.replace(`/contracts?year=${ny}&month=${nm}`, { scroll: false });
  };
  const nextMonth = () => {
    const ny = month === 12 ? year + 1 : year;
    const nm = month === 12 ? 1 : month + 1;
    setYear(ny);
    setMonth(nm);
    router.replace(`/contracts?year=${ny}&month=${nm}`, { scroll: false });
  };

  const byDate = (a: Contract, b: Contract) =>
    a.expectedPaymentDate.localeCompare(b.expectedPaymentDate);

  const todayMs = new Date().setHours(0, 0, 0, 0);
  const tbcEndMs = (c: Contract) => {
    const pay = new Date(c.expectedPaymentDate).setHours(0, 0, 0, 0);
    return pay + 2 * 86_400_000;
  };

  const inProgress = contracts
    .filter(c =>
      c.contractStatus !== 'PAID' &&
      c.contractStatus !== 'CANCELLED' &&
      todayMs <= tbcEndMs(c),
    )
    .sort(byDate);
  const completed = contracts
    .filter(c =>
      c.contractStatus === 'PAID' ||
      c.contractStatus === 'CANCELLED' ||
      todayMs > tbcEndMs(c),
    )
    .sort(byDate);

  return (
    <div className="flex flex-col h-screen bg-bg">

      {/* 헤더 */}
      <div className="relative flex items-center px-5 py-4 shrink-0">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-800" />
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">계약 현황</span>
      </div>

      {/* 월 네비게이션 */}
      <div className="flex items-center justify-center gap-4 pb-3 shrink-0">
        <button
          onClick={prevMonth}
          className="w-7 h-7 bg-primary-50 border border-primary-100 rounded-full flex items-center justify-center text-primary-700"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-base font-bold text-gray-900 w-24 text-center">
          {year}년 {month}월
        </span>
        <button
          onClick={nextMonth}
          className="w-7 h-7 bg-primary-50 border border-primary-100 rounded-full flex items-center justify-center text-primary-700"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* 리스트 */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-5 min-h-0">
        {loading ? (
          <div className="text-sm text-gray-400 text-center py-12">불러오는 중...</div>
        ) : contracts.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-12 bg-gray-50 rounded-2xl">
            등록된 계약이 없어요
          </div>
        ) : (
          <>
            {inProgress.length > 0 && (
              <div className="bg-bg-card shadow-md rounded-2xl px-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900">진행 중인 계약</h2>
                  <span className="text-xs text-gray-400">{inProgress.length}건</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {inProgress.map(c => (
                    <ContractRow
                      key={c.contractId}
                      contract={c}
                      onClick={() => router.push(`/contracts/${c.contractId}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {completed.length > 0 && (
              <div className="bg-bg-card shadow-md rounded-2xl px-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900">계약 완료</h2>
                  <span className="text-xs text-gray-400">{completed.length}건</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {completed.map(c => (
                    <ContractRow
                      key={c.contractId}
                      contract={c}
                      onClick={() => router.push(`/contracts/${c.contractId}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

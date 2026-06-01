'use client';

import { useState } from 'react';
import BottomNav from '@/components/main/BottomNav';
import { createContract } from '@/api/virtualSalary';
import type { TaxType } from '@/types/virtualSalary';

const TAX_OPTIONS: { value: TaxType; label: string; rate: number }[] = [
  { value: 'BUSINESS', label: '사업소득', rate: 0.033 },
  { value: 'ETC',      label: '기타소득', rate: 0.088 },
  { value: 'ARTIST',   label: '예술인',   rate: 0.088 },
];

interface ContractRegisterViewProps {
  onBack:   () => void;
  onSubmit: () => void;
}

export default function ContractRegisterView({ onBack, onSubmit }: ContractRegisterViewProps) {
  const [name, setName]           = useState('');
  const [amount, setAmount]       = useState('');
  const [date, setDate]           = useState('');
  const [taxType, setTaxType]     = useState<TaxType>('BUSINESS');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const rawAmount   = Number(amount.replace(/[^0-9]/g, '')) || 0;
  const selectedTax = TAX_OPTIONS.find(t => t.value === taxType)!;
  const deduction   = Math.floor(rawAmount * selectedTax.rate);
  const netAmount   = rawAmount - deduction;

  const fmt = (n: number) => n > 0 ? `${n.toLocaleString()} 원` : '-';

  const handleAmountChange = (v: string) => {
    const num = v.replace(/[^0-9]/g, '');
    setAmount(num ? Number(num).toLocaleString() : '');
  };

  const isValid = name.trim().length > 0 && rawAmount > 0 && date.length > 0;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await createContract({
        clientName: name.trim(),
        contractAmount: rawAmount,
        taxType,
        expectedPaymentDate: date,
      });
      onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : '계약 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">

      {/* 헤더 */}
      <div className="flex items-center px-5 py-4 shrink-0 relative">
        <button
          onClick={onBack}
          className="bg-gray-200 text-gray-700 text-sm font-medium px-4 py-1.5 rounded-full"
        >
          뒤로
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">
          계약 등록
        </span>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-6">

        {/* 계약 정보 입력 */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">계약 정보 입력</h2>
          <div className="space-y-4">

            {/* 거래처 명 */}
            <div>
              <label className="text-sm text-gray-700 mb-1.5 block">
                거래처 명 <span className="text-sky-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="A 클라이언트"
                className="w-full bg-gray-500 text-white placeholder:text-gray-300 rounded-xl px-4 py-3 text-sm outline-none"
              />
            </div>

            {/* 계약 금액 */}
            <div>
              <label className="text-sm text-gray-700 mb-1.5 block">
                계약 금액 <span className="text-sky-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={amount ?? ''}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="1,123,400"
                className="w-full bg-gray-500 text-white placeholder:text-gray-300 rounded-xl px-4 py-3 text-sm outline-none"
              />
            </div>

            {/* 입금 예정일 */}
            <div>
              <label className="text-sm text-gray-700 mb-1.5 block">
                입금 예정일 <span className="text-sky-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-500 text-white placeholder:text-gray-300 rounded-xl px-4 py-3 text-sm outline-none [color-scheme:dark]"
              />
            </div>

            {/* 세금 유형 선택 */}
            <div>
              <label className="text-sm text-gray-700 mb-2 block">세금 유형 선택</label>
              <div className="flex gap-2">
                {TAX_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTaxType(opt.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      taxType === opt.value
                        ? 'bg-sky-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 실수령액 미리보기 */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">실수령액 미리보기</h2>
          <div className="bg-gray-500 rounded-2xl px-5 py-4 text-white space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">계약 금액</span>
              <span>{fmt(rawAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">공제율 ({(selectedTax.rate * 100).toFixed(1)}%)</span>
              <span>{deduction > 0 ? `- ${deduction.toLocaleString()} 원` : '-'}</span>
            </div>
            <div className="h-px bg-gray-400 my-1" />
            <div className="flex items-center justify-between">
              <span className="font-bold">실수령액</span>
              <span className="font-bold text-base">{fmt(netAmount)}</span>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="flex gap-3 pb-2">
          <button
            onClick={onBack}
            disabled={submitting}
            className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-2xl text-sm disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="flex-1 py-3 bg-sky-500 text-white font-semibold rounded-2xl text-sm disabled:opacity-50"
          >
            {submitting ? '등록 중...' : '등록'}
          </button>
        </div>

      </div>

      <BottomNav />
    </div>
  );
}

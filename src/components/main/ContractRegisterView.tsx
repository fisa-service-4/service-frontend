"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import BottomNav from "@/components/main/BottomNav";
import { createContract } from "@/api/virtualSalary";
import type { TaxType } from "@/types/virtualSalary";

const TAX_OPTIONS: { value: TaxType; label: string; rate: number; desc: string }[] = [
  { value: "BUSINESS", label: "사업소득", rate: 0.033, desc: "일반 프리랜서·용역" },
  { value: "ETC", label: "기타소득", rate: 0.088, desc: "일시적 강연·원고료 등" },
  { value: "ARTIST", label: "예술인", rate: 0.033, desc: "예술인복지법 적용 대상" },
];

interface ContractRegisterViewProps {
  onBack: () => void;
  onSubmit: () => void;
}

export default function ContractRegisterView({
  onBack,
  onSubmit,
}: ContractRegisterViewProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [taxType, setTaxType] = useState<TaxType>("BUSINESS");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rawAmount = Number(amount.replace(/[^0-9]/g, "")) || 0;
  const selectedTax = TAX_OPTIONS.find((t) => t.value === taxType)!;
  const deduction = Math.floor(rawAmount * selectedTax.rate);
  const netAmount = rawAmount - deduction;

  const fmt = (n: number) => (n > 0 ? `${n.toLocaleString()} 원` : "-");

  const handleAmountChange = (v: string) => {
    const num = v.replace(/[^0-9]/g, "");
    setAmount(num ? Number(num).toLocaleString() : "");
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
      setError(
        err instanceof Error ? err.message : "저장 중에 오류가 발생했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* 헤더 */}
      <div className="flex items-center px-5 py-3 bg-bg shrink-0 relative">
        <button onClick={onBack}>
          <ArrowLeft size={22} className="text-gray-800" />
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">
          계약 등록
        </span>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4 space-y-6">
        {/* 계약 정보 입력 */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            계약 정보 입력
          </h2>
          <div className="space-y-4">
            {/* 거래처 명 */}
            <div>
              <label className="text-sm text-gray-700 mb-1.5 block">
                거래처 명 <span className="text-primary-500">*</span>
              </label>
              <div className="bg-bg-card rounded-xl border border-primary-300">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="A 클라이언트"
                  className="w-full bg-transparent text-gray-900 placeholder:text-gray-300 px-4 py-3 text-sm outline-none"
                />
              </div>
            </div>

            {/* 계약 금액 */}
            <div>
              <label className="text-sm text-gray-700 mb-1.5 block">
                계약 금액 <span className="text-primary-500">*</span>
              </label>
              <div className="bg-bg-card rounded-xl border border-primary-300">
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount ?? ""}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="1,123,400"
                  className="w-full bg-transparent text-gray-900 placeholder:text-gray-300 px-4 py-3 text-sm outline-none"
                />
              </div>
            </div>

            {/* 입금 예정일 */}
            <div>
              <label className="text-sm text-gray-700 mb-1.5 block">
                입금 예정일 <span className="text-primary-500">*</span>
              </label>
              <div className="bg-bg-card rounded-xl border border-primary-300">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent text-gray-900 placeholder:text-gray-300 px-4 py-3 text-sm outline-none"
                />
              </div>
            </div>

            {/* 세금 공제 방식 */}
            <div>
              <label className="text-sm text-gray-700 mb-2 block">
                세금 공제 방식
              </label>
              <div className="flex flex-wrap gap-2">
                {TAX_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTaxType(opt.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      taxType === opt.value
                        ? "bg-primary-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 세후 실수령액 미리보기 */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            세후 실수령액 미리보기
          </h2>
          <div className="bg-primary-50 rounded-2xl px-5 py-4 text-slate-800 border border-primary-100 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">계약 금액</span>
              <span>{fmt(rawAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">
                공제액 ({(selectedTax.rate * 100).toFixed(1)}%)
              </span>
              <span>
                {deduction > 0 ? `- ${deduction.toLocaleString()} 원` : "-"}
              </span>
            </div>
            <div className="h-px bg-primary-100 my-1" />
            <div className="flex items-center justify-between">
              <span className="font-bold">실수령액</span>
              <span className="font-bold text-base">{fmt(netAmount)}</span>
            </div>
          </div>
        </div>

        {/* 오류 메시지 */}
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
            className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-2xl text-sm disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="flex-1 py-3 bg-primary-500 text-white font-semibold rounded-2xl text-sm disabled:opacity-50"
          >
            {submitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getContract,
  getPaymentMatchings,
  manualMatch,
} from "@/api/virtualSalary";
import type {
  Contract,
  PaymentMatching,
  MatchingStatus,
} from "@/types/virtualSalary";
import BottomNav from "@/components/main/BottomNav";

const fmt = (n: number) => `${n.toLocaleString()} 원`;

const TAX_RATE: Record<string, number> = {
  BUSINESS: 0.033,
  ETC: 0.033,
  ARTIST: 0.033,
};
const TAX_LABEL: Record<string, string> = {
  BUSINESS: "3.3%",
  ETC: "3.3%",
  ARTIST: "3.3%",
};

// 입금 분류 표시
const MATCHING_LABEL: Record<MatchingStatus, { text: string; color: string }> =
  {
    MATCHED: { text: "정상입금", color: "text-gray-900" },
    FAILED: { text: "실패", color: "text-red-600" },
    TBC: { text: "확인 중", color: "text-amber-600" },
  };

// 헤더 배지: 매칭 상태 우선, 없으면 계약 상태 + 날짜 계산
function getDetailBadge(
  contract: Contract,
  matching: PaymentMatching | null,
): { label: string; style: string } {
  if (matching) {
    switch (matching.matchingStatus) {
      case "MATCHED":
        return { label: "입금완료", style: "text-gray-500 bg-gray-100" };
      case "FAILED": {
        const todayF = new Date();
        todayF.setHours(0, 0, 0, 0);
        const payF = new Date(contract.expectedPaymentDate);
        payF.setHours(0, 0, 0, 0);
        const tbcStartF = new Date(payF);
        tbcStartF.setDate(payF.getDate() - 2);
        const tbcEndF = new Date(payF);
        tbcEndF.setDate(payF.getDate() + 2);
        if (todayF >= tbcStartF && todayF <= tbcEndF)
          return { label: "확인 중", style: "text-amber-600 bg-amber-100" };
        return { label: "실패", style: "text-red-600 bg-red-100" };
      }
      case "TBC": {
        const todayTbc = new Date();
        todayTbc.setHours(0, 0, 0, 0);
        const payTbc = new Date(contract.expectedPaymentDate);
        payTbc.setHours(0, 0, 0, 0);
        const tbcEnd = new Date(payTbc);
        tbcEnd.setDate(payTbc.getDate() + 2);
        return todayTbc > tbcEnd
          ? { label: "실패", style: "text-red-600 bg-red-100" }
          : { label: "확인 중", style: "text-amber-600 bg-amber-100" };
      }
    }
  }
  if (contract.contractStatus === "CANCELLED")
    return { label: "취소", style: "text-gray-400 bg-gray-100" };
  if (contract.contractStatus === "PAID")
    return { label: "입금완료", style: "text-gray-500 bg-gray-100" };

  // PENDING 또는 DELAYED: TBC 기간 먼저 확인 (백엔드가 DELAYED 처리해도 TBC 기간이면 확인 중)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pay = new Date(contract.expectedPaymentDate);
  pay.setHours(0, 0, 0, 0);
  const tbcStart = new Date(pay);
  tbcStart.setDate(pay.getDate() - 2);
  const tbcEnd = new Date(pay);
  tbcEnd.setDate(pay.getDate() + 2);

  if (today > tbcEnd)
    return { label: "실패", style: "text-red-600 bg-red-100" };
  if (today >= tbcStart)
    return { label: "확인 중", style: "text-amber-600 bg-amber-100" };
  if (contract.contractStatus === "DELAYED")
    return { label: "실패", style: "text-red-600 bg-red-100" };
  return { label: "입금 전", style: "text-primary-700 bg-primary-100" };
}

function Row({
  label,
  value,
  valueClass = "text-gray-900",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

interface Props {
  contractId: number;
}

export default function ContractDetailView({ contractId }: Props) {
  const router = useRouter();

  const [contract, setContract] = useState<Contract | null>(null);
  const [matching, setMatching] = useState<PaymentMatching | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getContract(contractId)
      .then((c) => {
        if (!cancelled) {
          setContract(c);
          setFetchError(null);
        }
      })
      .catch((err) => {
        if (!cancelled)
          setFetchError(
            err instanceof Error
              ? err.message
              : "계약 정보를 불러올 수 없습니다.",
          );
      });
    getPaymentMatchings({ contractId })
      .then((ms) => {
        if (!cancelled) setMatching(ms[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setMatching(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contractId, refreshKey]);

  const handleComplete = async () => {
    if (submitting) return;
    if (!matching) {
      setSubmitErr("입금 확인 중 정보가 없습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    const bankTransactionId = matching.bankTransactionId ?? 0;
    setSubmitting(true);
    setSubmitErr(null);
    try {
      await manualMatch(matching.matchingId, {
        bankTransactionId,
        matchedBy: "USER",
      });
      setLoading(true);
      setRefreshKey((k) => k + 1);
      setShowConfirm(false);
    } catch (err) {
      setSubmitErr(
        err instanceof Error ? err.message : "처리 중 오류가 발생했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-bg">
        <div className="flex items-center px-5 py-3 bg-bg shrink-0">
          <button onClick={() => router.back()}>
            <ArrowLeft size={22} className="text-gray-800" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          불러오는 중...
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex flex-col h-screen bg-bg">
        <div className="flex items-center px-5 py-3 bg-bg shrink-0">
          <button onClick={() => router.back()}>
            <ArrowLeft size={22} className="text-gray-800" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5">
          <p className="text-sm text-gray-400 text-center">
            {fetchError ?? "계약 정보를 불러올 수 없습니다."}
          </p>
          <button
            onClick={() => {
              setLoading(true);
              setRefreshKey((k) => k + 1);
            }}
            className="text-sm text-primary-700 font-medium"
          >
            다시 시도
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const taxRate = TAX_RATE[contract.taxType] ?? 0.033;
  const taxLabel = TAX_LABEL[contract.taxType] ?? "3.3%";
  const deducted =
    contract.settlement?.deductedAmount ??
    Math.floor(contract.contractAmount * taxRate);
  const actualIncome =
    contract.settlement?.actualIncome ?? contract.contractAmount - deducted;

  const badge = getDetailBadge(contract, matching);

  const todayMs = new Date().setHours(0, 0, 0, 0);
  const payMs = new Date(contract.expectedPaymentDate).setHours(0, 0, 0, 0);
  const tbcStartMs = payMs - 2 * 86_400_000;
  const tbcEndMs = payMs + 2 * 86_400_000;
  const inTbcPeriod = todayMs >= tbcStartMs && todayMs <= tbcEndMs;

  // TBC: bankTransactionId 유무로 case 1(미입금) / case 3(불일치) 구분
  const tbcMismatch =
    matching?.matchingStatus === "TBC" && !!matching.bankTransactionId;
  const matchLabel = (() => {
    if (!matching) return null;
    if (matching.matchingStatus === "TBC") {
      if (todayMs > tbcEndMs) return { text: "실패", color: "text-red-600" };
      return tbcMismatch
        ? { text: "불일치", color: "text-amber-600" }
        : { text: "확인 중", color: "text-amber-600" };
    }
    if (
      matching.matchingStatus === "MATCHED" &&
      matching.matchedBy === "USER"
    ) {
      return { text: "완료", color: "text-primary-700" };
    }
    return MATCHING_LABEL[matching.matchingStatus];
  })();

  const isManual =
    matching?.matchingStatus === "MATCHED" && matching.matchedBy === "USER";

  const isComplete =
    contract.contractStatus === "PAID" ||
    contract.contractStatus === "CANCELLED" ||
    (contract.contractStatus === "DELAYED" && todayMs > tbcEndMs) ||
    matching?.matchingStatus === "MATCHED" ||
    matching?.matchingStatus === "FAILED";
  const canComplete = !isComplete && inTbcPeriod;

  // 입금 지연일: FAILED / DELAYED(TBC 기간 경과 후) / TBC case 1(미입금) + 입금일 초과
  const tbcPastDue =
    matching?.matchingStatus === "TBC" &&
    !matching.bankTransactionId &&
    todayMs > payMs;
  const isFailedState =
    matching?.matchingStatus === "FAILED" ||
    (contract.contractStatus === "DELAYED" && todayMs > tbcEndMs) ||
    tbcPastDue;
  const delayDays = isFailedState
    ? Math.max(0, Math.floor((todayMs - payMs) / 86_400_000))
    : null;

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* 헤더 */}
      <div className="px-5 py-3 bg-bg shrink-0">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-800" />
        </button>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6">
        {/* 헤더: 클라이언트명 + 배지 */}
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-bold text-gray-900">
            {contract.clientName}
          </h1>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${badge.style}`}
          >
            {badge.label}
          </span>
        </div>
        <div className="h-px bg-gray-200 mb-4" />

        {/* 상세 정보 */}
        <div className="mb-5">
          <Row label="계약 금액" value={fmt(contract.contractAmount)} />
          <Row label="입금 예정일" value={contract.expectedPaymentDate} />

          {/* TBC 확인 기간: TBC 기간 중이면 항상 표시 */}
          {inTbcPeriod &&
            (() => {
              const pay = new Date(contract.expectedPaymentDate);
              const s = new Date(pay);
              s.setDate(pay.getDate() - 2);
              const e = new Date(pay);
              e.setDate(pay.getDate() + 2);
              const fmt2 = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
              return (
                <Row label="확인 기간" value={`${fmt2(s)} ~ ${fmt2(e)}`} />
              );
            })()}

          {/* 입금일: MATCHED 또는 TBC case 3 (불일치) */}
          {(matching?.matchingStatus === "MATCHED" || tbcMismatch) &&
            matching?.matchedAt && (
              <Row label="입금일 (거래 시간)" value={matching.matchedAt} />
            )}

          {/* 완료일: MANUAL_MATCHED */}
          {isManual && matching?.matchedAt && (
            <Row label="완료일" value={matching.matchedAt.split("T")[0]} />
          )}

          {/* 입금 지연일: FAILED */}
          {delayDays !== null && (
            <Row label="입금 지연일" value={`D+${delayDays}`} />
          )}

          {/* 입금 분류 */}
          {matchLabel && (
            <Row
              label="입금 분류"
              value={matchLabel.text}
              valueClass={matchLabel.color}
            />
          )}

          <Row label="예상 금액" value={fmt(actualIncome)} />
        </div>

        <div className="bg-gray-100 rounded-2xl px-4 py-3 space-y-2 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">계약 금액</span>
            <span className="text-sm text-gray-700">
              {fmt(contract.contractAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">공제율 ({taxLabel})</span>
            <span className="text-sm text-gray-700">- {fmt(deducted)}</span>
          </div>
          <div className="h-px bg-gray-300" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              예상 금액
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {fmt(actualIncome)}
            </span>
          </div>
        </div>

        {/* 거래 금액 (실입금액) */}
        {(matching?.matchingStatus === "MATCHED" ||
          (tbcMismatch && matching?.transactionAmount != null)) && (
          <div className="mb-5">
            <Row
              label="거래 금액 (실입금액)"
              value={fmt(
                tbcMismatch
                  ? matching!.transactionAmount!
                  : (matching!.transactionAmount ?? actualIncome),
              )}
            />
          </div>
        )}

        {/* 확인 패널 */}
        {showConfirm && (
          <div className="mb-4 bg-primary-50 border border-primary-100 rounded-2xl px-4 py-4">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              완료 처리하시겠습니까?
            </p>
            <p className="text-xs text-gray-500 mb-3">
              {contract.clientName} · {fmt(contract.contractAmount)}
            </p>
            {submitErr && (
              <p className="text-red-500 text-xs mb-2">{submitErr}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setSubmitErr(null);
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl text-sm"
              >
                취소
              </button>
              <button
                onClick={handleComplete}
                disabled={submitting}
                className="flex-1 py-3 bg-primary-500 text-white font-semibold rounded-xl text-sm disabled:opacity-50"
              >
                {submitting ? "처리 중..." : "완료"}
              </button>
            </div>
          </div>
        )}

        {/* 하단 버튼 */}
        {canComplete && !showConfirm && (
          <div className="mt-4">
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full py-3.5 bg-primary-500 text-white font-semibold rounded-2xl text-sm"
            >
              완료 처리하기
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

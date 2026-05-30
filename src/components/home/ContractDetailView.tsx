'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getContract, getPaymentMatchings, manualMatch } from '@/api/virtualSalary';
import type { Contract, PaymentMatching, MatchingStatus } from '@/types/virtualSalary';
import BottomNav from '@/components/main/BottomNav';

const fmt = (n: number) => `₩ ${n.toLocaleString()}`;

const TAX_RATE: Record<string, number> = {
  BUSINESS: 0.033,
  ETC:      0.088,
  ARTIST:   0.088,
};
const TAX_LABEL: Record<string, string> = {
  BUSINESS: '3.3%',
  ETC:      '8.8%',
  ARTIST:   '8.8%',
};

// 입금 분류 표시
const MATCHING_LABEL: Record<MatchingStatus, { text: string; color: string }> = {
  MATCHED:        { text: '정상입금', color: 'text-gray-900' },
  MANUAL_MATCHED: { text: '수동완료', color: 'text-sky-600' },
  FAILED:         { text: '미입금',   color: 'text-red-500' },
  TBC:            { text: '확인 중',  color: 'text-amber-600' },
};

// 헤더 배지: 매칭 상태 우선, 없으면 계약 상태 + 날짜 계산
function getDetailBadge(
  contract: Contract,
  matching: PaymentMatching | null,
): { label: string; style: string } {
  if (matching) {
    switch (matching.matchingStatus) {
      case 'TBC':            return { label: '확인 중',  style: 'text-amber-600 bg-amber-100' };
      case 'MATCHED':        return { label: '입금완료', style: 'text-sky-600 bg-sky-100' };
      case 'MANUAL_MATCHED': return { label: '수동완료', style: 'text-sky-600 bg-sky-100' };
      case 'FAILED':         return { label: '미입금',   style: 'text-red-500 bg-red-100' };
    }
  }
  if (contract.contractStatus === 'CANCELLED') return { label: '취소',     style: 'text-gray-400 bg-gray-100' };
  if (contract.contractStatus === 'PAID')      return { label: '입금완료', style: 'text-sky-600 bg-sky-100' };
  if (contract.contractStatus === 'DELAYED')   return { label: '미입금',   style: 'text-red-500 bg-red-100' };

  // PENDING: TBC 기간 기반 계산
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pay = new Date(contract.expectedPaymentDate);
  pay.setHours(0, 0, 0, 0);
  const tbcStart = new Date(pay); tbcStart.setDate(pay.getDate() - 2);
  const tbcEnd   = new Date(pay); tbcEnd.setDate(pay.getDate() + 2);

  if (today > tbcEnd)    return { label: '미입금',  style: 'text-red-500 bg-red-100' };
  if (today >= tbcStart) return { label: '확인 중', style: 'text-amber-600 bg-amber-100' };
  return { label: '입금 전', style: 'text-gray-500 bg-gray-100' };
}

function Row({ label, value, valueClass = 'text-gray-900' }: {
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

interface Props { contractId: number }

export default function ContractDetailView({ contractId }: Props) {
  const router = useRouter();

  const [contract,   setContract]   = useState<Contract | null>(null);
  const [matching,   setMatching]   = useState<PaymentMatching | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showInput,  setShowInput]  = useState(false);
  const [txId,       setTxId]       = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [submitErr,   setSubmitErr]   = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setFetchError(null);
    // getContract 실패 시에도 matching은 시도
    getContract(contractId)
      .then(c => setContract(c))
      .catch(err => setFetchError(err instanceof Error ? err.message : '계약 정보를 불러올 수 없습니다.'));
    getPaymentMatchings({ contractId })
      .then(ms => setMatching(ms[0] ?? null))
      .catch(() => setMatching(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [contractId]);

  const handleManualMatch = async () => {
    if (!matching || submitting) return;

    // TBC(bankTransactionId 있음): 기존 ID 재사용 / FAILED 또는 TBC(ID 없음): 사용자 입력
    const bankTransactionId = matching.matchingStatus === 'TBC' && matching.bankTransactionId
      ? matching.bankTransactionId
      : Number(txId);

    if (!bankTransactionId) { setSubmitErr('거래 ID를 입력해주세요.'); return; }

    setSubmitting(true);
    setSubmitErr(null);
    try {
      await manualMatch(matching.matchingId, { bankTransactionId, matchedBy: 'USER' });
      fetchData();
      setShowInput(false);
      setShowConfirm(false);
      setTxId('');
    } catch (err) {
      setSubmitErr(err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="flex items-center px-5 py-4 shrink-0">
          <button onClick={() => router.back()} className="bg-gray-100 text-gray-700 text-sm font-medium px-4 py-1.5 rounded-full">
            뒤로
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">불러오는 중...</div>
        <BottomNav />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="flex items-center px-5 py-4 shrink-0">
          <button onClick={() => router.back()} className="bg-gray-100 text-gray-700 text-sm font-medium px-4 py-1.5 rounded-full">
            뒤로
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5">
          <p className="text-sm text-gray-400 text-center">
            {fetchError ?? '계약 정보를 불러올 수 없습니다.'}
          </p>
          <button
            onClick={fetchData}
            className="text-sm text-sky-600 font-medium"
          >
            다시 시도
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const taxRate      = TAX_RATE[contract.taxType] ?? 0.033;
  const taxLabel     = TAX_LABEL[contract.taxType] ?? '3.3%';
  const deducted     = contract.settlement?.deductedAmount  ?? Math.floor(contract.contractAmount * taxRate);
  const actualIncome = contract.settlement?.actualIncome    ?? (contract.contractAmount - deducted);

  const badge = getDetailBadge(contract, matching);

  // TBC: bankTransactionId 유무로 case 1(미입금) / case 3(불일치) 구분
  const tbcMismatch = matching?.matchingStatus === 'TBC' && !!matching.bankTransactionId;
  const matchLabel = (() => {
    if (!matching) return null;
    if (matching.matchingStatus === 'TBC') {
      return tbcMismatch
        ? { text: '불일치', color: 'text-amber-600' }
        : { text: '미입금',  color: 'text-red-500' };
    }
    return MATCHING_LABEL[matching.matchingStatus];
  })();

  const isManual = matching?.matchingStatus === 'MANUAL_MATCHED';

  // 수동 완료 버튼 노출 조건
  const isTbcCase1      = matching?.matchingStatus === 'TBC' && !matching.bankTransactionId;  // 확인중 + 미입금
  const isTbcCase3      = matching?.matchingStatus === 'TBC' && !!matching.bankTransactionId; // 확인중 + 불일치
  const isFailed        = matching?.matchingStatus === 'FAILED';                               // 실패 + 미입금
  const showManualButton = isTbcCase1 || isTbcCase3 || isFailed;
  // TBC case 3는 이미 bankTransactionId 보유 → 거래 ID 입력 불필요
  const needsTxInput    = isTbcCase1 || isFailed;

  // 입금 지연일: FAILED / DELAYED / TBC case 1(미입금) + 입금일 초과
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const payMs   = new Date(contract.expectedPaymentDate).setHours(0, 0, 0, 0);
  const tbcPastDue    = matching?.matchingStatus === 'TBC' && !matching.bankTransactionId && todayMs > payMs;
  const isFailedState = matching?.matchingStatus === 'FAILED' || contract.contractStatus === 'DELAYED' || tbcPastDue;
  const delayDays = isFailedState
    ? Math.max(0, Math.floor((todayMs - payMs) / 86_400_000))
    : null;

  return (
    <div className="flex flex-col h-screen bg-white">

      {/* 뒤로 버튼 */}
      <div className="px-5 py-4 shrink-0">
        <button
          onClick={() => router.back()}
          className="bg-gray-100 text-gray-700 text-sm font-medium px-4 py-1.5 rounded-full"
        >
          뒤로
        </button>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">

        {/* 헤더: 클라이언트명 + 배지 */}
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-bold text-gray-900">{contract.clientName}</h1>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badge.style}`}>
            {badge.label}
          </span>
        </div>
        <div className="h-px bg-gray-200 mb-4" />

        {/* 상세 정보 */}
        <div className="mb-5">
          <Row label="계약 금액" value={fmt(contract.contractAmount)} />
          <Row label="입금 예정일" value={contract.expectedPaymentDate} />

          {/* TBC 확인 기간: 입금예정일 -2 ~ +2 */}
          {matching?.matchingStatus === 'TBC' && (() => {
            const pay = new Date(contract.expectedPaymentDate);
            const s = new Date(pay); s.setDate(pay.getDate() - 2);
            const e = new Date(pay); e.setDate(pay.getDate() + 2);
            const fmt2 = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
            return <Row label="확인 기간" value={`${fmt2(s)} ~ ${fmt2(e)}`} />;
          })()}

          {/* 입금일: MATCHED 또는 TBC case 3 (불일치) */}
          {(matching?.matchingStatus === 'MATCHED' || tbcMismatch) && matching?.matchedAt && (
            <Row label="입금일 (거래 시간)" value={matching.matchedAt} />
          )}

          {/* 완료일: MANUAL_MATCHED */}
          {isManual && matching?.matchedAt && (
            <Row label="완료일" value={matching.matchedAt.split('T')[0]} />
          )}

          {/* 입금 지연일: FAILED */}
          {delayDays !== null && (
            <Row label="입금 지연일" value={`D+${delayDays}`} />
          )}

          {/* 입금 분류 */}
          {matchLabel && (
            <Row label="입금 분류" value={matchLabel.text} valueClass={matchLabel.color} />
          )}

          <Row label="예상 금액" value={fmt(actualIncome)} />
        </div>

        <div className="bg-gray-100 rounded-2xl px-4 py-3 space-y-2 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">계약 금액</span>
            <span className="text-sm text-gray-700">{fmt(contract.contractAmount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">공제율 ({taxLabel})</span>
            <span className="text-sm text-gray-700">- {fmt(deducted)}</span>
          </div>
          <div className="h-px bg-gray-300" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">예상 금액</span>
            <span className="text-sm font-semibold text-gray-900">{fmt(actualIncome)}</span>
          </div>
        </div>

        {/* 거래 금액 (실입금액): MATCHED 또는 TBC case 3(불일치) */}
        {(matching?.matchingStatus === 'MATCHED' || tbcMismatch) && matching && (
          <div className="mb-5">
            <Row
              label="거래 금액 ( 실입금액)"
              value={fmt(matching.transactionAmount ?? actualIncome)}
            />
          </div>
        )}

        {/* 거래 ID 입력 (FAILED 또는 TBC 미입금) */}
        {showManualButton && showInput && needsTxInput && !showConfirm && (
          <div className="mb-4 space-y-2">
            <p className="text-xs text-gray-400">
              은행 거래 내역에서 확인한 거래 ID를 입력하세요.
            </p>
            <div className="flex items-center bg-gray-100 rounded-xl px-4 py-3">
              <input
                autoFocus
                type="text"
                inputMode="numeric"
                value={txId}
                onChange={e => setTxId(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="거래 ID 입력"
                className="flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
              />
            </div>
            {submitErr && <p className="text-red-500 text-xs">{submitErr}</p>}
          </div>
        )}

        {/* 최종 확인 패널 */}
        {showConfirm && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4">
            <p className="text-sm font-semibold text-gray-900 mb-1">입금 완료로 변경하시겠습니까?</p>
            <p className="text-xs text-gray-500 mb-3">{contract.clientName} · {fmt(contract.contractAmount)}</p>
            {submitErr && <p className="text-red-500 text-xs mb-2">{submitErr}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirm(false); setSubmitErr(null); }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl text-sm"
              >
                취소
              </button>
              <button
                onClick={handleManualMatch}
                disabled={submitting}
                className="flex-1 py-3 bg-sky-500 text-white font-semibold rounded-xl text-sm disabled:opacity-50"
              >
                {submitting ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="space-y-3 mt-4">
          {showManualButton && !showConfirm && (
            <>
              {!showInput ? (
                <button
                  onClick={() => {
                    if (needsTxInput) {
                      setShowInput(true);
                    } else {
                      setShowConfirm(true);
                    }
                  }}
                  className="w-full py-3.5 bg-sky-500 text-white font-semibold rounded-2xl text-sm"
                >
                  입금 완료로 변경하기
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowInput(false); setTxId(''); setSubmitErr(null); }}
                    className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-semibold rounded-2xl text-sm"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => {
                      if (!txId) { setSubmitErr('거래 ID를 입력해주세요.'); return; }
                      setSubmitErr(null);
                      setShowConfirm(true);
                    }}
                    className="flex-1 py-3.5 bg-sky-500 text-white font-semibold rounded-2xl text-sm"
                  >
                    완료로 변경
                  </button>
                </div>
              )}
            </>
          )}

          <button
            onClick={() => router.back()}
            className="w-full py-3.5 bg-gray-100 text-gray-600 font-semibold rounded-2xl text-sm"
          >
            확인
          </button>
        </div>

      </div>

      <BottomNav />
    </div>
  );
}

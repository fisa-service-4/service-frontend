'use client';

import { useState } from 'react';
import { ArrowLeft, ChevronDown, Check, Info } from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import PinKeypad from '@/components/PinKeypad';
import { apiRequest, ApiError } from '@/utils/apiClient';
import { createTransfer, approveTransfer } from '@/api/bank';
import type { BankAccount } from '@/types/bank';

type Step = 'form' | 'confirm' | 'pin' | 'complete';

const BANKS = [
  { code: '004', name: 'KB국민은행',  logo: '/banks/KB.png' },
  { code: '088', name: '신한은행',    logo: '/banks/Shinhan.png' },
  { code: '020', name: '우리은행',    logo: '/banks/Woori.png' },
  { code: '081', name: '하나은행',    logo: '/banks/Hana.png' },
  { code: '011', name: 'NH농협은행',  logo: '/banks/NH.png' },
  { code: '003', name: 'IBK기업은행', logo: '/banks/IBK.png' },
  { code: '023', name: 'SC제일은행',  logo: '/banks/SC.png' },
  { code: '027', name: '씨티은행',    logo: null },
  { code: '090', name: '카카오뱅크',  logo: '/banks/Kakao.png' },
  { code: '092', name: '토스뱅크',   logo: '/banks/Toss.png' },
];

const BANK_MAP: Record<string, string> = Object.fromEntries(
  BANKS.map((b) => [b.code, b.name])
);

const ROLE_LABEL: Record<string, string> = {
  DEPOSIT:   '입출금',
  SALARY:    '실수령액',
  EMERGENCY: '비상금',
  STOCK:     '주식',
};

function formatKRW(n: number | null | undefined) {
  if (n == null) return '-';
  return `${n.toLocaleString('ko-KR')} 원`;
}

interface TransferViewProps {
  accounts: BankAccount[];
  onBack: () => void;
  onComplete?: () => void;
}

// 1. 중복 선언되었던 함수 정의 부분을 하나로 병합
export default function TransferView({ accounts, onBack, onComplete }: TransferViewProps) {
  const [step, setStep]                 = useState<Step>('form');
  const [fromId, setFromId]             = useState(accounts[0]?.accountId ?? 0);
  const [toBankCode, setToBankCode]     = useState('');
  const [toNumber, setToNumber]         = useState('');
  const [rawAmount, setRawAmount]       = useState('');
  const [showFromDrop, setShowFromDrop] = useState(false);
  const [showBankSheet, setShowBankSheet] = useState(false);

  const [pin, setPin]               = useState('');
  const [pinError, setPinError]     = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinLocked, setPinLocked]   = useState(false);
  const [pinFailCount, setPinFailCount] = useState(0);

  const [completedAt, setCompletedAt] = useState('');
  const [formError, setFormError]     = useState('');

  const fromAccount  = accounts.find((a) => a.accountId === fromId) ?? accounts[0];
  const parsedAmount = parseInt(rawAmount || '0', 10);
  const afterBalance = (fromAccount?.balance ?? 0) - parsedAmount;

  const accountLabel = (a: BankAccount | undefined) =>
    a ? `${ROLE_LABEL[a.accountRole ?? ''] ?? '계좌'} 계좌` : '-';

  /* ── 폼 → 확인 ── */
  function handleNext() {
    if (!toBankCode) {
      setFormError('입금 은행을 선택해 주세요.');
      return;
    }
    if (!toNumber.trim()) {
      setFormError('입금 계좌번호를 입력해 주세요.');
      return;
    }
    if (parsedAmount <= 0) {
      setFormError('이체 금액을 입력해 주세요.');
      return;
    }
    if (parsedAmount > (fromAccount?.balance ?? 0)) {
      setFormError('출금 가능 금액을 초과했습니다.');
      return;
    }
    setFormError('');
    setStep('confirm');
  }

  /* ── 빠른 금액 ── */
  function addAmount(value: number) {
    if (value === -1) {
      setRawAmount(String(fromAccount?.balance ?? 0));
    } else {
      setRawAmount(String((parseInt(rawAmount || '0', 10)) + value));
    }
  }

  /* ── PIN 입력 ── */
  async function handlePinPress(value: string) {
    if (pinLoading || pinLocked) return;
    if (value === 'backspace') { setPin((p) => p.slice(0, -1)); return; }
    if (pin.length >= 6) return;
    const next = pin + value;
    setPin(next);
    if (next.length === 6) await executeTransfer(next);
  }

  async function executeTransfer(enteredPin: string) {
    setPinLoading(true);
    setPinError('');
    try {
      await apiRequest<void>(
        '/auth/pin/verify', { method: 'POST', body: JSON.stringify({ pin: enteredPin }) }
      );
      const created = await createTransfer(
        { fromAccountId: fromId, toBankCode, toAccountNumber: toNumber, transferAmount: parsedAmount, requestedBy: 'USER' }
      );
      const approved = await approveTransfer(created.transferId);
      setCompletedAt(approved.completedAt ?? '');
      setStep('complete');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'AUTH_009') {
        setPinLocked(true);
        setPinError('PIN이 잠겼습니다. 고객센터에 문의해주세요.');
      } else {
        setPinError(err instanceof Error ? err.message : '이체 처리 중 오류가 발생했습니다.');
      }
      setPin('');
    } finally {
      setPinLoading(false);
    }
  }

  /* ════════════════ STEP: FORM ════════════════ */
  if (step === 'form') {
    return (
      <div className="flex flex-col h-screen bg-white relative">
        <div className="relative flex items-center px-5 py-3 bg-white shrink-0 border-b border-gray-100">
          <button onClick={onBack}>
            <ArrowLeft size={22} className="text-gray-800" />
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">이체</span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 pb-4">
          {/* 출금 계좌 */}
          <div>
            <p className="text-sm font-bold text-gray-900 mb-2">출금 계좌</p>
            <div className="relative">
              <button
                onClick={() => setShowFromDrop((v) => !v)}
                className="w-full flex items-center gap-3 bg-white border-2 border-sky-500 rounded-2xl px-4 py-3.5 text-left"
              >
                <div className="w-7 h-7 bg-sky-100 rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {accountLabel(fromAccount!)} {fromAccount?.accountNumber}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatKRW(fromAccount?.balance ?? 0)}
                  </p>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-gray-500 shrink-0 transition-transform ${showFromDrop ? 'rotate-180' : ''}`}
                />
              </button>
              {showFromDrop && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-10 overflow-hidden">
                  {accounts.map((a) => (
                    <button
                      key={a.accountId}
                      onClick={() => { setFromId(a.accountId); setShowFromDrop(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 ${
                        a.accountId === fromId ? 'text-sky-600 font-semibold' : 'text-gray-800'
                      }`}
                    >
                      <span>{accountLabel(a)} {a.accountNumber}</span>
                      <span className="font-bold">{formatKRW(a.balance)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 입금 계좌 */}
          <div>
            <p className="text-sm font-bold text-gray-900 mb-2">입금 계좌</p>
            <div className="space-y-2">
              <button
                onClick={() => setShowBankSheet(true)}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-100 rounded-2xl"
              >
                <div className="flex items-center gap-2">
                  {toBankCode && BANKS.find((b) => b.code === toBankCode)?.logo && (
                    <img
                      src={BANKS.find((b) => b.code === toBankCode)!.logo!}
                      alt={BANK_MAP[toBankCode]}
                      className="w-6 h-6 rounded-full object-contain"
                    />
                  )}
                  <span className={`text-sm ${toBankCode ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                    {toBankCode ? BANK_MAP[toBankCode] : '은행 선택'}
                  </span>
                </div>
                <ChevronDown size={16} className="text-gray-500" />
              </button>
              <input
                type="text"
                inputMode="numeric"
                placeholder="계좌 번호 입력"
                value={toNumber}
                onChange={(e) => setToNumber(e.target.value.replace(/[^0-9-]/g, ''))}
                className="w-full px-4 py-3.5 bg-gray-100 rounded-2xl text-sm outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* 이체 금액 */}
          <div>
            <p className="text-sm font-bold text-gray-900 mb-2">이체 금액</p>
            <div className="flex items-center bg-gray-100 rounded-2xl px-4 py-3.5 mb-3">
              <input
                type="text"
                inputMode="numeric"
                placeholder="금액을 입력하세요"
                value={rawAmount ? parseInt(rawAmount).toLocaleString('ko-KR') : ''}
                onChange={(e) => setRawAmount(e.target.value.replace(/[^0-9]/g, ''))}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
              <span className="text-sm text-gray-500 ml-2">원</span>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[100000, 500000, 1000000, -1].map((v) => (
                <button
                  key={v}
                  onClick={() => addAmount(v)}
                  className="py-2.5 bg-gray-100 rounded-xl text-xs font-semibold text-gray-700 active:bg-gray-200"
                >
                  {v === -1 ? '전액' : `+${v / 10000}만`}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">출금 가능 금액</span>
              <span className="font-bold text-gray-900">{formatKRW(fromAccount?.balance ?? 0)}</span>
            </div>
          </div>

          {formError && <p className="text-xs text-red-500">{formError}</p>}
        </div>

        <div className="px-5 pb-6 shrink-0">
          <button
            onClick={handleNext}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-base"
          >
            다음
          </button>
        </div>

        {/* 은행 선택 바텀시트 */}
        {showBankSheet && (
          <div className="absolute inset-0 z-20 flex flex-col justify-end">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowBankSheet(false)}
            />
            <div className="relative bg-white rounded-t-3xl pt-5 pb-8">
              <p className="text-base font-bold text-gray-900 mb-2 px-5">은행 선택</p>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                {BANKS.map((b) => (
                  <button
                    key={b.code}
                    onClick={() => { setToBankCode(b.code); setShowBankSheet(false); }}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 transition-colors ${
                      toBankCode === b.code ? 'bg-sky-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {b.logo ? (
                      <img
                        src={b.logo}
                        alt={b.name}
                        className="w-9 h-9 rounded-full object-contain shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 shrink-0">
                        {b.name[0]}
                      </div>
                    )}
                    <span className={`text-sm font-medium ${
                      toBankCode === b.code ? 'text-sky-600' : 'text-gray-800'
                    }`}>
                      {b.name}
                    </span>
                    {toBankCode === b.code && (
                      <Check size={16} className="ml-auto text-sky-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* 중복을 걷어내고 하나만 배치 */}
        <BottomNav />
      </div>
    );
  }

  /* ════════════════ STEP: CONFIRM ════════════════ */
  if (step === 'confirm') {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="relative flex items-center px-5 py-3 bg-white shrink-0 border-b border-gray-100">
          <button onClick={() => setStep('form')}>
            <ArrowLeft size={22} className="text-gray-800" />
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">이체 확인</span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* 안내 배너 */}
          <div className="flex items-center gap-3 bg-gray-100 rounded-2xl px-4 py-3">
            <Info size={18} className="text-gray-500 shrink-0" />
            <p className="text-sm text-gray-600">아래 정보를 확인해 주세요.</p>
          </div>

          {/* 출금 계좌 */}
          <div>
            <p className="text-sm font-bold text-gray-900 mb-2">출금 계좌</p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {accountLabel(fromAccount!)} ({fromAccount?.accountNumber})
              </p>
              <p className="text-sm font-bold text-gray-900">
                {formatKRW(fromAccount?.balance ?? 0)}
              </p>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* 입금 계좌 */}
          <div>
            <p className="text-sm font-bold text-gray-900 mb-2">입금 계좌</p>
            <p className="text-sm text-gray-600">
              {BANK_MAP[toBankCode]} ({toNumber})
            </p>
          </div>

          <div className="h-px bg-gray-100" />

          {/* 이체 금액 */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-900">이체 금액</p>
            <p className="text-sm font-bold text-gray-900">{formatKRW(parsedAmount)}</p>
          </div>

          <div className="h-px bg-gray-100" />

          {/* 이체 후 잔액 */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-900">이체 후 잔액</p>
            <p className="text-sm font-bold text-gray-900">{formatKRW(afterBalance)}</p>
          </div>
        </div>

        <div className="px-5 pb-6 space-y-3 shrink-0">
          <button
            onClick={() => { setPinError(''); setPin(''); setStep('pin'); }}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-base"
          >
            이체하기
          </button>
          <button
            onClick={() => setStep('form')}
            className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold text-base"
          >
            이전
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  /* ════════════════ STEP: PIN ════════════════ */
  if (step === 'pin') {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="relative flex items-center px-5 py-3 bg-white shrink-0 border-b border-gray-100">
          <button onClick={() => { setPin(''); setStep('confirm'); }}>
            <ArrowLeft size={22} className="text-gray-800" />
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">PIN 번호 입력</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <p className="text-sm text-gray-500 mb-2">이체 금액</p>
          <p className="text-2xl font-bold text-gray-900 mb-8">{formatKRW(parsedAmount)}</p>
          <p className="text-sm text-gray-500 mb-6">보안을 위해 PIN 번호를 입력해 주세요</p>

          {/* PIN 도트 */}
          <div className="flex gap-4 mb-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-colors ${
                  i < pin.length
                    ? 'bg-gray-900 border-gray-900'
                    : 'bg-white border-gray-300'
                }`}
              />
            ))}
          </div>

          {pinError && (
            <p className="text-xs text-red-500 mt-2">{pinError}</p>
          )}
          {pinLoading && (
            <p className="text-xs text-gray-400 mt-2">처리 중...</p>
          )}
        </div>

        <div className="pb-6 shrink-0">
          <PinKeypad onPress={handlePinPress} disabled={pinLocked} />
        </div>
        <BottomNav />
      </div>
    );
  }

  /* ════════════════ STEP: COMPLETE ════════════════ */
  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="relative flex items-center px-5 py-3 bg-white shrink-0 border-b border-gray-100">
        <button onClick={onBack}>
          <ArrowLeft size={22} className="text-gray-800" />
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">이체 완료</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* 완료 카드 */}
        <div className="bg-gray-700 rounded-3xl p-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-4">
            <Check size={28} className="text-gray-700 stroke-[2.5]" />
          </div>
          <p className="text-base font-semibold text-white mb-2">이체가 완료되었습니다.</p>
          <p className="text-3xl font-bold text-white mb-3">{formatKRW(parsedAmount)}</p>
          {completedAt && (
            <p className="text-xs text-gray-400">
              {new Date(completedAt).toLocaleString('ko-KR', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
              })}
            </p>
          )}
        </div>

        {/* 이체 상세 */}
        <div>
          <p className="text-sm font-bold text-gray-900 mb-2">출금 계좌</p>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {accountLabel(fromAccount!)} ({fromAccount?.accountNumber})
            </p>
            <p className="text-sm font-bold text-gray-900">{formatKRW(afterBalance)}</p>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        <div>
          <p className="text-sm font-bold text-gray-900 mb-2">입금 계좌</p>
          <p className="text-sm text-gray-600">
            {BANK_MAP[toBankCode]} ({toNumber})
          </p>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-900">이체 금액</p>
          <p className="text-sm font-bold text-gray-900">{formatKRW(parsedAmount)}</p>
        </div>
      </div>

      <div className="px-5 pb-6 shrink-0">
        <button
          onClick={onComplete ?? onBack}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-base"
        >
          확인
        </button>
      </div>
      <BottomNav />
    </div>
  );
}

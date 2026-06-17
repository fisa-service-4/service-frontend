'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, GripVertical, Sparkles, Lightbulb, X } from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import PinKeypad from '@/components/PinKeypad';
import { authApi } from '@/api/auth';
import { ApiError } from '@/utils/apiClient';
import {
  getVirtualSalarySetting,
  saveVirtualSalarySetting,
  getAiRecommendation,
} from '@/api/virtualSalary';
import { getStockAccounts } from '@/api/stock';
import type { PriorityItem, AiRecommendation } from '@/types/virtualSalary';

const PRIORITY_LABEL: Record<PriorityItem, string> = {
  SALARY:     '가상 월급',
  EMERGENCY:  '비상금',
  INVESTMENT: '투자',
};

const DEFAULT_PRIORITY: PriorityItem[] = ['SALARY', 'EMERGENCY', 'INVESTMENT'];

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  unit,
  suffix,
  disabled = false,
  onDisabledClick,
  narrow = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  unit?: string;
  suffix?: string;
  disabled?: boolean;
  onDisabledClick?: () => void;
  narrow?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${narrow ? 'w-20 shrink-0' : 'flex-1 min-w-0'}`}>
      <span className="text-[10px] text-gray-400 px-0.5">{label}</span>
      <div
        className={`flex items-center rounded-xl px-2.5 py-2 gap-1 border transition-colors ${value ? 'bg-bg-card border-primary-300' : 'bg-gray-100 border-transparent'} ${disabled ? 'opacity-50' : ''}`}
        onClick={disabled && onDisabledClick ? onDisabledClick : undefined}
      >
        {unit && <span className="text-xs text-gray-400 shrink-0">{unit}</span>}
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 min-w-0 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-300 ${narrow ? 'text-center' : ''}`}
        />
        {suffix && <span className="text-xs text-gray-400 shrink-0">{suffix}</span>}
      </div>
    </div>
  );
}

export default function VirtualSalarySettingView() {
  const router = useRouter();

  const [targetSalary,        setTargetSalary]        = useState('');
  const [payday,              setPayday]              = useState('');
  const [emergencyTargetAmt,  setEmergencyTargetAmt]  = useState('');
  const [emergencyTransfer,   setEmergencyTransfer]   = useState('');
  const [investmentTransfer,  setInvestmentTransfer]  = useState('');
  const [priorityOrder,       setPriorityOrder]       = useState<PriorityItem[]>(DEFAULT_PRIORITY);

  const [hasSetting,      setHasSetting]      = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [hasStockAccount, setHasStockAccount] = useState(false);
  const [dragIndex,       setDragIndex]       = useState<number | null>(null);

  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiData,      setAiData]      = useState<AiRecommendation | null>(null);
  const [aiError,     setAiError]     = useState<string | null>(null);

  const [showPin,           setShowPin]           = useState(false);
  const [pin,               setPin]               = useState('');
  const [pinError,          setPinError]          = useState('');
  const [pinLoading,        setPinLoading]        = useState(false);
  const [pinLocked,         setPinLocked]         = useState(false);
  const [showPinLockedModal, setShowPinLockedModal] = useState(false);

  const [toast,    setToast]    = useState<string | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    Promise.all([
      getVirtualSalarySetting()
        .then(data => {
          const salary = data.targetSalary;
          setTargetSalary(salary.toLocaleString());
          setPayday(String(data.payday));
          setEmergencyTargetAmt(
            data.emergencyTargetAmount != null ? data.emergencyTargetAmount.toLocaleString() : '',
          );
          if (data.emergencyAmount != null) {
            setEmergencyTransfer(data.emergencyAmount.toLocaleString());
          }
          if (data.investmentAmount != null) {
            setInvestmentTransfer(data.investmentAmount.toLocaleString());
          }
          setPriorityOrder(data.priorityOrder.length > 0 ? data.priorityOrder : DEFAULT_PRIORITY);
          setHasSetting(true);
        })
        .catch(() => setHasSetting(false)),
      getStockAccounts()
        .then(res => setHasStockAccount(res.accounts.length > 0))
        .catch(() => setHasStockAccount(false)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleAmountInput = (setter: (s: string) => void) => (raw: string) => {
    const n = raw.replace(/[^0-9]/g, '');
    setter(n ? Number(n).toLocaleString() : '');
  };

  const rawSalary             = Number(targetSalary.replace(/[^0-9]/g, ''))        || 0;
  const rawEmergencyTarget    = Number(emergencyTargetAmt.replace(/[^0-9]/g, ''))   || 0;
  const rawEmergencyTransfer  = Number(emergencyTransfer.replace(/[^0-9]/g, ''))    || 0;
  const rawInvestmentTransfer = Number(investmentTransfer.replace(/[^0-9]/g, ''))   || 0;

  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDragOver  = (e: React.DragEvent, overIdx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === overIdx) return;
    const next = [...priorityOrder];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(overIdx, 0, moved);
    setPriorityOrder(next);
    setDragIndex(overIdx);
  };

  const handleAiRecommend = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      setAiData(await getAiRecommendation());
      setShowAiModal(true);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI 추천을 받을 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiRecommendation = () => {
    if (!aiData) return;
    const sAmt = aiData.recommendedTargetSalary || 0;
    const eAmt = aiData.recommendedEmergencyAmount || 0;
    const iAmt = hasStockAccount ? aiData.recommendedInvestmentAmount || 0 : 0;
    if (sAmt > 0) setTargetSalary(sAmt.toLocaleString());
    setEmergencyTransfer(eAmt > 0 ? eAmt.toLocaleString() : '');
    setInvestmentTransfer(iAmt > 0 ? iAmt.toLocaleString() : '');
    setShowAiModal(false);
  };

  const openPin = () => {
    const paydayNum = Number(payday);
    if (!rawSalary || paydayNum < 1 || paydayNum > 31) {
      setError('목표 금액과 월급일(1~31)을 올바르게 입력해주세요.');
      return;
    }
    setError(null);
    setPin('');
    setPinError('');
    setShowPin(true);
  };

  const handlePinPress = async (value: string) => {
    if (pinLoading || pinLocked) return;
    setPinError('');

    if (value === 'backspace') {
      setPin(p => p.slice(0, -1));
      return;
    }
    if (pin.length >= 6) return;

    const next = pin + value;
    setPin(next);
    if (next.length < 6) return;

    setTimeout(async () => {
      setPinLoading(true);
      try {
        await authApi.verifyPin(next);
        setShowPin(false);
        setPin('');
        await handleActualSave();
      } catch (err) {
        if (err instanceof ApiError && err.code === 'AUTH_009') {
          setPinLocked(true);
          setShowPinLockedModal(true);
        } else {
          setPinError('PIN번호가 올바르지 않습니다. 다시 입력해주세요.');
        }
        setPin('');
      } finally {
        setPinLoading(false);
      }
    }, 200);
  };

  const handleActualSave = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const paydayNum = Number(payday);
      const body = {
        targetSalary: rawSalary,
        payday: paydayNum,
        ...(rawEmergencyTarget    > 0 && { emergencyTargetAmount: rawEmergencyTarget }),
        ...(rawEmergencyTransfer  > 0 && { emergencyAmount: rawEmergencyTransfer }),
        ...(hasStockAccount && rawInvestmentTransfer > 0 && { investmentAmount: rawInvestmentTransfer }),
        priorityOrder,
      };
      await saveVirtualSalarySetting(body);
      router.push('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
      setSaving(false);
    }
  };

  const renderRow = (item: PriorityItem, idx: number) => {
    const isLast = idx === priorityOrder.length - 1;

    let fields: React.ReactNode;

    if (item === 'SALARY') {
      fields = (
        <>
          <FieldInput
            label="월급일"
            value={payday}
            onChange={v => setPayday(v.replace(/[^0-9]/g, '').slice(0, 2))}
            placeholder="25"
            suffix="일"
            narrow
          />
          <FieldInput
            label="목표액"
            value={targetSalary}
            onChange={handleAmountInput(setTargetSalary)}
            placeholder="3,000,000"
            suffix="원"
          />
        </>
      );
    } else if (item === 'EMERGENCY') {
      fields = (
        <>
          <FieldInput
            label="목표금액"
            value={emergencyTargetAmt}
            onChange={handleAmountInput(setEmergencyTargetAmt)}
            placeholder="5,000,000"
            suffix="원"
          />
          <FieldInput
            label="이체액/월"
            value={emergencyTransfer}
            onChange={handleAmountInput(setEmergencyTransfer)}
            placeholder="300,000"
            suffix="원"
          />
        </>
      );
    } else {
      fields = (
        <>
          <FieldInput
            label="이체액/월"
            value={hasStockAccount ? investmentTransfer : '0'}
            onChange={hasStockAccount ? handleAmountInput(setInvestmentTransfer) : () => {}}
            placeholder={hasStockAccount ? '300,000' : '0'}
            suffix="원"
            disabled={!hasStockAccount}
            onDisabledClick={() => showToast('증권 계좌가 연결되어 있지 않아요. 마이페이지에서 연결해주세요.')}
          />
          {!hasStockAccount && (
            <span className="self-end text-[10px] text-amber-500 pb-2 shrink-0">계좌 미연동</span>
          )}
        </>
      );
    }

    return (
      <div
        key={item}
        draggable
        onDragStart={() => handleDragStart(idx)}
        onDragOver={e => handleDragOver(e, idx)}
        onDragEnd={() => setDragIndex(null)}
        className={`flex items-end gap-2 py-3
          ${!isLast ? 'border-b border-gray-100' : ''}
          ${dragIndex === idx ? 'opacity-40' : ''}
          cursor-grab active:cursor-grabbing`}
      >
        <div className="shrink-0 pb-2">
          <GripVertical size={16} className="text-gray-300" />
        </div>
        <span className="text-sm font-semibold text-gray-800 w-18 shrink-0 pb-2 whitespace-nowrap">
          {PRIORITY_LABEL[item]}
        </span>
        <div className="flex gap-2 flex-1 min-w-0">
          {fields}
        </div>
      </div>
    );
  };

  const aiTargetSalary  = aiData ? aiData.recommendedTargetSalary     : 0;
  const aiEmergencyAmt  = aiData ? aiData.recommendedEmergencyAmount  : 0;
  const aiInvestmentAmt = aiData && hasStockAccount ? aiData.recommendedInvestmentAmount : 0;

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-bg">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">불러오는 중...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-bg">

      {/* 헤더 */}
      <div className="relative flex items-center px-5 py-3 bg-bg shrink-0 border-b border-gray-100">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-800" />
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">목표/분배 설정</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-6 pt-4">

        {/* 분배 설정 */}
        <div className="bg-bg-card shadow-md rounded-2xl p-4">
          <h2 className="text-base font-bold text-gray-900 mb-0.5">분배 설정</h2>
          <p className="text-xs text-gray-400 mb-3">
            각 항목의 이체액을 드래그해 분배 우선순위를 바꿀 수 있어요
          </p>
          {priorityOrder.map((item, idx) => renderRow(item, idx))}
        </div>

        {/* AI 추천 */}
        <div className="bg-bg-card shadow-md rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">AI 추천</p>
              <p className="text-xs text-gray-400">소비 습관과 수입 분석을 바탕으로 최적의 분배 금액을 추천합니다</p>
            </div>
          </div>
          {aiError && <p className="text-red-500 text-xs mb-3">{aiError}</p>}
          <button
            onClick={handleAiRecommend}
            disabled={aiLoading}
            className="w-full py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Sparkles size={13} />
            {aiLoading ? '분석 중...' : 'AI 추천 받기'}
          </button>
        </div>

        {/* 오류 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* 저장 버튼 */}
        <button
          onClick={openPin}
          disabled={saving}
          className="w-full py-3.5 bg-primary-500 text-white font-bold rounded-2xl text-sm disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장하기'}
        </button>

      </div>

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-800/90 text-white text-sm px-4 py-2.5 rounded-full shadow-lg whitespace-nowrap max-w-[90vw] text-center">
          {toast}
        </div>
      )}

      {/* AI 추천 모달 */}
      {showAiModal && aiData && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4"
          onClick={() => setShowAiModal(false)}
        >
          <div
            className="bg-bg-card rounded-2xl p-5 w-full max-w-sm mb-2"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                <Lightbulb size={18} className="text-primary-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">AI 추천</p>
                <p className="text-xs text-gray-400">분석 결과 기반 추천</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-4">{aiData.summary}</p>

            <div className="space-y-2 mb-5">
              <div className="flex items-center justify-between px-3 py-2.5 bg-primary-50 border border-primary-100 rounded-xl">
                <span className="text-sm text-gray-600">추천 목표액</span>
                <span className="text-sm font-bold text-primary-700">
                  {aiTargetSalary > 0 ? aiTargetSalary.toLocaleString() + ' 원' : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 bg-primary-50 border border-primary-100 rounded-xl">
                <span className="text-sm text-gray-600">비상금 이체액/월</span>
                <span className="text-sm font-bold text-primary-700">
                  {aiEmergencyAmt > 0 ? aiEmergencyAmt.toLocaleString() + ' 원' : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 bg-primary-50 border border-primary-100 rounded-xl">
                <span className="text-sm text-gray-600">투자 이체액/월</span>
                {hasStockAccount ? (
                  <span className="text-sm font-bold text-primary-700">
                    {aiInvestmentAmt > 0 ? aiInvestmentAmt.toLocaleString() + ' 원' : '-'}
                  </span>
                ) : (
                  <span className="text-sm text-amber-500 font-medium">계좌 미연동</span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAiModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl text-sm"
              >
                취소
              </button>
              <button
                onClick={applyAiRecommendation}
                className="flex-1 py-3 bg-primary-500 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5"
              >
                <Sparkles size={13} />
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN 오버레이 */}
      {showPin && (
        <div className="absolute inset-0 bg-bg-card z-50 flex flex-col">
          <div className="flex items-center px-5 py-3 bg-bg-card shrink-0 relative border-b border-gray-100">
            <button onClick={() => setShowPin(false)}>
              <X size={22} className="text-gray-800" />
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">
              PIN 입력
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center pt-12 px-4">
            <div className="bg-gray-700 rounded-full px-6 py-2.5 mb-10">
              <p className="text-white text-sm font-medium">
                설정을 저장하기 위해 PIN을 입력해주세요
              </p>
            </div>

            <div className="flex gap-4 mb-12">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-full transition-colors ${
                    i < pin.length ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {pinError && (
              <p className="text-sm text-error mb-6">{pinError}</p>
            )}
            {pinLoading && (
              <p className="text-sm text-gray-400 mb-6">확인 중...</p>
            )}

            <div className="mt-auto pb-8 w-full">
              <PinKeypad onPress={handlePinPress} disabled={pinLocked} />
            </div>
          </div>
        </div>
      )}

      {showPinLockedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl mx-6 p-6 flex flex-col items-center">
            <p className="text-base font-bold text-gray-900 mb-2">PIN 잠금</p>
            <p className="text-sm text-gray-500 mb-6 text-center">
              PIN이 잠겼습니다.<br />고객센터에 문의해주세요.
            </p>
            <button
              onClick={() => router.back()}
              className="w-full py-3 bg-sky-500 text-white font-semibold rounded-xl text-sm"
            >
              확인
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

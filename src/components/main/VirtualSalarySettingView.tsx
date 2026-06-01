'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, GripVertical, Sparkles, Lightbulb } from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import VirtualSalaryCard from '@/components/home/VirtualSalaryCard';
import {
  getVirtualSalarySetting,
  getDashboard,
  saveVirtualSalarySetting,
  updateVirtualSalarySetting,
  getAiRecommendation,
} from '@/api/virtualSalary';
import type { PriorityItem, DashboardData, AiRecommendation } from '@/types/virtualSalary';

const PRIORITY_LABEL: Record<PriorityItem, string> = {
  SALARY:     '월급',
  EMERGENCY:  '비상금',
  INVESTMENT: '투자',
};

const DEFAULT_PRIORITY: PriorityItem[] = ['EMERGENCY', 'SALARY', 'INVESTMENT'];

export default function VirtualSalarySettingView() {
  const router = useRouter();

  const [targetSalary,       setTargetSalary]       = useState('');
  const [payday,             setPayday]             = useState('');
  const [emergencyTargetAmt, setEmergencyTargetAmt] = useState('');
  const [emergencyRatio,     setEmergencyRatio]     = useState('');
  const [investmentRatio,    setInvestmentRatio]    = useState('');
  const [priorityOrder,      setPriorityOrder]      = useState<PriorityItem[]>(DEFAULT_PRIORITY);

  const [hasSetting, setHasSetting] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState(false);

  const [dashboard,   setDashboard]   = useState<DashboardData | null>(null);
  const [dragIndex,   setDragIndex]   = useState<number | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiData,      setAiData]      = useState<AiRecommendation | null>(null);
  const [aiError,     setAiError]     = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getVirtualSalarySetting()
        .then(data => {
          setTargetSalary(data.targetSalary.toLocaleString());
          setPayday(String(data.payday));
          setEmergencyTargetAmt(data.emergencyTargetAmount != null ? data.emergencyTargetAmount.toLocaleString() : '');
          setEmergencyRatio(data.emergencyRatio   != null ? String(data.emergencyRatio)   : '');
          setInvestmentRatio(data.investmentRatio != null ? String(data.investmentRatio) : '');
          setPriorityOrder(data.priorityOrder.length > 0 ? data.priorityOrder : DEFAULT_PRIORITY);
          setHasSetting(true);
        })
        .catch(() => setHasSetting(false)),
      getDashboard().then(setDashboard).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const rawTarget       = Number(targetSalary.replace(/[^0-9]/g, ''))       || 0;
  const rawEmergencyAmt = Number(emergencyTargetAmt.replace(/[^0-9]/g, '')) || 0;
  const emoRatio        = Number(emergencyRatio)  || 0;
  const invRatio        = Number(investmentRatio) || 0;
  const remainRatio     = Math.max(0, 100 - emoRatio - invRatio);
  const isRatioOver     = emoRatio + invRatio > 100;

  const handleTargetChange = (v: string) => {
    const n = v.replace(/[^0-9]/g, '');
    setTargetSalary(n ? Number(n).toLocaleString() : '');
  };
  const handleEmergencyAmtChange = (v: string) => {
    const n = v.replace(/[^0-9]/g, '');
    setEmergencyTargetAmt(n ? Number(n).toLocaleString() : '');
  };

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
    setEmergencyRatio(String(aiData.recommendedEmergencyRatio));
    setInvestmentRatio(String(aiData.recommendedInvestmentRatio));
    setShowAiModal(false);
  };

  const handleSave = async () => {
    if (saving || isRatioOver) return;
    const paydayNum = Number(payday);
    if (!rawTarget || paydayNum < 1 || paydayNum > 31) {
      setError('월급 금액과 월급일(1~31)을 올바르게 입력해주세요.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        targetSalary: rawTarget,
        payday: paydayNum,
        ...(rawEmergencyAmt > 0 && { emergencyTargetAmount: rawEmergencyAmt }),
        ...(emoRatio > 0        && { emergencyRatio: emoRatio }),
        ...(invRatio > 0        && { investmentRatio: invRatio }),
        priorityOrder,
      };
      hasSetting
        ? await updateVirtualSalarySetting(body)
        : await saveVirtualSalarySetting(body);
      setHasSetting(true);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">

      {/* 헤더 */}
      <div className="relative flex items-center px-5 py-4 shrink-0">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-800" />
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">목표/분배 설정</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-5 pb-6">

        {/* 대시보드 카드 — 홈과 동일 (클릭 불필요, 이 페이지가 설정 페이지) */}
        <VirtualSalaryCard
          dashboard={dashboard ?? undefined}
          loading={loading}
          showSettingButton={false}
        />

        {/* 가상 월급 설정 */}
        <div className="bg-white border-2 border-sky-500 rounded-2xl p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">가상 월급 설정</h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">월급액</label>
              <div className="flex items-center bg-gray-100 rounded-xl px-4 py-3 gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={targetSalary ?? ''}
                  onChange={e => handleTargetChange(e.target.value)}
                  placeholder="3,000,000"
                  className="flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">월급일</label>
              <div className="flex items-center bg-gray-100 rounded-xl px-4 py-3 gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={payday}
                  onChange={e => setPayday(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                  placeholder="25"
                  className="flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
                />
                <span className="text-sm text-gray-400 shrink-0">일</span>
              </div>
            </div>
          </div>
        </div>

        {/* 비상금 목표 설정 */}
        <div className="bg-white border-2 border-sky-500 rounded-2xl p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">비상금 목표 설정</h2>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">목표 금액</label>
            <div className="flex items-center bg-gray-100 rounded-xl px-4 py-3">
              <input
                type="text"
                inputMode="numeric"
                value={emergencyTargetAmt ?? ''}
                onChange={e => handleEmergencyAmtChange(e.target.value)}
                placeholder="2,500,000"
                className="flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
              />
            </div>
          </div>
        </div>

        {/* AI 추천 */}
        <div className="bg-white border-2 border-sky-500 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-sky-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">AI 분배 추천</p>
              <p className="text-xs text-gray-400">소비 패턴 기반 최적 비율 제안</p>
            </div>
          </div>
          {aiError && (
            <p className="text-red-500 text-xs mb-3">{aiError}</p>
          )}
          <button
            onClick={handleAiRecommend}
            disabled={aiLoading}
            className="w-full py-2.5 bg-sky-50 text-sky-600 text-sm font-semibold rounded-xl border border-sky-200 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Sparkles size={13} />
            {aiLoading ? '분석 중...' : 'AI 추천 받기'}
          </button>
        </div>

        {/* 항목별 분배 비율 */}
        <div className="bg-white border-2 border-sky-500 rounded-2xl p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">항목별 분배 비율</h2>

          {/* 잔금 — 자동 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sky-500" />
                <span className="text-sm text-gray-700">잔금</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">직접 설정 불가</span>
                <span className="text-sm font-semibold text-gray-900">{remainRatio}%</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-sky-100 rounded-full">
              <div className="h-1.5 bg-sky-500 rounded-full transition-all" style={{ width: `${remainRatio}%` }} />
            </div>
          </div>

          {/* 비상금 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                <span className="text-sm text-gray-700">비상금</span>
              </div>
              <div className="flex items-center bg-gray-100 rounded-lg px-2.5 py-1 gap-1">
                <input
                  type="number" min={0} max={100}
                  value={emergencyRatio}
                  onChange={e => setEmergencyRatio(e.target.value)}
                  placeholder="30"
                  className="w-10 text-right text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
                />
                <span className="text-xs text-gray-400">%</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full">
              <div className="h-1.5 bg-gray-400 rounded-full transition-all" style={{ width: `${Math.min(emoRatio, 100)}%` }} />
            </div>
          </div>

          {/* 투자 */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-sm text-gray-700">투자</span>
              </div>
              <div className="flex items-center bg-gray-100 rounded-lg px-2.5 py-1 gap-1">
                <input
                  type="number" min={0} max={100}
                  value={investmentRatio}
                  onChange={e => setInvestmentRatio(e.target.value)}
                  placeholder="20"
                  className="w-10 text-right text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
                />
                <span className="text-xs text-gray-400">%</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full">
              <div className="h-1.5 bg-gray-300 rounded-full transition-all" style={{ width: `${Math.min(invRatio, 100)}%` }} />
            </div>
          </div>

          {isRatioOver && (
            <p className="text-red-500 text-xs mt-2">비율 합계가 100%를 초과했습니다.</p>
          )}

          <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100">
            <span className="text-sm text-gray-400">합계</span>
            <span className={`text-sm font-bold ${isRatioOver ? 'text-red-500' : 'text-gray-900'}`}>
              100%
            </span>
          </div>
        </div>

        {/* 우선순위 설정 */}
        <div className="bg-white border-2 border-sky-500 rounded-2xl p-5">
          <h2 className="text-base font-bold text-gray-900 mb-1">우선순위 설정</h2>
          <p className="text-xs text-gray-400 mb-4">드래그하여 분배 우선순위를 조정하세요</p>
          {priorityOrder.map((item, idx) => (
            <div
              key={item}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={e => handleDragOver(e, idx)}
              onDragEnd={() => setDragIndex(null)}
              className={`flex items-center gap-3 py-3
                ${idx < priorityOrder.length - 1 ? 'border-b border-gray-100' : ''}
                ${dragIndex === idx ? 'opacity-40' : ''}
                cursor-grab active:cursor-grabbing`}
            >
              <span className="text-sm font-medium text-sky-500 w-5">{idx + 1}</span>
              <span className="flex-1 text-sm font-semibold text-gray-800">
                {PRIORITY_LABEL[item]}
              </span>
              <GripVertical size={18} className="text-gray-300" />
            </div>
          ))}
        </div>

        {/* 에러 / 성공 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-sky-50 border border-sky-200 text-sky-600 text-sm px-4 py-3 rounded-xl">
            설정이 저장되었습니다.
          </div>
        )}

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={saving || isRatioOver}
          className="w-full py-3.5 bg-sky-500 text-white font-semibold rounded-2xl text-sm disabled:opacity-50"
        >
          {saving ? '저장 중...' : hasSetting ? '수정하기' : '저장하기'}
        </button>

      </div>

      {/* AI 추천 모달 */}
      {showAiModal && aiData && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4"
          onClick={() => setShowAiModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-5 w-full max-w-sm mb-2"
            onClick={e => e.stopPropagation()}
          >
            {/* 타이틀 */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
                <Lightbulb size={18} className="text-sky-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">AI 분배 추천</p>
                <p className="text-xs text-gray-400">소비 패턴 분석 결과</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              {aiData.summary}
            </p>

            {/* 추천 비율 3열 */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { label: '생활비', ratio: Math.max(0, 100 - aiData.recommendedEmergencyRatio - aiData.recommendedInvestmentRatio) },
                { label: '비상금', ratio: aiData.recommendedEmergencyRatio },
                { label: '투자',   ratio: aiData.recommendedInvestmentRatio },
              ].map(({ label, ratio }) => (
                <div key={label} className="bg-sky-50 border border-sky-200 rounded-xl py-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="text-sky-600 text-xl font-bold">{ratio}%</p>
                </div>
              ))}
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
                className="flex-1 py-3 bg-sky-500 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5"
              >
                <Sparkles size={13} />
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getConnections } from '@/api/mydata';
import { setAccountRole } from '@/api/bank';
import type { BankAccountSummary, StockAccountSummary } from '@/api/mydata';
import { signupStore } from '@/store/signupStore';

import IntroStep from './_components/IntroStep';
import SelectStep from './_components/SelectStep';
import LoadingStep from './_components/LoadingStep';
import ConnectedStep from './_components/ConnectedStep';
import AccountStep from './_components/AccountStep';

type Step = 'intro' | 'select' | 'loading' | 'connected' | 'deposit' | 'salary' | 'emergency' | 'stock';

const ACCOUNT_STEP_ORDER: Step[] = ['deposit', 'salary', 'emergency', 'stock'];

export default function SignupOnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('intro');
  const [userName, setUserName] = useState('');

  const [bankAccounts, setBankAccounts] = useState<BankAccountSummary[]>([]);
  const [stockAccounts, setStockAccounts] = useState<StockAccountSummary[]>([]);

  const [depositId, setDepositId] = useState<number | ''>('');
  const [salaryId, setSalaryId] = useState<number | ''>('');
  const [emergencyId, setEmergencyId] = useState<number | ''>('');
  const [stockId, setStockId] = useState<number | ''>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = signupStore.get();
    if (stored.userName) setUserName(stored.userName);
  }, []);

  // loading step: getConnections 호출 후 connected로 전환
  useEffect(() => {
    if (step !== 'loading') return;
    let cancelled = false;
    async function load() {
      try {
        const [connections] = await Promise.all([
          getConnections(),
          new Promise<void>((r) => setTimeout(r, 1500)),
        ]);
        if (cancelled) return;
        setBankAccounts(connections.bankAccounts ?? []);
        setStockAccounts(connections.stockAccounts ?? []);
        setStep('connected');
      } catch {
        if (cancelled) return;
        setStep('select');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [step]);

  // accountId → 이미 선택된 역할 라벨 (disabled badge용)
  function getAlreadySelectedIds(currentStep: Step): Map<number, string> {
    const map = new Map<number, string>();
    if (currentStep !== 'deposit'   && depositId)   map.set(Number(depositId), '입금 계좌');
    if (currentStep !== 'salary'    && salaryId)     map.set(Number(salaryId), '월급 계좌');
    if (currentStep !== 'emergency' && emergencyId)  map.set(Number(emergencyId), '비상금 계좌');
    if (currentStep !== 'stock'     && stockId)      map.set(Number(stockId), '투자 계좌');
    return map;
  }

  function accountStepIndex(s: Step) {
    return ACCOUNT_STEP_ORDER.indexOf(s);
  }

  // ── 각 단계 핸들러 ──

  async function handleDepositNext() {
    if (!depositId) { setError('계좌를 선택해주세요.'); return; }
    setError('');
    setLoading(true);
    try {
      await setAccountRole(Number(depositId), 'DEPOSIT');
      setStep('salary');
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSalaryNext() {
    if (!salaryId) { setError('계좌를 선택해주세요.'); return; }
    setError('');
    setLoading(true);
    try {
      await setAccountRole(Number(salaryId), 'SALARY');
      setStep('emergency');
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEmergencyNext() {
    if (!emergencyId) { setError('계좌를 선택해주세요.'); return; }
    setError('');
    setLoading(true);
    try {
      await setAccountRole(Number(emergencyId), 'EMERGENCY');
      setStep('stock');
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStockNext() {
    if (!stockId) { setError('계좌를 선택해주세요.'); return; }
    setError('');
    setLoading(true);
    try {
      await setAccountRole(Number(stockId), 'STOCK');
      router.push('/signup/pin');
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStockSkip() {
    setError('');
    router.push('/signup/pin');
  }

  // ── 뒤로가기 ──

  function handleBack() {
    setError('');
    switch (step) {
      case 'intro':      router.push('/signup/verify'); break;
      case 'select':     setStep('intro'); break;
      case 'loading':    setStep('select'); break;
      case 'connected':  setStep('select'); break;
      case 'deposit':    setStep('connected'); break;
      case 'salary':     setStep('deposit'); break;
      case 'emergency':  setStep('salary'); break;
      case 'stock':      setStep('emergency'); break;
    }
  }

  // ── 렌더링 ──

  if (step === 'intro') {
    return <IntroStep onNext={() => setStep('select')} onBack={handleBack} />;
  }

  if (step === 'select') {
    return <SelectStep userName={userName} onNext={() => setStep('loading')} onBack={handleBack} />;
  }

  if (step === 'loading') {
    return <LoadingStep userName={userName} />;
  }

  if (step === 'connected') {
    return (
      <ConnectedStep
        bankAccounts={bankAccounts}
        stockAccounts={stockAccounts}
        onNext={() => setStep('deposit')}
      />
    );
  }

  if (step === 'deposit') {
    return (
      <AccountStep
        title="입금 계좌를 선택해주세요"
        subtitle="수입이 입금되는 계좌를 선택해주세요"
        stepIndex={accountStepIndex('deposit')}
        accounts={bankAccounts}
        selected={depositId}
        onSelect={setDepositId}
        alreadySelectedIds={getAlreadySelectedIds('deposit')}
        onNext={handleDepositNext}
        onBack={handleBack}
        loading={loading}
        error={error}
      />
    );
  }

  if (step === 'salary') {
    return (
      <AccountStep
        title="월급 계좌를 선택해주세요"
        subtitle="가상 월급을 받을 계좌를 선택해주세요"
        stepIndex={accountStepIndex('salary')}
        accounts={bankAccounts}
        selected={salaryId}
        onSelect={setSalaryId}
        alreadySelectedIds={getAlreadySelectedIds('salary')}
        onNext={handleSalaryNext}
        onBack={handleBack}
        loading={loading}
        error={error}
      />
    );
  }

  if (step === 'emergency') {
    return (
      <AccountStep
        title="비상금 계좌를 선택해주세요"
        subtitle="비상금을 보관할 계좌를 선택해주세요"
        stepIndex={accountStepIndex('emergency')}
        accounts={bankAccounts}
        selected={emergencyId}
        onSelect={setEmergencyId}
        alreadySelectedIds={getAlreadySelectedIds('emergency')}
        onNext={handleEmergencyNext}
        onBack={handleBack}
        loading={loading}
        error={error}
      />
    );
  }

  if (step === 'stock') {
    return (
      <AccountStep
        title="투자 계좌를 선택해주세요"
        subtitle="주식 투자에 사용할 계좌를 선택해주세요"
        stepIndex={accountStepIndex('stock')}
        accounts={stockAccounts}
        selected={stockId}
        onSelect={setStockId}
        alreadySelectedIds={getAlreadySelectedIds('stock')}
        onNext={handleStockNext}
        onBack={handleBack}
        nextLabel="완료"
        showSkip
        onSkip={handleStockSkip}
        loading={loading}
        error={error}
      />
    );
  }

  return null;
}

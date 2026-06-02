'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { connectMyData, getConnections } from '@/api/mydata';
import { setAccountRole } from '@/api/bank';
import type { BankAccountSummary, StockAccountSummary } from '@/api/mydata';

type Step = 'connect' | 'deposit' | 'salary' | 'emergency' | 'stock';

const STEPS: Step[] = ['connect', 'deposit', 'salary', 'emergency', 'stock'];

const STEP_META: Record<Step, { title: string; subtitle: string }> = {
  connect:   { title: '계좌를 연결해주세요',       subtitle: '마이데이터를 통해 보유 계좌를 불러옵니다' },
  deposit:   { title: '입금 계좌를 선택해주세요',   subtitle: '수입이 입금되는 계좌를 선택해주세요' },
  salary:    { title: '월급 계좌를 선택해주세요',   subtitle: '가상 월급을 받을 계좌를 선택해주세요' },
  emergency: { title: '비상금 계좌를 선택해주세요', subtitle: '비상금을 보관할 계좌를 선택해주세요' },
  stock:     { title: '투자 계좌를 선택해주세요',   subtitle: '주식 투자에 사용할 계좌를 선택해주세요 (선택)' },
};

const USE_MOCK = true; // TODO: 백엔드 연동 후 false로 변경

const MOCK_BANK_ACCOUNTS: BankAccountSummary[] = [
  { accountId: 1001, accountNumber: '110-123-456789', accountName: '신한 급여통장',     bankCode: '088', balance: 3500000 },
  { accountId: 1002, accountNumber: '110-234-567890', accountName: 'KB 생활비 통장',    bankCode: '004', balance: 1200000 },
  { accountId: 1003, accountNumber: '110-345-678901', accountName: '우리 비상금 통장',  bankCode: '020', balance: 5000000 },
  { accountId: 1004, accountNumber: '110-456-789012', accountName: 'NH 입출금 통장',    bankCode: '011', balance: 800000 },
];

const MOCK_STOCK_ACCOUNTS: StockAccountSummary[] = [
  { accountId: 2001, accountNumber: '300-123-456789', accountName: '신한 주식 계좌',   bankCode: '039' },
  { accountId: 2002, accountNumber: '300-234-567890', accountName: 'KB 투자 계좌',     bankCode: '039' },
];

const PROVIDERS = [
  { label: 'KB국민은행',  value: 'KB_BANK' },
  { label: '신한은행',    value: 'SHINHAN_BANK' },
  { label: '우리은행',    value: 'WOORI_BANK' },
  { label: '하나은행',    value: 'HANA_BANK' },
  { label: 'NH농협은행',  value: 'NH_BANK' },
  { label: 'IBK기업은행', value: 'IBK_BANK' },
  { label: 'SC제일은행',  value: 'SC_BANK' },
  { label: '씨티은행',    value: 'CITI_BANK' },
  { label: '카카오뱅크',  value: 'KAKAO_BANK' },
  { label: '토스뱅크',   value: 'TOSS_BANK' },
];

export default function SignupOnboardingPage() {
  const router = useRouter();

  const [step, setStep]               = useState<Step>('connect');
  const [provider, setProvider]       = useState('');
  const [bankAccounts, setBankAccounts]   = useState<BankAccountSummary[]>(MOCK_BANK_ACCOUNTS);
  const [stockAccounts, setStockAccounts] = useState<StockAccountSummary[]>(MOCK_STOCK_ACCOUNTS);
  const [depositId, setDepositId]     = useState<number | ''>('');
  const [salaryId, setSalaryId]       = useState<number | ''>('');
  const [emergencyId, setEmergencyId] = useState<number | ''>('');
  const [stockId, setStockId]         = useState<number | ''>('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const stepIndex = STEPS.indexOf(step);
  const { title, subtitle } = STEP_META[step];

  function goBack() {
    setError('');
    if (stepIndex === 0) {
      router.push('/signup/verify');
    } else {
      setStep(STEPS[stepIndex - 1]);
    }
  }

  async function handleConnect() {
    if (!provider) { setError('금융기관을 선택해주세요.'); return; }
    setError('');
    setLoading(true);
    try {
      if (!USE_MOCK) {
        await connectMyData(provider);
        const connections = await getConnections();
        setBankAccounts(connections.bankAccounts ?? []);
        setStockAccounts(connections.stockAccounts ?? []);
      }
      setStep('deposit');
    } catch (err) {
      setError(err instanceof Error ? err.message : '연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function handleRoleNext(value: number | '') {
    if (!value) { setError('계좌를 선택해주세요.'); return; }
    setError('');
    setStep(STEPS[stepIndex + 1]);
  }

  async function handleFinish(includeStock: boolean) {
    setError('');
    setLoading(true);
    try {
      if (!USE_MOCK) {
        const tasks: Promise<unknown>[] = [];
        if (depositId)               tasks.push(setAccountRole(Number(depositId), 'DEPOSIT'));
        if (salaryId)                tasks.push(setAccountRole(Number(salaryId), 'SALARY'));
        if (emergencyId)             tasks.push(setAccountRole(Number(emergencyId), 'EMERGENCY'));
        if (includeStock && stockId) tasks.push(setAccountRole(Number(stockId), 'STOCK'));
        await Promise.all(tasks);
      }
      router.push('/signup/pin');
    } catch (err) {
      setError(err instanceof Error ? err.message : '설정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function accountOptions(accounts: (BankAccountSummary | StockAccountSummary)[]) {
    return accounts.map((a) => (
      <option key={a.accountId} value={a.accountId}>
        {a.accountName} ({a.accountNumber})
      </option>
    ));
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="h-12 bg-[#131329]" />

      <div className="flex-1 px-6 pt-8 pb-6 flex flex-col">
        {/* 진행 바 */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-[#131329]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mb-3">{stepIndex + 1} / {STEPS.length}</p>

        <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-500 mb-8">{subtitle}</p>

        {/* 마이데이터 연결 */}
        {step === 'connect' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">금융기관 선택</label>
            <div className="relative">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full h-14 bg-gray-100 rounded-xl px-4 text-sm text-gray-800 outline-none appearance-none cursor-pointer"
              >
                <option value="" disabled>은행을 선택해주세요</option>
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs">▼</span>
            </div>
          </div>
        )}

        {/* 입금 계좌 */}
        {step === 'deposit' && (
          <AccountSelect
            accounts={bankAccounts}
            value={depositId}
            onChange={setDepositId}
          />
        )}

        {/* 월급 계좌 */}
        {step === 'salary' && (
          <AccountSelect
            accounts={bankAccounts}
            value={salaryId}
            onChange={setSalaryId}
          />
        )}

        {/* 비상금 계좌 */}
        {step === 'emergency' && (
          <AccountSelect
            accounts={bankAccounts}
            value={emergencyId}
            onChange={setEmergencyId}
          />
        )}

        {/* 투자 계좌 */}
        {step === 'stock' && (
          <AccountSelect
            accounts={stockAccounts}
            value={stockId}
            onChange={setStockId}
          />
        )}

        {error && <p className="text-red-500 text-xs mt-3 px-1">{error}</p>}
      </div>

      {/* 버튼 영역 */}
      <div className="px-6 pb-4">
        {step === 'connect' && (
          <div className="flex gap-2">
            <button type="button" onClick={goBack}
              className="flex-1 h-14 bg-gray-200 text-gray-700 rounded-xl text-base font-medium">
              이전
            </button>
            <button type="button" onClick={handleConnect} disabled={loading || !provider}
              className="flex-1 h-14 bg-[#131329] text-white rounded-xl text-base font-medium disabled:opacity-60">
              {loading ? '연결 중...' : '연결하기'}
            </button>
          </div>
        )}

        {(step === 'deposit' || step === 'salary' || step === 'emergency') && (
          <div className="flex gap-2">
            <button type="button" onClick={goBack}
              className="flex-1 h-14 bg-gray-200 text-gray-700 rounded-xl text-base font-medium">
              이전
            </button>
            <button type="button"
              onClick={() => handleRoleNext(
                step === 'deposit' ? depositId : step === 'salary' ? salaryId : emergencyId
              )}
              className="flex-1 h-14 bg-[#131329] text-white rounded-xl text-base font-medium">
              다음
            </button>
          </div>
        )}

        {step === 'stock' && (
          <div className="flex gap-2">
            <button type="button" onClick={goBack}
              className="flex-1 h-14 bg-gray-200 text-gray-700 rounded-xl text-base font-medium">
              이전
            </button>
            <button type="button" onClick={() => handleFinish(false)} disabled={loading}
              className="flex-1 h-14 bg-gray-200 text-gray-700 rounded-xl text-base font-medium disabled:opacity-60">
              건너뛰기
            </button>
            <button type="button" onClick={() => handleFinish(true)} disabled={loading || !stockId}
              className="flex-1 h-14 bg-[#131329] text-white rounded-xl text-base font-medium disabled:opacity-60">
              {loading ? '처리 중...' : '완료'}
            </button>
          </div>
        )}
      </div>

      <div className="h-8 bg-[#131329]" />
    </div>
  );
}

interface AccountSelectProps {
  accounts: (BankAccountSummary | StockAccountSummary)[];
  value: number | '';
  onChange: (v: number | '') => void;
}

function AccountSelect({ accounts, value, onChange }: AccountSelectProps) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">계좌 선택</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
          className="w-full h-14 bg-gray-100 rounded-xl px-4 text-sm text-gray-800 outline-none appearance-none cursor-pointer"
        >
          <option value="">계좌를 선택해주세요</option>
          {accounts.map((a) => (
            <option key={a.accountId} value={a.accountId}>
              {a.accountName} ({a.accountNumber})
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs">▼</span>
      </div>
    </div>
  );
}

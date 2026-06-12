'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Loader2, ChevronDown, ArrowDownToLine, Wallet, ShieldCheck, TrendingUp, type LucideIcon } from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import { getAccountsWithRoles, setAccountRole } from '@/api/bank';
import { getStockAccounts } from '@/api/stock';
import type { BankAccount, AccountRole } from '@/types/bank';

const ROLE_CONFIG: { role: AccountRole; label: string; Icon: LucideIcon; sub: string }[] = [
  { role: 'DEPOSIT',   label: '입금 통장',   Icon: ArrowDownToLine, sub: '프리랜서 수입이 들어오는 계좌' },
  { role: 'SALARY',    label: '월급 통장',   Icon: Wallet,          sub: '가상 월급이 이체되는 계좌' },
  { role: 'EMERGENCY', label: '비상금 통장', Icon: ShieldCheck,     sub: '비상금이 적립되는 계좌' },
  { role: 'STOCK',     label: '증권 계좌',   Icon: TrendingUp,      sub: '투자 자금이 이체되는 계좌' },
];

const BANK_CODE_MAP: Record<string, string> = {
  '001': '한국은행', '002': '산업은행', '003': '기업은행', '004': '국민은행',
  '011': '농협', '020': '우리은행', '023': 'SC제일은행', '027': '씨티은행',
  '032': '대구은행', '034': '광주은행', '035': '제주은행', '037': '전북은행',
  '039': '경남은행', '045': '새마을금고', '048': '신협', '050': '저축은행',
  '064': '산림조합', '071': '우체국', '081': '하나은행', '088': '신한은행',
  '089': '케이뱅크', '090': '카카오뱅크', '092': '토스뱅크',
};

function bankName(code: string): string {
  return BANK_CODE_MAP[code] ?? code;
}

function formatKRW(n: number | null | undefined): string {
  if (n == null) return '-';
  return `${n.toLocaleString('ko-KR')} 원`;
}

function AccountListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-2xl px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-36 h-3 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="w-20 h-4 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AccountManageView() {
  const router = useRouter();

  const [accounts, setAccounts]               = useState<BankAccount[]>([]);
  const [stockAccountIds, setStockAccountIds] = useState<Set<number>>(new Set());
  const [loading, setLoading]                 = useState(true);
  const [fetchError, setFetchError]           = useState('');
  const [mode, setMode]                       = useState<'view' | 'edit'>('view');
  const [selections, setSelections]           = useState<Partial<Record<AccountRole, number | ''>>>({});
  const [saving, setSaving]                   = useState(false);
  const [saveError, setSaveError]             = useState('');

  const fetchAccounts = () => {
    setLoading(true);
    setFetchError('');
    Promise.all([getAccountsWithRoles(), getStockAccounts()])
      .then(([allAccounts, stockRes]) => {
        setAccounts(allAccounts);
        setStockAccountIds(new Set(stockRes.accounts.map((a) => a.accountId)));
      })
      .catch(() => setFetchError('계좌 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAccounts(); }, []);

  const enterEdit = () => {
    const initial: Partial<Record<AccountRole, number | ''>> = {};
    ROLE_CONFIG.forEach(({ role }) => {
      const account = accounts.find((a) => a.accountRole === role);
      initial[role] = account?.accountId ?? '';
    });
    setSelections(initial);
    setSaveError('');
    setMode('edit');
  };

  const cancelEdit = () => {
    setMode('view');
    setSelections({});
    setSaveError('');
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const tasks: Promise<unknown>[] = [];
      ROLE_CONFIG.forEach(({ role }) => {
        const accountId = selections[role];
        if (accountId) tasks.push(setAccountRole(Number(accountId), role));
      });
      await Promise.all(tasks);
      const [allAccounts, stockRes] = await Promise.all([getAccountsWithRoles(), getStockAccounts()]);
      setAccounts(allAccounts);
      setStockAccountIds(new Set(stockRes.accounts.map((a) => a.accountId)));
      setMode('view');
      setSelections({});
    } catch {
      setSaveError('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const availableAccounts = (role: AccountRole) => {
    const isStockRole = role === 'STOCK';
    return accounts.filter((a) => {
      const isStockAccount = stockAccountIds.has(a.accountId);
      if (isStockRole !== isStockAccount) return false;
      const usedByOther = ROLE_CONFIG.some(
        (r) => r.role !== role && selections[r.role] === a.accountId
      );
      return !usedByOther;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* 헤더 */}
      <div className="flex items-center px-5 py-3 bg-gray-50 shrink-0 relative border-b border-gray-100">
        <button onClick={() => mode === 'edit' ? cancelEdit() : router.back()}>
          <ArrowLeft size={22} className="text-gray-800" />
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">
          {mode === 'edit' ? '계좌 설정' : '계좌 관리'}
        </span>
        {mode === 'view' && !loading && !fetchError && (
          <button
            onClick={enterEdit}
            className="ml-auto flex items-center gap-1 text-xs font-semibold text-sky-500"
          >
            <Pencil size={13} />
            편집
          </button>
        )}
      </div>

      {/* ── 조회 모드 ── */}
      {mode === 'view' && (
        <div className="flex-1 overflow-y-auto px-4 py-5">
          {loading ? (
            <AccountListSkeleton />
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <p className="text-sm text-gray-400">{fetchError}</p>
              <button
                onClick={fetchAccounts}
                className="text-sm text-sky-500 font-semibold border border-sky-300 px-5 py-2 rounded-xl"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 px-1 mb-4">
                각 통장 역할을 설정하면 가상 월급 자동 이체 및 수입 매칭에 활용됩니다.
              </p>
              <div className="bg-white rounded-2xl divide-y divide-gray-100">
                {ROLE_CONFIG.map(({ role, label, Icon, sub }) => {
                  const account = accounts.find((a) => a.accountRole === role) ?? null;
                  return (
                    <div key={role} className="flex items-center gap-3 px-4 py-4">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                        <Icon size={20} className="text-primary-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{label}</p>
                        {account ? (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {bankName(account.bankCode)} · {account.accountNumber}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {account ? (
                          <>
                            <p className="text-sm font-bold text-gray-900">{formatKRW(account.balance)}</p>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-gray-300 bg-gray-100 px-2.5 py-1 rounded-full">
                            미설정
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 수정 모드 ── */}
      {mode === 'edit' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            <p className="text-xs text-gray-400 px-1">
              각 역할에 연동할 계좌를 선택해주세요.
            </p>
            {accounts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center pt-10">연동된 계좌가 없습니다.</p>
            ) : (
              ROLE_CONFIG.map(({ role, label, Icon, sub }) => (
                <div key={role} className="bg-white rounded-2xl px-4 py-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-primary-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{label}</p>
                      <p className="text-xs text-gray-400">{sub}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <select
                      value={selections[role] ?? ''}
                      onChange={(e) =>
                        setSelections((prev) => ({
                          ...prev,
                          [role]: e.target.value ? Number(e.target.value) : '',
                        }))
                      }
                      className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 pr-10 text-sm text-gray-800 outline-none appearance-none cursor-pointer focus:border-sky-400 focus:bg-white transition-colors"
                    >
                      <option value="">계좌를 선택해주세요</option>
                      {availableAccounts(role).map((a) => (
                        <option key={a.accountId} value={a.accountId}>
                          {bankName(a.bankCode)} · {a.accountNumber}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 하단 버튼 */}
          <div className="px-4 pt-3 pb-6 bg-white border-t border-gray-100 shrink-0">
            {saveError && (
              <p className="text-xs text-red-500 text-center mb-2">{saveError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600 bg-white"
              >
                취소
              </button>
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="flex-1 py-3.5 rounded-2xl bg-sky-500 text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:bg-sky-300"
              >
                {saving ? <><Loader2 size={15} className="animate-spin" /> 저장 중</> : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

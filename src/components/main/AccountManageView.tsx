'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings, Loader2 } from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import { getAccountsWithRoles, setAccountRole } from '@/api/bank';
import { getStockAccounts } from '@/api/stock';
import type { BankAccount, AccountRole } from '@/types/bank';

const ROLE_CONFIG: { role: AccountRole; label: string }[] = [
  { role: 'DEPOSIT',   label: '입금 통장' },
  { role: 'SALARY',    label: '월급 통장' },
  { role: 'STOCK',     label: '증권 계좌' },
  { role: 'EMERGENCY', label: '비상금 통장' },
];

// const ROLE_ACCOUNT_LABEL: Partial<Record<AccountRole, string>> = {
//   DEPOSIT:   '입출금 통장',
//   SALARY:    '월급 통장',
//   EMERGENCY: '비상금 통장',
//   STOCK:     '계좌',
// };

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

// function maskAccountNumber(num: string): string {
//   const parts = num.split('-');
//   if (parts.length >= 2) {
//     return parts.slice(0, -1).join('-') + '-****';
//   }
//   return num.slice(0, -4) + '****';
// }

// ────────────────────────────────────────────────────────────
// 로딩 스켈레톤
// ────────────────────────────────────────────────────────────
function AccountListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl px-4 py-4 flex items-center justify-between shadow-sm">
          <div className="space-y-2">
            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-24 h-3 bg-gray-100 rounded animate-pulse" />
            <div className="w-20 h-3 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="w-6 h-6 bg-gray-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 메인 컴포넌트
// ────────────────────────────────────────────────────────────
export default function AccountManageView() {
  const router = useRouter();

  const [accounts, setAccounts]         = useState<BankAccount[]>([]);
  const [stockAccountIds, setStockAccountIds] = useState<Set<number>>(new Set());
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState('');
  const [mode, setMode]             = useState<'view' | 'edit'>('view');
  const [selections, setSelections] = useState<Partial<Record<AccountRole, number | ''>>>({});
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState('');

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

  // 톱니바퀴 클릭 → 통합 수정 화면 진입
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

  // 취소
  const cancelEdit = () => {
    setMode('view');
    setSelections({});
    setSaveError('');
  };

  // 전체 저장
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

  // 특정 역할에서 선택 가능한 계좌 목록
  const availableAccounts = (role: AccountRole) => {
    const isStockRole = role === 'STOCK';
    return accounts.filter((a) => {
      // STOCK 역할: 증권 계좌만 / 그 외: 은행 계좌만
      const isStockAccount = stockAccountIds.has(a.accountId);
      if (isStockRole !== isStockAccount) return false;
      // 다른 역할에 이미 선택된 계좌 제외
      const usedByOther = ROLE_CONFIG.some(
        (r) => r.role !== role && selections[r.role] === a.accountId
      );
      return !usedByOther;
    });
  };

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-screen bg-bg">

      {/* 헤더 */}
      <div className="flex items-center px-5 py-3 bg-bg shrink-0 relative border-b border-gray-100">
        <button onClick={() => mode === 'edit' ? cancelEdit() : router.back()}>
          <ArrowLeft size={22} className="text-gray-800" />
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">
          {mode === 'edit' ? '계좌 설정' : '계좌 관리'}
        </span>
      </div>

      {/* ── 조회 모드 ── */}
      {mode === 'view' && (
        <div className="flex-1 overflow-y-auto px-4 py-5">
          {loading ? (
            <AccountListSkeleton />
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 pt-20">
              <p className="text-sm text-gray-400">{fetchError}</p>
              <button
                onClick={fetchAccounts}
                className="text-sm text-sky-500 font-medium border border-sky-300 px-4 py-2 rounded-xl"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <div>
              <div className="flex justify-end mb-1 pr-1">
                <button
                  onClick={enterEdit}
                  className="p-1"
                  aria-label="계좌 설정"
                >
                  <Settings size={16} className="text-gray-400" />
                </button>
              </div>
              <div className="bg-bg-card shadow-md rounded-2xl p-2 space-y-2">
                {ROLE_CONFIG.map(({ role, label }) => {
                  const account = accounts.find((a) => a.accountRole === role) ?? null;
                  return (
                    <div key={role} className="flex items-center justify-between bg-gray-100 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{label}</p>
                        {account ? (
                          <p className="text-sm font-medium text-gray-800 mt-0.5">
                            {bankName(account.bankCode)} · {account.accountNumber}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 mt-0.5">미설정</p>
                        )}
                      </div>
                      {account && (
                        <p className="text-sm font-bold text-gray-900">{formatKRW(account.balance)}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 수정 모드: 한 화면에서 전체 역할 설정 ── */}
      {mode === 'edit' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
            {accounts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center pt-10">연동된 계좌가 없습니다.</p>
            ) : (
              ROLE_CONFIG.map(({ role, label }) => (
                <div key={role}>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">{label}</label>
                  <div className="relative">
                    <select
                      value={selections[role] ?? ''}
                      onChange={(e) =>
                        setSelections((prev) => ({
                          ...prev,
                          [role]: e.target.value ? Number(e.target.value) : '',
                        }))
                      }
                      className="w-full h-14 bg-gray-100 rounded-2xl px-4 text-sm text-gray-800 outline-none appearance-none cursor-pointer"
                    >
                      <option value="">계좌를 선택해주세요</option>
                      {availableAccounts(role).map((a) => (
                        <option key={a.accountId} value={a.accountId}>
                          {bankName(a.bankCode)} · {a.accountNumber}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs">▼</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 하단 버튼 */}
          <div className="px-4 pt-3 pb-4 bg-white border-t border-gray-100 shrink-0">
            {saveError && (
              <p className="text-xs text-red-500 text-center mb-2">{saveError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600 bg-white"
              >
                취소
              </button>
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="flex-1 py-3 rounded-2xl bg-sky-500 text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:bg-sky-300"
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

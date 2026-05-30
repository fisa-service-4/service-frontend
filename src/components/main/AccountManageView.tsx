'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Check, Loader2 } from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import { getAccounts, setAccountRole } from '@/api/bank';
import type { BankAccount, AccountRole } from '@/types/bank';

const ROLE_CONFIG: { role: AccountRole; label: string }[] = [
  { role: 'DEPOSIT',   label: '입금 통장' },
  { role: 'SALARY',    label: '월급 통장' },
  { role: 'STOCK',     label: '증권 계좌' },
  { role: 'EMERGENCY', label: '비상금 통장' },
];

const ROLE_ACCOUNT_LABEL: Partial<Record<AccountRole, string>> = {
  DEPOSIT:   '입출금 통장',
  SALARY:    '월급 통장',
  EMERGENCY: '비상금 통장',
  STOCK:     '계좌',
};

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
  if (n == null) return '₩ -';
  return `₩ ${n.toLocaleString('ko-KR')}`;
}

function maskAccountNumber(num: string): string {
  const parts = num.split('-');
  if (parts.length >= 2) {
    return parts.slice(0, -1).join('-') + '-****';
  }
  return num.slice(0, -4) + '****';
}

// ────────────────────────────────────────────────────────────
// 로딩 스켈레톤
// ────────────────────────────────────────────────────────────
function RoleSkeleton() {
  return (
    <div className="space-y-5">
      {ROLE_CONFIG.map(({ role }) => (
        <div key={role}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-24 h-8 bg-sky-100 rounded-xl animate-pulse" />
            <div className="w-6 h-6 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-16 bg-sky-100 rounded-2xl animate-pulse" />
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

  const [accounts, setAccounts]               = useState<BankAccount[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [fetchError, setFetchError]           = useState('');
  const [mode, setMode]                       = useState<'view' | 'edit'>('view');
  const [selectedRole, setSelectedRole]       = useState<AccountRole | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [saving, setSaving]                   = useState(false);
  const [saveError, setSaveError]             = useState('');

  const fetchAccounts = () => {
    setLoading(true);
    setFetchError('');
    getAccounts()
      .then(setAccounts)
      .catch(() => setFetchError('계좌 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAccounts(); }, []);

  // 연필 버튼 클릭 → 수정 모드 진입
  const enterEdit = (role: AccountRole) => {
    const current = accounts.find((a) => a.accountRole === role);
    setSelectedRole(role);
    setSelectedAccountId(current?.accountId ?? null);
    setSaveError('');
    setMode('edit');
  };

  // 취소
  const cancelEdit = () => {
    setMode('view');
    setSelectedRole(null);
    setSelectedAccountId(null);
    setSaveError('');
  };

  // 저장
  const handleSave = async () => {
    if (!selectedRole) return;
    if (selectedAccountId === null) {
      setSaveError('계좌를 선택해주세요.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await setAccountRole(selectedAccountId, selectedRole);
      await getAccounts().then(setAccounts);
      setMode('view');
      setSelectedRole(null);
      setSelectedAccountId(null);
    } catch {
      setSaveError('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  // ── 수정 모드에서 계좌 항목의 상태 판별 ──────────────────
  const getAccountItemState = (account: BankAccount): 'checked' | 'selectable' | 'disabled' => {
    const role = account.accountRole;
    if (account.accountId === selectedAccountId) return 'checked';
    if (!role || role === 'NONE' || role === selectedRole) return 'selectable';
    return 'disabled';
  };

  const roleLabelOf = (role: AccountRole): string =>
    ROLE_CONFIG.find((r) => r.role === role)?.label ?? role;

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* 헤더 */}
      <div className="flex items-center px-5 py-4 bg-white shrink-0 relative border-b border-gray-100">
        <button onClick={() => mode === 'edit' ? cancelEdit() : router.back()}>
          <ArrowLeft size={22} className="text-gray-800" />
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">
          {mode === 'edit' && selectedRole ? `${roleLabelOf(selectedRole)} 설정` : '계좌 관리'}
        </span>
      </div>

      {/* ── 조회 모드 ── */}
      {mode === 'view' && (
        <div className="flex-1 overflow-y-auto px-4 py-5">
          {loading ? (
            <RoleSkeleton />
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
            <div className="space-y-5">
              {ROLE_CONFIG.map(({ role, label }) => {
                const account = accounts.find((a) => a.accountRole === role) ?? null;
                const isStock = role === 'STOCK';
                const canEdit = !(isStock && account !== null);
                return (
                  <div key={role}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-4 py-1.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 shadow-sm">
                        {label}
                      </span>
                      {canEdit && (
                        <button
                          onClick={() => enterEdit(role)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          aria-label={`${label} 수정`}
                        >
                          <Pencil size={16} className="text-gray-400" />
                        </button>
                      )}
                    </div>

                    {account ? (
                      <div className="bg-white border-2 border-sky-500 rounded-2xl px-4 py-4">
                        <p className="text-sm font-bold text-gray-900">
                          {bankName(account.bankCode)} {ROLE_ACCOUNT_LABEL[role]}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {maskAccountNumber(account.accountNumber)}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-100 border-2 border-dashed border-gray-200 rounded-2xl px-4 py-4 flex items-center justify-center">
                        <p className="text-sm text-gray-400">미설정</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 수정 모드 ── */}
      {mode === 'edit' && selectedRole && (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* 계좌 목록 */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {accounts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center pt-10">연동된 계좌가 없습니다.</p>
            ) : (
              accounts.map((account) => {
                const state = getAccountItemState(account);
                const isDisabled = state === 'disabled';
                const isChecked  = state === 'checked';

                return (
                  <button
                    key={account.accountId}
                    disabled={isDisabled}
                    onClick={() => setSelectedAccountId(isChecked ? null : account.accountId)}
                    className={`w-full text-left rounded-2xl px-4 py-3 border-2 transition-all flex items-center justify-between gap-3
                      ${isDisabled
                        ? 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed'
                        : isChecked
                          ? 'bg-sky-50 border-sky-500'
                          : 'bg-white border-gray-200 hover:border-sky-300'
                      }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                          ${isChecked
                            ? 'bg-sky-500 border-sky-500'
                            : 'border-gray-300 bg-white'
                          }`}
                      >
                        {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>

                      <p className="text-sm text-gray-800 truncate">
                        {bankName(account.bankCode)} · {maskAccountNumber(account.accountNumber)}
                      </p>
                    </div>

                    {isDisabled && account.accountRole && account.accountRole !== 'NONE' && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg shrink-0 whitespace-nowrap">
                        {roleLabelOf(account.accountRole)}으로 사용 중
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* 하단 버튼 영역 */}
          <div className="px-4 pt-3 pb-4 bg-white border-t border-gray-100 shrink-0">
            {saveError && (
              <p className="text-xs text-red-500 text-center mb-2">{saveError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving || selectedAccountId === null}
                className={`flex-1 py-3 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 transition-colors
                  ${saving || selectedAccountId === null
                    ? 'bg-sky-300 cursor-not-allowed'
                    : 'bg-sky-500 hover:bg-sky-600 active:bg-sky-700'
                  }`}
              >
                {saving
                  ? <><Loader2 size={15} className="animate-spin" /> 저장 중</>
                  : '저장'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

import { apiRequest } from '@/utils/apiClient';
import type {
  AccountRole,
  AccountRoleUpdateResponse,
  BankAccount,
  AccountBalance,
  TransactionPage,
  Portfolio,
  TransferRequest,
  TransferCreated,
  TransferApproved,
} from '@/types/bank';

export const getAccounts = () =>
  apiRequest<BankAccount[]>('/accounts');

export const setAccountRole = (accountId: number, accountRole: AccountRole) =>
  apiRequest<AccountRoleUpdateResponse>(`/accounts/${accountId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ accountRole }),
  });

export const getAccountBalance = (accountId: number) =>
  apiRequest<AccountBalance>(`/accounts/${accountId}/balance`);

export const getTransactions = (
  accountId: number,
  params?: { from?: string; to?: string; page?: number; size?: number }
) => {
  const query = new URLSearchParams();
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.size !== undefined) query.set('size', String(params.size));
  const qs = query.toString();
  return apiRequest<TransactionPage>(
    `/accounts/${accountId}/transactions${qs ? `?${qs}` : ''}`
  );
};

export const getPortfolio = () =>
  apiRequest<Portfolio>('/portfolio');

export const createTransfer = (body: TransferRequest, pinToken: string) =>
  apiRequest<TransferCreated>('/transfers', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Idempotency-Key': crypto.randomUUID(),
      'Pin-Token': pinToken,
    },
  });

export const approveTransfer = (transferId: number) =>
  apiRequest<TransferApproved>(`/transfers/${transferId}/approve`, {
    method: 'POST',
  });

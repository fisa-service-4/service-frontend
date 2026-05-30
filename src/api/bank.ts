import { baasRequest } from '@/utils/baasClient';
import type {
  BankAccount,
  AccountBalance,
  TransactionPage,
  TransferRequest,
  TransferCreated,
  TransferApproved,
} from '@/types/bank';

export const getAccounts = () =>
  baasRequest<{ content: BankAccount[] }>('/bank/accounts')
    .then((res) => res.content);

export const getAccountBalance = (accountId: number) =>
  baasRequest<AccountBalance>(`/bank/accounts/${accountId}/balance`);

export const getTransactions = (
  accountId: number,
  params?: { from?: string; to?: string; page?: number; size?: number }
) => {
  const query = new URLSearchParams();
  if (params?.from) query.set('fromDate', params.from);
  if (params?.to) query.set('toDate', params.to);
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.size !== undefined) query.set('size', String(params.size));
  const qs = query.toString();
  return baasRequest<TransactionPage>(
    `/bank/accounts/${accountId}/transactions${qs ? `?${qs}` : ''}`
  );
};

export const createTransfer = (body: TransferRequest) =>
  baasRequest<TransferCreated>('/bank/transfers', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Idempotency-Key': crypto.randomUUID(),
    },
  });

export const approveTransfer = (transferId: number) =>
  baasRequest<TransferApproved>(`/bank/transfers/${transferId}/approve`, {
    method: 'POST',
  });

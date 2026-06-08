import { baasRequest } from "@/utils/baasClient";
import { apiRequest } from "@/utils/apiClient";
import type {
  AccountRole,
  AccountRoleUpdateResponse,
  BankAccount,
  AccountBalance,
  TransactionPage,
  TransferRequest,
  TransferCreated,
  TransferApproved,
  TransferResult,
} from "@/types/bank";

export const getAccounts = () =>
  baasRequest<{ content: BankAccount[] }>("/bank/accounts").then(
    (res) => res.content,
  );

export const getAccountsWithRoles = () =>
  apiRequest<BankAccount[]>("/accounts");

export const setAccountRole = (accountId: number, accountRole: AccountRole) =>
  apiRequest<AccountRoleUpdateResponse>(`/accounts/${accountId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ accountRole }),
  });

export const getAccountBalance = (accountId: number) =>
  baasRequest<AccountBalance>(`/bank/accounts/${accountId}/balance`);

export const getTransactions = (
  accountId: number,
  params?: { from?: string; to?: string; page?: number; size?: number },
) => {
  const query = new URLSearchParams();
  if (params?.from) query.set("fromDate", params.from);
  if (params?.to) query.set("toDate", params.to);
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.size !== undefined) query.set("size", String(params.size));
  const qs = query.toString();
  return baasRequest<TransactionPage>(
    `/bank/accounts/${accountId}/transactions${qs ? `?${qs}` : ""}`,
  );
};

export const createTransfer = (body: TransferRequest) =>
  apiRequest<TransferCreated>("/transfers", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Idempotency-Key": crypto.randomUUID(),
    },
  });

export const approveTransfer = (transferId: number) =>
  apiRequest<TransferApproved>(`/transfers/${transferId}/approve`, {
    method: "POST",
    headers: {
      "Idempotency-Key": crypto.randomUUID(),
    },
  });

export const getTransferResult = (transferId: number) =>
  apiRequest<TransferResult>(`/transfers/${transferId}`);

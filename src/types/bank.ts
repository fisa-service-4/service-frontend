export type AccountRole = 'DEPOSIT' | 'SALARY' | 'EMERGENCY' | 'STOCK' | 'NONE';

export interface BankAccount {
  accountId: number;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  balance: number | null;
  accountStatus: string;
  accountRole?: AccountRole;
}

export interface AccountRoleUpdateResponse {
  accountId: number;
  accountRole: AccountRole;
  updatedAt: string;
}

export interface AccountBalance {
  accountId: number;
  balance: number;
  availableBalance: number;
  updatedAt: string;
}

export interface BankTransaction {
  transactionId: number;
  transactionType: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'AUTO_TRANSFER';
  transactionCategory: string;
  amount: number;
  balanceAfter: number;
  transactionStatus: string;
  transactionAt: string;
}

export interface TransactionPage {
  content: BankTransaction[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Portfolio {
  totalAsset: number;
  cashAsset: number;
  stockAsset: number;
  savingAsset: number;
  availableCash: number;
  assetRatio: {
    cash: number;
    stock: number;
    saving: number;
  };
}

export interface TransferRequest {
  fromAccountId: number;
  toBankCode: string;
  toAccountNumber: string;
  transferAmount: number;
  requestedBy: 'USER' | 'AI';
}

export interface TransferCreated {
  transferId: number;
  transferStatus: string;
  requestedAt: string;
}

export interface TransferApproved {
  transferId: number;
  transferStatus: string;
  completedAt: string;
}

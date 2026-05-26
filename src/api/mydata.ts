import { mydataRequest } from '@/utils/mydataClient';
import type { Portfolio } from '@/types/bank';

export interface MyStockAccount {
  accountId: number;
  accountNumber: string;
  accountName: string;
  bankCode: string;
}

export const getMyStockAccounts = () =>
  mydataRequest<{ content: MyStockAccount[] }>('/stock/accounts');

export const getMyPortfolio = (accountId: number) =>
  mydataRequest<{ portfolio: Portfolio }>(`/stock/accounts/${accountId}/portfolio`)
    .then((res) => res.portfolio);

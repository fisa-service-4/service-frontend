import { mydataRequest } from '@/utils/mydataClient';
import { apiRequest } from '@/utils/apiClient';

export interface AssetDashboard {
  totalAssetAmount: number;
  totalBankAssetAmount: number;
  totalStockAssetAmount: number;
  investmentRatio: number;
  bankAccountCount: number;
  holdingCount: number;
  totalProfitRate: number;
}

export interface MyDataConnection {
  connected: boolean;
  bankLinked: boolean;
  stockLinked: boolean;
}

export interface BankAccountSummary {
  accountId: number;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  balance: number;
}

export interface StockAccountSummary {
  accountId: number;
  accountNumber: string;
  accountName: string;
  bankCode: string;
}

export interface MyDataConnections {
  bankAccounts: BankAccountSummary[];
  stockAccounts: StockAccountSummary[];
}

export const getAssetDashboard = () =>
  mydataRequest<AssetDashboard>('/assets/dashboard');

export const connectMyData = (provider: string) =>
  mydataRequest<MyDataConnection>('/connect', {
    method: 'POST',
    body: JSON.stringify({ provider }),
  });

export const getConnections = () =>
  mydataRequest<MyDataConnections>('/connections');

export const connectAllMyData = () =>
  apiRequest('/mydata/connect', { method: 'POST' });

export const getMydataConnections = () =>
  apiRequest<MyDataConnections>('/mydata/connections');

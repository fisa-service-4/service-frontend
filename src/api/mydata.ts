import { mydataRequest } from '@/utils/mydataClient';

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

export const getAssetDashboard = () =>
  mydataRequest<AssetDashboard>('/assets/dashboard');

export const connectMyData = (provider: string) =>
  mydataRequest<MyDataConnection>('/connect', {
    method: 'POST',
    body: JSON.stringify({ provider }),
  });

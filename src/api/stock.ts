import { apiRequest } from '@/utils/apiClient';

// TODO: GET /api/v1/stocks/accounts (X-Firebase-Uid 연동) 완료 후 동적으로 변경 예정
export const TEMP_ACCOUNT_ID = 1;

export interface Holding {
  stockCode: string;
  stockName: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  evaluationAmount: number;
  unrealizedProfit: number;
  profitRate: number;
}

export interface HoldingListResponse {
  holdings: Holding[];
}

export interface Returns {
  dailyReturnRate: number;
  monthlyReturnRate: number;
  yearlyReturnRate: number;
}

export interface Order {
  orderId: number;
  stockCode: string;
  stockName: string;
  orderType: string;
  orderMethod: string;
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  price: number;
  status: string;
  orderedAt: string;
}

export interface OrderListResponse {
  content: Order[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const getHoldings = (accountId: number) =>
  apiRequest<HoldingListResponse>(`/holdings?accountId=${accountId}`);

export const getReturns = (accountId: number) =>
  apiRequest<Returns>(`/holdings/returns?accountId=${accountId}`);

export const getOrders = (accountId: number, page = 0, size = 20) =>
  apiRequest<OrderListResponse>(`/orders?accountId=${accountId}&page=${page}&size=${size}`);

export interface CashBalance {
  cashBalance: number;
  availableBalance: number;
}

export interface OrderCreateRequest {
  stockCode: string;
  orderType: 'BUY' | 'SELL';
  orderMethod: 'MARKET' | 'LIMIT';
  quantity: number;
  price: number | null;
}

export interface OrderResponse {
  orderId: number;
  stockCode: string;
  orderType: string;
  orderMethod: string;
  quantity: number;
  price: number;
  status: string;
  orderedAt: string;
}

export const getCashBalance = (accountId: number) =>
  apiRequest<CashBalance>(`/stocks/cash-balance?accountId=${accountId}`);

export const createOrder = (accountId: number, body: OrderCreateRequest) =>
  apiRequest<OrderResponse>(`/orders?accountId=${accountId}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Idempotency-Key': crypto.randomUUID(),
    },
  });

export interface StockSearchItem {
  stockCode: string;
  stockName: string;
  market: string;
  currentPrice: number;
  changeRate: number;
}

export interface StockSearchResponse {
  content: StockSearchItem[];
}

export interface FavoriteStock {
  favoriteId: number;
  stockCode: string;
  stockName: string;
  currentPrice: number;
  changeRate: number;
}

export interface FavoriteStockListResponse {
  favorites: FavoriteStock[];
}

export const getFavorites = () =>
  apiRequest<FavoriteStockListResponse>('/favorite-stocks');

export const searchStocks = async (keyword: string): Promise<StockSearchItem[]> => {
  const res = await fetch(`/baas/v1/stock/search?keyword=${encodeURIComponent(keyword)}`);
  const json = await res.json();
  return json.data?.content ?? [];
};

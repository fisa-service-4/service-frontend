'use client';

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, TrendingUp, TrendingDown, Star } from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import NotificationPanel from '@/components/main/NotificationPanel';
import StockChart from '@/components/stock/StockChart';
import {
  getHoldings,
  getReturns,
  getOrders,
  getFavorites,
  addFavorite,
  removeFavorite,
  getStockChart,
  searchStocks,
  TEMP_ACCOUNT_ID,
  type Holding,
  type Returns,
  type Order,
  type FavoriteStock,
  type StockSearchItem,
  type ChartCandle,
} from '@/api/stock';

const fmtWon = (n: number | null) => {
  if (n === null || n === undefined) return '-';
  return n.toLocaleString('ko-KR') + ' 원';
};
const signWon = (n: number | null) => {
  if (n === null || n === undefined) return '-';
  return (n >= 0 ? '+' : '-') + Math.abs(n).toLocaleString('ko-KR') + ' 원';
};
const signRate = (n: number | null) => {
  if (n === null || n === undefined) return '-';
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
};


export default function StocksPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [returns, setReturns] = useState<Returns>({ dailyReturnRate: 0, monthlyReturnRate: 0, yearlyReturnRate: 0 });
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'holdings' | 'orders' | 'favorites'>('holdings');
  const [favorites, setFavorites] = useState<FavoriteStock[]>([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [favoriteMap, setFavoriteMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [chartMap, setChartMap] = useState<Record<string, ChartCandle[]>>({});
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const [holdingRes, returnsRes, favRes] = await Promise.all([
          getHoldings(TEMP_ACCOUNT_ID),
          getReturns(TEMP_ACCOUNT_ID),
          getFavorites(),
        ]);
        setHoldings(holdingRes.holdings);
        setReturns(returnsRes);
        const map: Record<string, number> = {};
        favRes.favorites.forEach((f) => { map[f.stockCode] = f.favoriteId; });
        setFavoriteMap(map);

        const charts = await Promise.all(
          holdingRes.holdings.map((h) => getStockChart(h.stockCode, 'DAILY'))
        );
        const chartData: Record<string, ChartCandle[]> = {};
        holdingRes.holdings.forEach((h, i) => { chartData[h.stockCode] = charts[i]; });
        setChartMap(chartData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (tab !== 'orders') return;
    (async () => {
      try {
        const res = await getOrders(TEMP_ACCOUNT_ID);
        setOrders(res.content);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [tab]);

  useEffect(() => {
    if (tab !== 'favorites') return;
    (async () => {
      try {
        const res = await getFavorites();
        setFavorites(res.favorites);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [tab]);

  useEffect(() => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchStocks(query);
        setSearchResults(results);
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const toggleFavorite = async (stockCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (favoriteMap[stockCode] !== undefined) {
        await removeFavorite(favoriteMap[stockCode]);
        setFavoriteMap((prev) => { const next = { ...prev }; delete next[stockCode]; return next; });
      } else {
        const res = await addFavorite(stockCode);
        setFavoriteMap((prev) => ({ ...prev, [stockCode]: res.favoriteId }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalValue = holdings.reduce((sum, h) => sum + (h.evaluationAmount ?? 0), 0);
  const profitLoss = holdings.reduce((sum, h) => sum + (h.unrealizedProfit ?? 0), 0);
  const profitUp = profitLoss >= 0;

  return (
    <div className="flex flex-col h-screen bg-bg">
      <div className="flex items-center justify-end px-5 py-4 shrink-0">
        <button className="p-1" onClick={() => setShowNotification(true)}>
          <Bell size={22} className="text-gray-800" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">

        {/* 검색창 */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-3 mb-4">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            className="flex-1 bg-transparent outline-none text-gray-900 text-sm placeholder:text-gray-400"
            placeholder="종목명 또는 종목코드 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 text-xs">✕</button>
          )}
        </div>

        {/* 총 평가금액 카드 */}
        {!query && <div className="bg-bg-card shadow-md rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 mb-1">총 평가금액</p>
          <p className="text-xl font-bold text-gray-900 mb-5">
            {loading ? '-' : fmtWon(totalValue)}
          </p>
          <div className="flex justify-between">
            <div>
              <p className="text-xs text-gray-500">평가손익</p>
              <p className={`text-xl font-bold mt-1 ${profitUp ? 'text-success' : 'text-error'}`}>
                {loading ? '-' : signWon(profitLoss)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">수익률 (일간)</p>
              <p className={`text-xl font-bold mt-1 flex items-center justify-end gap-1 ${returns.dailyReturnRate >= 0 ? 'text-success' : 'text-error'}`}>
                {returns.dailyReturnRate >= 0
                  ? <TrendingUp size={14} />
                  : <TrendingDown size={14} />}
                {loading ? '-' : signRate(returns.dailyReturnRate)}
              </p>
            </div>
          </div>
        </div>}

        {/* 검색 결과 */}
        {query ? (
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-3">검색 결과</p>
            {searching ? (
              <p className="text-center text-gray-400 text-sm py-10">검색 중...</p>
            ) : searchResults.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-10">검색 결과가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {searchResults.map((s) => {
                  const up = s.changeRate >= 0;
                  return (
                    <div
                      key={s.stockCode}
                      className="bg-bg-card shadow-md rounded-2xl p-4 flex justify-between items-center cursor-pointer active:bg-gray-50"
                      onClick={() => router.push(`/stocks/order?code=${s.stockCode}&name=${encodeURIComponent(s.stockName)}&price=${s.currentPrice}&changeRate=${s.changeRate}&market=${s.market}`)}
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-900">{s.stockName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.stockCode} · {s.market}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{fmtWon(s.currentPrice)}</p>
                          <p className={`text-xs font-semibold mt-0.5 ${up ? 'text-success' : 'text-error'}`}>
                            {signRate(s.changeRate)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => toggleFavorite(s.stockCode, e)}
                          className="p-1"
                        >
                          <Star
                            size={20}
                            className={favoriteMap[s.stockCode] !== undefined ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* 탭 */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
              {(['holdings', 'orders', 'favorites'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    tab === t ? 'bg-bg-card text-gray-900 shadow-md' : 'text-gray-400'
                  }`}
                >
                  {t === 'holdings' ? '보유종목' : t === 'orders' ? '주문내역' : '관심종목'}
                </button>
              ))}
            </div>

            {/* 보유종목 */}
            {tab === 'holdings' && (
              loading ? (
                <p className="text-center text-gray-400 text-sm py-10">불러오는 중...</p>
              ) : holdings.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-10">보유종목이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {holdings.map((s) => {
                    const up = (s.profitRate ?? 0) >= 0;
                    return (
                      <div key={s.stockCode} className="bg-bg-card shadow-md rounded-2xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-base font-bold text-gray-900">{s.stockName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{s.stockCode}</p>
                          </div>
                          <p className="text-base font-bold text-gray-900">{fmtWon(s.currentPrice)}</p>
                        </div>

                        {chartMap[s.stockCode]?.length > 0
                          ? <StockChart data={chartMap[s.stockCode]} height={100} />
                          : <div className="h-[100px]" />
                        }

                        <div className="flex justify-between mt-3 mb-4">
                          <div>
                            <p className="text-xs text-gray-400">보유수량</p>
                            <p className="text-sm font-bold text-gray-900 mt-1">{s.quantity}주</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">평가손익</p>
                            <p className={`text-sm font-bold mt-1 ${up ? 'text-success' : 'text-error'}`}>
                              {signWon(s.unrealizedProfit)} ({signRate(s.profitRate)})
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button className="flex-1 py-3 rounded-xl bg-primary-500 text-white text-sm font-bold">
                            매수
                          </button>
                          <button className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold">
                            매도
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* 관심종목 */}
            {tab === 'favorites' && (
              favorites.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-10">관심종목이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {favorites.map((s) => {
                    const up = s.changeRate >= 0;
                    return (
                      <div key={s.favoriteId} className="bg-bg-card shadow-md rounded-2xl p-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{s.stockName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{s.stockCode}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{fmtWon(s.currentPrice)}</p>
                          <p className={`text-xs font-semibold mt-0.5 ${up ? 'text-success' : 'text-error'}`}>
                            {signRate(s.changeRate)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* 주문내역 */}
            {tab === 'orders' && (
              orders.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-10">주문내역이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => (
                    <div key={o.orderId} className="bg-bg-card shadow-md rounded-2xl p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-base font-bold text-gray-900">{o.stockName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{o.stockCode}</p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                          o.orderType === 'BUY'
                            ? 'bg-primary-50 text-primary-700 border border-primary-100'
                            : 'bg-red-50 text-error border border-red-200'
                        }`}>
                          {o.orderType === 'BUY' ? '매수' : '매도'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <div>
                          <p className="text-xs text-gray-400">주문수량</p>
                          <p className="text-sm font-bold text-gray-900 mt-1">{o.quantity}주</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400">주문가격</p>
                          <p className="text-sm font-bold text-gray-900 mt-1">{fmtWon(o.price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">상태</p>
                          <p className="text-sm font-bold text-gray-900 mt-1">{o.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      {showNotification && <NotificationPanel onClose={() => setShowNotification(false)} />}
      <BottomNav />
    </div>
  );
}

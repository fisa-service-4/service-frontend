'use client';

import {Suspense, useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {Search, Star, TrendingDown, TrendingUp} from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import {
    addFavorite,
    cancelOrder,
    type FavoriteStock,
    getFavorites,
    getHoldings,
    getOrders,
    getReturns,
    getStockAccounts,
    type Holding,
    type Order,
    removeFavorite,
    type Returns,
    searchStocks,
    type StockSearchItem,
} from '@/api/stock';
import {authApi} from '@/api/auth';
import PinKeypad from '@/components/PinKeypad';

const ORDER_STATUS_LABEL: Record<string, string> = {
    REQUESTED: '주문요청',
    PARTIAL_FILLED: '부분체결',
    FILLED: '체결완료',
    CANCELLED: '취소',
    FAILED: '실패',
};

const fmtDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
        const hasTimezone = /Z|[+-]\d{2}:?\d{2}$/.test(dateString);
        const utcString = hasTimezone ? dateString : dateString + 'Z';
        const d = new Date(utcString);

        if (isNaN(d.getTime())) return dateString;

        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Seoul',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
        });

        const parts = formatter.formatToParts(d);
        const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]));

        return partMap.year + '.' + partMap.month + '.' + partMap.day + ' ' + partMap.hour + ':' + partMap.minute;
    } catch {
        return dateString;
    }
};

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
    return (
        <Suspense>
            <StocksContent/>
        </Suspense>
    );
}

function StocksContent() {
    const searchParams = useSearchParams();
    const initialTab = (searchParams.get('tab') as 'holdings' | 'orders' | 'favorites') ?? 'holdings';

    const [accountId, setAccountId] = useState<number | null>(null);
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [returns, setReturns] = useState<Returns>({dailyReturnRate: 0, monthlyReturnRate: 0, yearlyReturnRate: 0});
    const [orders, setOrders] = useState<Order[]>([]);
    const [tab, setTab] = useState<'holdings' | 'orders' | 'favorites'>(initialTab);
    const [favorites, setFavorites] = useState<FavoriteStock[]>([]);
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<StockSearchItem[]>([]);
    const [searching, setSearching] = useState(false);
    const [favoriteMap, setFavoriteMap] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
    const [showCancelPin, setShowCancelPin] = useState(false);
    const [cancelPin, setCancelPin] = useState('');
    const [cancelPinError, setCancelPinError] = useState('');
    const [cancelPinLoading, setCancelPinLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        (async () => {
            try {
                const [accountsRes, favRes] = await Promise.all([
                    getStockAccounts(),
                    getFavorites(),
                ]);

                const id = accountsRes.accounts[0]?.accountId ?? null;
                setAccountId(id);

                const map: Record<string, number> = {};
                favRes.favorites.forEach((f) => {
                    map[f.stockCode] = f.favoriteId;
                });
                setFavoriteMap(map);

                if (!id) return;

                const [holdingRes, returnsRes] = await Promise.all([
                    getHoldings(id),
                    getReturns(id),
                ]);
                setHoldings(holdingRes.holdings);
                setReturns(returnsRes);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (tab !== 'orders' || !accountId) return;
        (async () => {
            try {
                const res = await getOrders(accountId);
                setOrders(res.content);
            } catch (e) {
                console.error(e);
            }
        })();
    }, [tab, accountId]);

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
                setFavoriteMap((prev) => {
                    const next = {...prev};
                    delete next[stockCode];
                    return next;
                });
                setFavorites((prev) => prev.filter((f) => f.stockCode !== stockCode));
            } else {
                const res = await addFavorite(stockCode);
                setFavoriteMap((prev) => ({...prev, [stockCode]: res.favoriteId}));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openCancelPin = (orderId: number) => {
        setCancelTargetId(orderId);
        setCancelPin('');
        setCancelPinError('');
        setShowCancelPin(true);
    };

    const handleCancelPinPress = async (value: string) => {
        if (cancelPinLoading) return;
        setCancelPinError('');
        if (value === 'backspace') {
            setCancelPin((p) => p.slice(0, -1));
            return;
        }
        if (cancelPin.length >= 6) return;
        const next = cancelPin + value;
        setCancelPin(next);
        if (next.length < 6) return;
        setTimeout(async () => {
            setCancelPinLoading(true);
            try {
                await authApi.verifyPin(next);
            } catch {
                setCancelPinError('PIN번호가 올바르지 않습니다. 다시 입력해주세요.');
                setCancelPin('');
                setCancelPinLoading(false);
                return;
            }

            setShowCancelPin(false);
            setCancelPin('');
            try {
                if (cancelTargetId !== null) {
                    await cancelOrder(cancelTargetId);
                    if (accountId) {
                        const res = await getOrders(accountId);
                        setOrders(res.content);
                    }
                }
            } catch {
                alert('주문 취소에 실패했습니다. 다시 시도해주세요.');
            } finally {
                setCancelPinLoading(false);
            }
        }, 200);
    };

    const totalValue = holdings.reduce((sum, h) => sum + (h.evaluationAmount ?? 0), 0);
    const profitLoss = holdings.reduce((sum, h) => sum + (h.unrealizedProfit ?? 0), 0);
    const profitUp = profitLoss >= 0;

    return (
        <div className="flex flex-col h-screen bg-bg">

            {/* 헤더 */}
            <div className="px-5 py-3 bg-bg shrink-0" />

            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">

                {/* 검색창 */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-3 mb-4">
                    <Search size={18} className="text-gray-400 shrink-0"/>
                    <input
                        className="flex-1 bg-transparent outline-none text-gray-900 text-sm placeholder:text-gray-400"
                        placeholder="종목명 또는 종목코드 검색"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="text-gray-400 text-xs">×</button>
                    )}
                </div>

                {/* 총 평가금액 카드 */}
                {!query && <div className="bg-bg-card shadow-md rounded-2xl p-5 mb-4">
                    <p className="text-xs text-gray-500 mb-1">총 평가금액</p>
                    <p className="text-3xl font-bold text-gray-900 mb-5">
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
                                    ? <TrendingUp size={14}/>
                                    : <TrendingDown size={14}/>}
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
                                            <div
                                                key={s.stockCode}
                                                className="bg-bg-card shadow-md rounded-2xl p-4 cursor-pointer active:bg-gray-50"
                                                onClick={() => router.push("/stocks/order?code=" + s.stockCode + "&name=" + encodeURIComponent(s.stockName) + "&price=" + s.currentPrice + "&changeRate=" + (s.profitRate ?? 0) + "&market=")}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-base font-bold text-gray-900">{s.stockName}</p>
                                                        <p className="text-xs text-gray-400">{s.stockCode}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-base font-bold text-gray-900">{fmtWon(s.currentPrice)}</p>
                                                        <div className="flex items-center justify-end gap-1 mt-0.5">
                                                            <p className="text-xs text-gray-400">보유수량</p>
                                                            <p className="text-xs font-bold text-primary-500">{s.quantity}주</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-xs text-gray-400">평가손익</p>
                                                        <p className={`text-sm font-bold mt-1 ${up ? 'text-success' : 'text-error'}`}>
                                                            {signWon(s.unrealizedProfit)} ({signRate(s.profitRate)})
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-400">평균단가</p>
                                                        <p className="text-sm font-bold text-gray-900 mt-1">{fmtWon(s.averagePrice)}</p>
                                                    </div>
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
                                <p className="text-center text-gray-400 text-sm py-12">현재 등록된 관심 종목이 없습니다.</p>
                            ) : (
                                <div className="space-y-2.5">
                                    {favorites.map((s) => {
                                        const currentPrice = s.currentPrice ?? 0;
                                        const changeRate = s.changeRate ?? 0;
                                        const up = changeRate >= 0;

                                        return (
                                            <div
                                                key={s.favoriteId}
                                                className="bg-bg-card shadow-md rounded-2xl p-4.5 flex justify-between items-center cursor-pointer border border-gray-100/30 active:scale-[0.99] transition-transform"
                                                onClick={() =>
                                                    // s.market 대신 빈 문자열('')을 직접 넘겨줍니다.
                                                    router.push(
                                                        `/stocks/order?code=${s.stockCode}&name=${encodeURIComponent(s.stockName)}&price=${currentPrice}&changeRate=${changeRate}&market=`
                                                    )
                                                }
                                            >
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{s.stockName}</p>
                                                    {/* 타포그래피에서도 market 출력을 생략하거나 종목코드만 깔끔하게 노출 */}
                                                    <p className="text-xs font-semibold text-gray-400 mt-1">
                                                        {s.stockCode}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3.5">
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-gray-900 tracking-tight">
                                                            {fmtWon(currentPrice)}
                                                        </p>
                                                        <p className={`text-xs font-bold mt-1 tracking-tight ${up ? 'text-success' : 'text-error'}`}>
                                                            {signRate(changeRate)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => toggleFavorite(s.stockCode, e)}
                                                        className="p-1.5 rounded-full hover:bg-gray-50 transition-colors"
                                                    >
                                                        <Star size={20}
                                                              className="text-yellow-400 fill-yellow-400 scale-105"/>
                                                    </button>
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

                                            {/* 상단: 종목 정보 & 주문 날짜 & 주문 타입 */}
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-base font-bold text-gray-900">{o.stockName}</p>
                                                        {/* 💡 백엔드에서 받은 orderedAt 필드를 포맷팅하여 렌더링 */}
                                                        <span className="text-[11px] text-gray-400 font-medium mt-0.5">
                                    {fmtDate(o.orderedAt)}
                                </span>
                                                    </div>
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

                                            {/* 중단: 수량, 가격, 상태 */}
                                            <div className="flex justify-between bg-gray-50/50 rounded-xl p-3">
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
                                                    <p className="text-sm font-bold text-gray-900 mt-1">{ORDER_STATUS_LABEL[o.status] ?? o.status}</p>
                                                </div>
                                            </div>

                                            {/* 하단: 취소 버튼 */}
                                            {(o.status === 'REQUESTED' || o.status === 'PARTIAL_FILLED') && (
                                                <button
                                                    className="mt-3 w-full py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-600 active:bg-gray-50"
                                                    onClick={() => openCancelPin(o.orderId)}
                                                >
                                                    주문 취소
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </>
                )}
            </div>

            {showCancelPin && (
                <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => { if (!cancelPinLoading) setShowCancelPin(false); }}>
                    <div className="w-full max-w-[393px] mx-auto bg-white rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()}>
                        <p className="text-center text-base font-bold text-gray-900 mb-1">주문 취소</p>
                        <p className="text-center text-sm text-gray-500 mb-3">PIN번호를 입력해주세요</p>
                        <div className="flex justify-center gap-3 mb-3">
                            {Array.from({length: 6}).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-3 h-3 rounded-full ${i < cancelPin.length ? 'bg-primary-500' : 'bg-gray-200'}`}
                                />
                            ))}
                        </div>
                        {cancelPinError && (
                            <p className="text-center text-xs text-error mb-3">{cancelPinError}</p>
                        )}
                        <PinKeypad onPress={handleCancelPinPress} showAsterisk disabled={cancelPinLoading}/>
                    </div>
                </div>
            )}
            <BottomNav/>
        </div>
    );
}

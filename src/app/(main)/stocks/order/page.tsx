'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, Minus, Plus, ChevronDown, ArrowLeft, X } from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import PinKeypad from '@/components/PinKeypad';
import { authApi } from '@/api/auth';
import {
  getCashBalance,
  createOrder,
  getStockChart,
  getHoldings,
  TEMP_ACCOUNT_ID,
  type OrderCreateRequest,
  type ChartCandle,
} from '@/api/stock';
import StockChart from '@/components/stock/StockChart';

const ORDER_METHODS = [
  { value: 'MARKET', label: '시장가' },
  { value: 'LIMIT', label: '지정가' },
];

const RATIOS = [
  { label: '10%', value: 0.1 },
  { label: '25%', value: 0.25 },
  { label: '50%', value: 0.5 },
  { label: '최대', value: 1 },
];

const fmtWon = (n: number | null) => {
  if (n === null || n === undefined) return '-';
  return n.toLocaleString('ko-KR') + ' 원';
};


export default function StockOrderPage() {
  return (
    <Suspense>
      <StockOrderContent />
    </Suspense>
  );
}

function StockOrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const stockCode = searchParams.get('code') ?? '';
  const stockName = searchParams.get('name') ?? '';
  const stockPrice = Number(searchParams.get('price') ?? 0);
  const changeRate = Number(searchParams.get('changeRate') ?? 0);
  const market = searchParams.get('market') ?? '';
  const urlHoldingQty = Number(searchParams.get('holdingQty') ?? 0);

  const [side, setSide] = useState<'BUY' | 'SELL'>(
    searchParams.get('side') === 'SELL' ? 'SELL' : 'BUY'
  );

  const [orderMethod, setOrderMethod] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [quantity, setQuantity] = useState(0);
  const [limitPrice, setLimitPrice] = useState<number | ''>(stockPrice);
  const [methodOpen, setMethodOpen] = useState(false);
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [holdingQty, setHoldingQty] = useState(urlHoldingQty);
  const [chartData, setChartData] = useState<ChartCandle[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    getCashBalance(TEMP_ACCOUNT_ID)
      .then((res) => setAvailableBalance(res.availableBalance))
      .catch(console.error);

    if (stockCode) {
      getStockChart(stockCode, 'DAILY')
        .then(setChartData)
        .catch(console.error);
    }
  }, [stockCode]);

  useEffect(() => {
    if (urlHoldingQty > 0 || !stockCode) return;
    getHoldings(TEMP_ACCOUNT_ID)
      .then((res) => {
        const matched = res.holdings.find((h) => h.stockCode === stockCode);
        setHoldingQty(matched?.quantity ?? 0);
      })
      .catch(console.error);
  }, [stockCode, urlHoldingQty]);

  const up = changeRate >= 0;
  const activePrice = orderMethod === 'LIMIT' ? (Number(limitPrice) || 0) : stockPrice;
  const estimate = quantity * activePrice;

  const maxQty = useMemo(() => {
    if (side === 'SELL') return holdingQty;
    return activePrice > 0 && availableBalance !== null ? Math.floor(availableBalance / activePrice) : 0;
  }, [side, holdingQty, availableBalance, activePrice]);

  const setByRatio = (ratio: number) => setQuantity(Math.floor(maxQty * ratio));

  const handleSideChange = (newSide: 'BUY' | 'SELL') => {
    setSide(newSide);
    setQuantity(0);
  };

  const openPin = () => {
    if (quantity <= 0) return;
    setPin('');
    setPinError('');
    setShowPin(true);
  };

  const handlePinPress = async (value: string) => {
    if (pinLoading) return;
    setPinError('');

    if (value === 'backspace') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= 6) return;

    const next = pin + value;
    setPin(next);

    if (next.length < 6) return;

    setTimeout(async () => {
      setPinLoading(true);
      try {
        await authApi.verifyPin(next);
        setShowPin(false);
        setPin('');
        await handleSubmit();
      } catch {
        setPinError('PIN번호가 올바르지 않습니다. 다시 입력해주세요.');
        setPin('');
      } finally {
        setPinLoading(false);
      }
    }, 200);
  };

  const handleSubmit = async () => {
    if (quantity <= 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const body: OrderCreateRequest = {
        stockCode,
        orderType: side,
        orderMethod,
        quantity,
        price: activePrice,
      };
      await createOrder(TEMP_ACCOUNT_ID, body);
      setSuccess(true);
      setQuantity(0);
      setTimeout(() => router.push('/stocks?tab=orders'), 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '주문 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-bg">

      {/* 헤더 */}
      <div className="flex items-center px-5 py-4 bg-bg-card shrink-0 relative border-b border-gray-100">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-800" />
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">
          {stockName} 주문
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">

        {/* 종목 정보 카드 */}
        <div className="bg-bg-card shadow-md rounded-2xl p-4 mb-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-base font-bold text-gray-900">{stockName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stockCode} · {market}</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-gray-900">{fmtWon(stockPrice)}</p>
              <p className={`text-xs font-semibold mt-0.5 flex items-center justify-end gap-0.5 ${up ? 'text-success' : 'text-red-500'}`}>
                {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {up ? '+' : ''}{changeRate}%
              </p>
            </div>
          </div>
          {chartData.length > 0
            ? <StockChart data={chartData} height={180} />
            : <div className="h-[180px] flex items-center justify-center text-gray-300 text-sm">차트 로딩 중...</div>
          }
        </div>

        {/* 매수 / 매도 토글 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleSideChange('BUY')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
              side === 'BUY' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            매수
          </button>
          <button
            onClick={() => handleSideChange('SELL')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
              side === 'SELL' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            매도
          </button>
        </div>

        {/* 주문 폼 */}
        <div className="bg-gray-100 shadow-md rounded-2xl p-4 mb-4 space-y-4">

          {/* 주문 유형 */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">주문 유형</span>
              <div className="relative">
                <button
                  onClick={() => setMethodOpen((o) => !o)}
                  className="flex items-center gap-2 bg-bg-card border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900"
                >
                  {ORDER_METHODS.find((m) => m.value === orderMethod)?.label}
                  <ChevronDown size={15} />
                </button>
                {methodOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-bg-card border border-gray-200 rounded-xl shadow-lg z-10 min-w-28 overflow-hidden">
                    {ORDER_METHODS.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => { setOrderMethod(m.value as 'MARKET' | 'LIMIT'); setLimitPrice(stockPrice); setMethodOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium ${
                          orderMethod === m.value ? 'text-primary-500' : 'text-gray-700'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

          {/* 지정가 입력 */}
          {orderMethod === 'LIMIT' && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">지정 가격</span>
              <div className="flex items-center bg-bg-card border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setLimitPrice((p) => Math.max(0, p - 100))}
                  className="w-10 h-10 flex items-center justify-center text-gray-500"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  value={limitPrice}
                  min={0}
                  onChange={(e) => setLimitPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-28 text-center text-sm font-bold text-gray-900 outline-none bg-transparent"
                />
                <button
                  onClick={() => setLimitPrice((p) => p + 100)}
                  className="w-10 h-10 flex items-center justify-center text-gray-500"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 수량 */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">수량</span>
            <div className="flex items-center bg-bg-card border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(0, q - 1))}
                className="w-10 h-10 flex items-center justify-center text-gray-500"
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                value={quantity}
                min={0}
                max={side === 'SELL' ? maxQty : undefined}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  setQuantity(side === 'SELL' ? Math.min(val, maxQty) : val);
                }}
                className="w-14 text-center text-sm font-bold text-gray-900 outline-none bg-transparent"
              />
              <button
                onClick={() => setQuantity((q) => side === 'SELL' ? Math.min(q + 1, maxQty) : q + 1)}
                className="w-10 h-10 flex items-center justify-center text-gray-500"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* 비율 버튼 */}
          <div className="flex gap-2">
            {RATIOS.map((r) => (
              <button
                key={r.label}
                onClick={() => setByRatio(r.value)}
                className="flex-1 py-2 bg-bg-card border border-gray-200 rounded-lg text-xs font-semibold text-gray-600"
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* 예상 금액 / 예수금 */}
          <div className="border-t border-gray-200 pt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">예상 금액</span>
              <span className="text-sm font-bold text-gray-900">{fmtWon(estimate)}</span>
            </div>
            <p className={`text-xs text-primary-500 text-right ${orderMethod === 'MARKET' ? 'visible' : 'invisible'}`}>
              시장가는 현재가로 즉시 체결됩니다.
            </p>
            <div className="flex justify-between">
              {side === 'SELL' ? (
                <>
                  <span className="text-sm text-gray-500">보유 수량</span>
                  <span className="text-sm font-bold text-gray-900">{holdingQty}주</span>
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-500">주문 가능 예수금</span>
                  <span className="text-sm font-bold text-gray-900">{fmtWon(availableBalance ?? 0)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-center">
            <p className="text-xs text-red-500">{error}</p>
          </div>
        )}

        {/* 주문 성공 */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 text-center">
            <p className="text-xs text-green-600">주문이 성공적으로 접수되었습니다.</p>
          </div>
        )}

        {/* 주문 버튼 */}
        <button
          onClick={openPin}
          disabled={quantity <= 0 || submitting}
          className={`w-full py-4 rounded-2xl text-white text-base font-bold transition-opacity ${
            side === 'BUY' ? 'bg-primary-500' : 'bg-red-500'
          } ${quantity <= 0 || submitting ? 'opacity-40' : 'opacity-100'}`}
        >
          {submitting ? '처리 중...' : `${side === 'BUY' ? '매수' : '매도'} 주문`}
        </button>
      </div>

      <BottomNav />

      {/* PIN 오버레이 */}
      {showPin && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col">

          {/* 헤더 */}
          <div className="flex items-center px-5 py-4 shrink-0 relative border-b border-gray-100">
            <button onClick={() => setShowPin(false)}>
              <X size={22} className="text-gray-800" />
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">
              PIN 입력
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center pt-12 px-4">

            {/* 안내 문구 */}
            <div className="bg-gray-700 rounded-full px-6 py-2.5 mb-10">
              <p className="text-white text-sm font-medium">
                {side === 'BUY' ? '매수' : '매도'} 주문을 위해 PIN을 입력해주세요
              </p>
            </div>

            {/* PIN 도트 */}
            <div className="flex gap-4 mb-12">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-full transition-colors ${
                    i < pin.length ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* 에러 메시지 */}
            {pinError && (
              <p className="text-sm text-error mb-6">{pinError}</p>
            )}

            <div className="mt-auto pb-8 w-full">
              <PinKeypad onPress={handlePinPress} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

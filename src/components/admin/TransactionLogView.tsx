'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { adminApiRequest } from '@/utils/apiClient';

interface TransferLog {
  senderName:              string;
  fromAccountNumberMasked: string;
  transferAmount:          number;
  receiverName:            string | null;
  toAccountNumberMasked:   string;
  transferredAt:           string;
}

interface StockOrderLog {
  buyerName:             string;
  accountNumberMasked:   string;
  transactionType:       'BUY' | 'SELL';
  quantity:              number;
  totalAmount:           number;
  cashBalanceAfter:      number | null;
  transactionOccurredAt: string;
}

interface PagedResponse<T> {
  content:       T[];
  number:        number;
  size:          number;
  totalElements: number;
  totalPages:    number;
}

interface Props {
  onBack: () => void;
}

type TabType = 'transfer' | 'stock';

const PAGE_SIZE = 20;

function formatDate(iso: string) {
  const [datePart, timePart] = iso.split('T');
  return `${datePart.replace(/-/g, '.')} ${timePart ?? ''}`;
}

function formatAmount(amount: number) {
  return `${amount.toLocaleString('ko-KR')}원`;
}

function getPageNumbers(current: number, total: number): number[] {
  const max  = 5;
  const half = Math.floor(max / 2);
  let start  = Math.max(0, current - half);
  let end    = start + max - 1;
  if (end >= total) { end = total - 1; start = Math.max(0, end - max + 1); }
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

export default function TransactionLogView({ onBack }: Props) {
  const [tab,           setTab]           = useState<TabType>('transfer');
  const [page,          setPage]          = useState(0);
  const [transferLogs,  setTransferLogs]  = useState<TransferLog[]>([]);
  const [stockLogs,     setStockLogs]     = useState<StockOrderLog[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages,    setTotalPages]    = useState(1);
  const [loading,       setLoading]       = useState(false);

  const fetchTransferLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
    adminApiRequest<PagedResponse<TransferLog>>(`/admin/logs/transfers?${params}`)
      .then((data) => {
        setTransferLogs(data.content);
        setTotalElements(data.totalElements);
        setTotalPages(Math.max(1, data.totalPages));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const fetchStockLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE), sort: 'transactionOccurredAt,desc' });
    adminApiRequest<PagedResponse<StockOrderLog>>(`/admin/logs/orders?${params}`)
      .then((data) => {
        setStockLogs(data.content);
        setTotalElements(data.totalElements);
        setTotalPages(Math.max(1, data.totalPages));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    if (tab === 'transfer') fetchTransferLogs();
    else fetchStockLogs();
  }, [tab, fetchTransferLogs, fetchStockLogs]);

  const handleTabChange = (newTab: TabType) => {
    setTab(newTab);
    setPage(0);
    setTotalElements(0);
    setTotalPages(1);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white flex flex-col">

      {/* 타이틀 */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="text-slate-600 hover:text-slate-900 transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-900">거래 이력 조회</h2>
        </div>
        <p className="text-sm text-gray-500 mt-0.5 pl-7">전체 {totalElements.toLocaleString()}건</p>
      </div>

      {/* 탭 */}
      <div className="flex gap-0 px-5 mb-4 border-b border-slate-200">
        <button
          onClick={() => handleTabChange('transfer')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'transfer'
              ? 'border-slate-700 text-slate-900'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          이체
        </button>
        <button
          onClick={() => handleTabChange('stock')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'stock'
              ? 'border-slate-700 text-slate-900'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          주식거래
        </button>
      </div>

      {/* 로그 목록 */}
      <div className="flex-1 px-5">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-sm text-gray-400">불러오는 중...</div>
        ) : tab === 'transfer' ? (
          transferLogs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">데이터 없음</div>
          ) : (
            <div className="space-y-3">
              {transferLogs.map((log, idx) => (
                <div key={idx} className="bg-slate-100 rounded-2xl px-4 py-4">
                  <Row label="보낸사람" value={log.senderName} bold />
                  <Row label="출금계좌" value={log.fromAccountNumberMasked} mono />
                  <Row label="금액"     value={formatAmount(log.transferAmount)} colored />
                  <div className="h-px bg-slate-200 my-3" />
                  <Row label="받은사람" value={log.receiverName ?? '외부 계좌'} bold />
                  <Row label="입금계좌" value={log.toAccountNumberMasked} mono />
                  <Row label="금액"     value={formatAmount(log.transferAmount)} />
                  <div className="h-px bg-slate-200 my-3" />
                  <Row label="일시" value={formatDate(log.transferredAt)} small />
                </div>
              ))}
            </div>
          )
        ) : (
          stockLogs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">데이터 없음</div>
          ) : (
            <div className="space-y-3">
              {stockLogs.map((log, idx) => (
                <div key={idx} className="bg-slate-100 rounded-2xl px-4 py-4">
                  <Row label="구매자"   value={log.buyerName} bold />
                  <Row label="계좌번호" value={log.accountNumberMasked} mono />
                  <Row
                    label={log.transactionType === 'BUY' ? '매수 수량' : '매도 수량'}
                    value={`${log.quantity.toLocaleString('ko-KR')} 주`}
                  />
                  <div className="h-px bg-slate-200 my-3" />
                  <Row label="총 금액" value={formatAmount(log.totalAmount)} colored />
                  <div className="h-px bg-slate-200 my-3" />
                  <Row label="일시" value={formatDate(log.transactionOccurredAt)} small />
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-center gap-1 py-5">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="p-1 text-gray-500 disabled:text-gray-300"
        >
          <ChevronLeft size={18} />
        </button>

        {getPageNumbers(page, totalPages).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
              p === page ? 'bg-slate-700 text-white' : 'text-gray-500 hover:bg-slate-100'
            }`}
          >
            {p + 1}
          </button>
        ))}

        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          className="p-1 text-gray-500 disabled:text-gray-300"
        >
          <ChevronRight size={18} />
        </button>
      </div>

    </div>
  );
}

interface RowProps {
  label:    string;
  value:    string;
  bold?:    boolean;
  mono?:    boolean;
  colored?: boolean;
  small?:   boolean;
}

function Row({ label, value, bold, mono, colored, small }: RowProps) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-xs text-gray-900">{label}</span>
      <span
        className={[
          small   ? 'text-xs text-gray-900' : 'text-sm',
          bold    ? 'font-semibold text-gray-900' : '',
          mono    ? 'font-mono text-gray-900' : '',
          colored ? 'font-bold text-blue-600' : '',
          !bold && !mono && !colored && !small ? 'text-gray-900' : '',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  );
}

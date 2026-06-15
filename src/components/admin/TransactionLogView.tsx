'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { adminApiRequest } from '@/utils/apiClient';

interface TransferLog {
  senderId:                number | null;
  senderName:              string;
  fromAccountNumberMasked: string;
  transferAmount:          number;
  receiverId:              number | null;
  receiverName:            string | null;
  toAccountNumberMasked:   string;
  transferredAt:           string;
}

interface StockOrderLog {
  userId:                number | null;
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

type CombinedItem =
  | { kind: 'transfer'; data: TransferLog;    sortKey: number }
  | { kind: 'stock';    data: StockOrderLog;  sortKey: number };

type FilterType = 'all' | 'transfer' | 'buy' | 'sell';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all',      label: '전체' },
  { key: 'transfer', label: '이체' },
  { key: 'buy',      label: '매수' },
  { key: 'sell',     label: '매도' },
];

interface Props {
  onBack: () => void;
}

const PAGE_SIZE = 10;


function formatDate(iso: string): string {
  const [datePart, timePart] = iso.split('T');
  const time = timePart ? timePart.substring(0, 8) : '';
  return `${datePart.replace(/-/g, '.')} ${time}`;
}

function formatAmount(amount: number): string {
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
  const [items,   setItems]   = useState<CombinedItem[]>([]);
  const [filter,  setFilter]  = useState<FilterType>('all');
  const [page,    setPage]    = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      adminApiRequest<PagedResponse<TransferLog>>('/admin/logs/transfers?page=0&size=200'),
      adminApiRequest<PagedResponse<StockOrderLog>>('/admin/logs/orders?page=0&size=200&sort=transactionOccurredAt,desc'),
    ]).then(([transferResult, stockResult]) => {
      const transfers: CombinedItem[] =
        transferResult.status === 'fulfilled'
          ? transferResult.value.content.map((d) => ({
              kind: 'transfer' as const,
              data: d,
              sortKey: new Date(d.transferredAt).getTime(),
            }))
          : [];

      const stocks: CombinedItem[] =
        stockResult.status === 'fulfilled'
          ? stockResult.value.content.map((d) => ({
              kind: 'stock' as const,
              data: d,
              sortKey: new Date(d.transactionOccurredAt).getTime(),
            }))
          : [];

      const merged = [...transfers, ...stocks].sort((a, b) => b.sortKey - a.sortKey);
      setItems(merged);
      setPage(0);
    }).finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === 'all'      ? items :
    filter === 'transfer' ? items.filter((i) => i.kind === 'transfer') :
    filter === 'buy'      ? items.filter((i) => i.kind === 'stock' && i.data.transactionType === 'BUY') :
                            items.filter((i) => i.kind === 'stock' && i.data.transactionType === 'SELL');

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="flex-1 overflow-y-auto bg-white flex flex-col">

      {/* 타이틀 */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="text-slate-600 hover:text-slate-900 transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-900">거래 이력 조회</h2>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-0 px-5 mb-4 border-b border-slate-200">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setFilter(key); setPage(0); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === key
                ? 'border-slate-700 text-slate-900'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 로그 목록 */}
      <div className="flex-1 px-5">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-sm text-gray-400">불러오는 중...</div>
        ) : pageItems.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-gray-400">데이터 없음</div>
        ) : (
          <div className="space-y-3">
            {pageItems.map((item, idx) =>
              item.kind === 'transfer'
                ? <TransferCard  key={idx} data={item.data} />
                : <StockCard     key={idx} data={item.data} />
            )}
          </div>
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

function TransferCard({ data }: { data: TransferLog }) {
  return (
    <div className="bg-slate-100 rounded-2xl px-4 py-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">이체</span>
      </div>

      <Row label="보낸사람" value={data.senderId != null ? `사용자: ${data.senderId}` : '외부'} bold />
      <Row label="계좌번호" value={data.fromAccountNumberMasked}                                mono />
      <Row label="금액"     value={formatAmount(data.transferAmount)}                           colored />
      <Row label="시간"     value={formatDate(data.transferredAt)}                              small />

      <div className="h-px bg-slate-200 my-3" />

      <Row label="받는사람" value={data.receiverId != null ? `사용자: ${data.receiverId}` : '외부'} bold />
      <Row label="계좌번호" value={data.toAccountNumberMasked} mono />
      <Row label="금액"     value={formatAmount(data.transferAmount)} />
    </div>
  );
}

function StockCard({ data }: { data: StockOrderLog }) {
  return (
    <div className="bg-slate-100 rounded-2xl px-4 py-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">주식거래</span>
      </div>

      <Row label="사용자"   value={data.userId != null ? `사용자: ${data.userId}` : '외부'} bold />
      <Row label="계좌번호" value={data.accountNumberMasked}      mono />
      <Row label="수량"     value={`${data.quantity.toLocaleString('ko-KR')} 주`} />
      <Row label="총 금액"  value={formatAmount(data.totalAmount)} colored />
      <Row label="시간"     value={formatDate(data.transactionOccurredAt)} small />
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

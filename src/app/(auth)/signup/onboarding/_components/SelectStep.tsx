'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';

const PROVIDERS = [
  { label: '카카오뱅크',  value: 'KAKAO_BANK',   logo: '/banks/Kakao.png' },
  { label: 'KB국민은행',  value: 'KB_BANK',       logo: '/banks/KB.png' },
  { label: '신한은행',    value: 'SHINHAN_BANK',  logo: '/banks/Shinhan.png' },
  { label: '우리은행',    value: 'WOORI_BANK',    logo: '/banks/Woori.png' },
  { label: '하나은행',    value: 'HANA_BANK',     logo: '/banks/Hana.png' },
  { label: 'NH농협은행',  value: 'NH_BANK',       logo: '/banks/NH.png' },
  { label: 'IBK기업은행', value: 'IBK_BANK',      logo: '/banks/IBK.png' },
  { label: 'SC제일은행',  value: 'SC_BANK',       logo: '/banks/SC.png' },
  { label: '토스뱅크',   value: 'TOSS_BANK',     logo: '/banks/Toss.png' },
];

interface Props {
  userName: string;
  onNext: () => void;
  onBack: () => void;
  loading?: boolean;
  error?: string;
}

function CheckIcon({ filled }: { filled: boolean }) {
  return (
    <div
      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
        filled ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
      }`}
    >
      {filled && (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
          <path
            d="M2 6l3 3 5-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

export default function SelectStep({ userName, onNext, onBack, loading, error }: Props) {
  const [allChecked, setAllChecked] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* 헤더 */}
      <div className="bg-bg flex items-center px-4 py-3">
        <button type="button" onClick={onBack} className="text-gray-800 p-1">
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-1">
          {userName ? `${userName}님의 자산` : '내 자산'}
          <br />한 번에 찾아볼게요
        </h1>
        <p className="text-sm text-gray-400 mb-6">연동할 금융기관을 확인해주세요</p>

        {/* 모든 기관 */}
        <button
          type="button"
          onClick={() => setAllChecked((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 rounded-2xl mb-1"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
              <span className="text-xs text-gray-500 font-bold">전체</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">모든 기관</span>
          </div>
          <CheckIcon filled={allChecked} />
        </button>

        {/* 개별 기관 목록 */}
        <div className="flex flex-col">
          {PROVIDERS.map((p) => (
            <div key={p.value} className="flex items-center justify-between px-4 py-3.5 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  <Image
                    src={p.logo}
                    alt={p.label}
                    width={36}
                    height={36}
                    className="object-contain"
                  />
                </div>
                <span className="text-sm font-medium text-gray-800">{p.label}</span>
              </div>
              <CheckIcon filled={allChecked} />
            </div>
          ))}
        </div>
      </div>

      {/* 에러 메시지 - 고정 높이 */}
      <div className="px-6 h-8 flex items-center">
        <p className={`text-sm text-red-500 ${error ? 'visible' : 'invisible'}`}>{error || ' '}</p>
      </div>

      {/* 하단 버튼 - 고정 */}
      <div className="px-6 pb-8">
        <button
          type="button"
          onClick={onNext}
          disabled={loading}
          className="w-full h-14 bg-primary-500 text-white rounded-xl text-base font-semibold disabled:opacity-60 transition-opacity"
        >
          {loading ? '연동 중...' : '찾아보기'}
        </button>
      </div>
    </div>
  );
}

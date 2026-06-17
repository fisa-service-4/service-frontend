'use client';

import { ChevronLeft, BarChart3, Wallet, TrendingUp } from 'lucide-react';

const FEATURES = [
  {
    icon: BarChart3,
    label: '자산 한눈에 보기',
    desc: '은행·증권 자산을 하나의 화면에서 통합 조회',
  },
  {
    icon: Wallet,
    label: '가상 월급 설정',
    desc: '불규칙한 수입도 안정적인 월급으로 전환',
  },
  {
    icon: TrendingUp,
    label: 'AI 투자 분석',
    desc: '소비 패턴 분석으로 맞춤 포트폴리오 추천',
  },
];

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export default function IntroStep({ onNext, onBack }: Props) {
  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* 헤더 */}
      <div className="bg-bg flex items-center px-4 py-3">
        <button type="button" onClick={onBack} className="text-gray-800 p-1">
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="flex-1 flex flex-col px-6 pt-10 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">
          더 스마트한 자산 관리를 위해<br />
          <span className="text-primary-500">마이데이터</span>를 연동해보세요
        </h1>
        <p className="text-sm text-gray-400 mb-10">
          금융기관을 연결하면 자산을 한 곳에서 관리할 수 있어요
        </p>

        <div className="flex flex-col gap-3">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-center gap-4 bg-gray-50 rounded-2xl px-5 py-4"
            >
              <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                <Icon size={22} className="text-primary-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pb-8">
        <button
          type="button"
          onClick={onNext}
          className="w-full h-14 bg-primary-500 text-white rounded-xl text-base font-semibold"
        >
          연동하기
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

const NOTICES = [
  {
    id: 1,
    title: '[공지] 서비스 이용약관 개정 안내',
    date: '2026-06-10',
    isNew: true,
    content:
      '안녕하세요, 프리랜서 AI 자산관리 플랫폼입니다.\n\n2026년 7월 1일부터 서비스 이용약관이 일부 개정됩니다. 주요 변경 사항은 다음과 같습니다.\n\n1. 개인정보 처리 방침 항목 보완\n2. AI 분석 기능 관련 조항 신설\n3. 마이데이터 연동 관련 동의 항목 세분화\n\n변경된 약관은 시행일 이후 서비스 이용 시 자동으로 적용됩니다. 자세한 내용은 앱 내 약관 페이지에서 확인하실 수 있습니다.',
  },
  {
    id: 2,
    title: '[안내] AI 브리핑 기능 업데이트',
    date: '2026-06-05',
    isNew: true,
    content:
      'AI 브리핑 기능이 업데이트되었습니다.\n\n이번 업데이트를 통해 다음 기능이 개선되었습니다.\n\n• 소비 패턴 분석 정확도 향상\n• 투자 포트폴리오 요약 리포트 추가\n• 월별 수입/지출 비교 차트 제공\n• 이상 거래 탐지 알림 응답 속도 개선\n\n더욱 정확한 AI 분석을 경험해 보세요.',
  },
  {
    id: 3,
    title: '[점검] 시스템 정기 점검 안내 (6월)',
    date: '2026-05-30',
    isNew: false,
    content:
      '시스템 안정성 향상을 위한 정기 점검이 진행될 예정입니다.\n\n▸ 점검 일시: 2026년 6월 15일(일) 새벽 2:00 ~ 4:00\n▸ 영향 범위: 전체 서비스 (로그인, 거래, AI 채팅 등)\n\n점검 시간 동안은 서비스 이용이 일시 중단됩니다. 이용에 불편을 드려 죄송합니다.',
  },
  {
    id: 4,
    title: '[공지] 마이데이터 연동 기관 추가',
    date: '2026-05-20',
    isNew: false,
    content:
      '마이데이터 연동 가능 금융기관이 확대되었습니다.\n\n신규 추가 기관:\n• 카카오뱅크\n• 토스뱅크\n• 케이뱅크\n• NH농협은행\n• IBK기업은행\n\n마이페이지 > 연동 계좌 관리에서 새로운 기관을 연동하실 수 있습니다.',
  },
  {
    id: 5,
    title: '[안내] 가상 월급 자동 이체 기능 출시',
    date: '2026-05-10',
    isNew: false,
    content:
      '프리랜서 특화 기능인 가상 월급 자동 이체 기능이 출시되었습니다.\n\n설정한 월급일에 입금 통장 잔액을 월급/비상금/투자 통장으로 자동 분배합니다.\n\n사용 방법:\n1. 마이페이지 > 가상 월급 설정 진입\n2. 목표 월급 금액 및 월급일 설정\n3. 각 통장별 이체 금액 입력\n4. PIN 인증 후 저장\n\nAI 추천 기능을 활용하면 최적 분배 비율을 자동으로 추천받을 수 있습니다.',
  },
];

export default function NoticePage() {
  const router = useRouter();
  const [openId, setOpenId] = useState<number | null>(null);

  function toggle(id: number) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="flex items-center px-5 py-3 bg-bg shrink-0 relative border-b border-gray-100">
        <button onClick={() => router.back()}>
          <ArrowLeft size={22} className="text-gray-800" />
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">
          공지사항
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {NOTICES.map((notice) => (
          <div key={notice.id} className="bg-white rounded-2xl overflow-hidden">
            <button
              onClick={() => toggle(notice.id)}
              className="w-full flex items-center justify-between px-4 py-4 text-left"
            >
              <div className="flex-1 pr-3">
                <div className="flex items-center gap-2 mb-1">
                  {notice.isNew && (
                    <span className="text-xs font-bold text-sky-500 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                      NEW
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{notice.date}</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 leading-snug">
                  {notice.title}
                </p>
              </div>
              {openId === notice.id ? (
                <ChevronUp size={18} className="text-gray-400 shrink-0" />
              ) : (
                <ChevronDown size={18} className="text-gray-400 shrink-0" />
              )}
            </button>
            {openId === notice.id && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line pt-3">
                  {notice.content}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

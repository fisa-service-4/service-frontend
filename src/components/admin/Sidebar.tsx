'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  subItems?: string[];
}

const menuItems: MenuItem[] = [
  { label: '대시보드' },
  {
    label: '회원 관리',
    subItems: ['전체 사용자 목록', '사용자 상세 정보'],
  },
  {
    label: '로그 관리',
    subItems: [
      '로그인 이력 조회',
      '거래 이력 조회',
      'AI 에이전트 로그 조회',
      '알림 발송 이력 조회',
      '시스템 오류 로그 조회',
      'API 호출 이력 조회',
    ],
  },
  { label: '설정' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    '회원 관리': false,
    '로그 관리': false,
  });

  const toggleMenu = (menuLabel: string) => {
    setExpandedMenus((prev) => ({ ...prev, [menuLabel]: !prev[menuLabel] }));
  };

  return (
    <>
      {/* 딤 배경 — absolute로 폰 컨테이너 안에서만 */}
      {isOpen && (
        <div
          className="absolute inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* 사이드바 패널 — absolute로 폰 컨테이너 기준 */}
      <div
        className={`absolute left-0 top-0 h-full w-72 bg-slate-900 z-50
          transition-transform duration-300 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* 헤더 */}
        <div className="p-5 border-b border-slate-700 shrink-0">
          <button onClick={onClose} className="mb-6">
            <X size={24} className="text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0">
              <div className="w-6 h-6 bg-slate-900 rounded-full" />
            </div>
            <div>
              <div className="text-white font-semibold">ADMIN</div>
              <div className="text-slate-400 text-sm">admin@woorifisa.com</div>
            </div>
          </div>
        </div>

        {/* 메뉴 */}
        <div className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => (
            <div key={item.label}>
              <button
                onClick={() => item.subItems && toggleMenu(item.label)}
                className="w-full px-6 py-3 text-left text-white hover:bg-slate-800 transition-colors flex items-center justify-between"
              >
                <span>{item.label}</span>
                {item.subItems && (
                  expandedMenus[item.label]
                    ? <ChevronUp size={16} className="text-slate-400" />
                    : <ChevronDown size={16} className="text-slate-400" />
                )}
              </button>
              {item.subItems && expandedMenus[item.label] && (
                <div className="bg-slate-800/50">
                  {item.subItems.map((subItem) => (
                    <button
                      key={subItem}
                      className="w-full px-12 py-2.5 text-left text-slate-300 hover:bg-slate-800 transition-colors text-sm"
                    >
                      {subItem}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

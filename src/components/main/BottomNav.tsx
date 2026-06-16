'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Wallet, LineChart, User } from 'lucide-react';

export type MainNavItem = 'home' | 'assets' | 'stocks' | 'mypage';

const navItems = [
  { key: 'home'   as MainNavItem, label: '홈',         icon: Home      },
  { key: 'assets' as MainNavItem, label: '은행',       icon: Wallet    },
  { key: 'stocks' as MainNavItem, label: '증권',       icon: LineChart },
  { key: 'mypage' as MainNavItem, label: '마이페이지', icon: User      },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const activeNav = (pathname.split('/')[1] as MainNavItem) ?? 'home';

  return (
    <nav className="bg-bg-card border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] shrink-0">
      <div className="flex items-end px-2 pt-2 pb-4">
        {navItems.map(({ key, label, icon: Icon }) => {
          const isActive = activeNav === key;
          return (
            <button
              key={key}
              onClick={() => router.push(`/${key}`)}
              className="flex-1 flex flex-col items-center gap-1 transition-all duration-200 active:scale-95"
            >
              <div className={`flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-primary-500 shadow-[0_3px_10px_rgba(27,133,255,0.35)]'
                  : ''
              }`}>
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={`transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`}
                />
              </div>
              <span className={`text-[10px] leading-none transition-all duration-200 ${
                isActive ? 'text-primary-500 font-bold' : 'text-gray-400 font-medium'
              }`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

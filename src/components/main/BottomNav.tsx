'use client';

import { Home, Wallet, TrendingUp, User } from 'lucide-react';

export type MainNavItem = 'home' | 'assets' | 'stocks' | 'mypage';

interface BottomNavProps {
  activeNav: MainNavItem;
  onNavChange: (nav: MainNavItem) => void;
}

const navItems = [
  { key: 'home'    as MainNavItem, label: '홈',       icon: Home        },
  { key: 'assets'  as MainNavItem, label: '자산',     icon: Wallet      },
  { key: 'stocks'  as MainNavItem, label: '증권',     icon: TrendingUp  },
  { key: 'mypage'  as MainNavItem, label: '마이페이지', icon: User       },
];

export default function BottomNav({ activeNav, onNavChange }: BottomNavProps) {
  return (
    <div className="bg-slate-900 px-6 py-3 border-t border-slate-700 shrink-0">
      <div className="flex justify-around items-center">
        {navItems.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onNavChange(key)}
            className={`flex flex-col items-center py-1 transition-colors ${
              activeNav === key ? 'text-sky-400' : 'text-slate-400'
            }`}
          >
            <Icon size={20} className="mb-1" />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

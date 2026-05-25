import { LayoutDashboard, UserCog, FileText, Settings } from 'lucide-react';
import { NavItem } from '@/types/admin';

interface BottomNavProps {
  activeNav: NavItem;
  onNavChange: (nav: NavItem) => void;
}

const navItems = [
  { key: 'dashboard' as NavItem, label: '대시보드',    icon: LayoutDashboard },
  { key: 'users'     as NavItem, label: '회원 관리',   icon: UserCog         },
  { key: 'logs'      as NavItem, label: '로그 관리',   icon: FileText        },
  { key: 'settings'  as NavItem, label: '설정',        icon: Settings        },
];

export default function BottomNav({ activeNav, onNavChange }: BottomNavProps) {
  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-3 border-t border-slate-700 shrink-0">
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

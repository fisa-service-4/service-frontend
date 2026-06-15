import { ChevronRight, LogIn, Bot, ArrowLeftRight, Bell, AlertCircle, Globe } from 'lucide-react';

type LogKey = 'login' | 'ai' | 'transaction' | 'notification' | 'error' | 'api';

interface LogItem {
  key: LogKey;
  title: string;
  detail: string;
  icon: React.ReactNode;
  iconBg: string;
}

interface LogCategory {
  category: string;
  items: LogItem[];
}

const logCategories: LogCategory[] = [
  {
    category: '사용자 활동 로그',
    items: [
      { key: 'login',        title: '로그인 이력 조회',    detail: '-', icon: <LogIn size={18} className="text-white" />,          iconBg: 'bg-sky-500'    },
      { key: 'ai',           title: 'AI 에이전트 로그',    detail: '-', icon: <Bot size={18} className="text-white" />,             iconBg: 'bg-cyan-500'   },
    ],
  },
  {
    category: '서비스 운영 로그',
    items: [
      { key: 'transaction',  title: '거래 이력 조회',      detail: '-', icon: <ArrowLeftRight size={18} className="text-white" />,  iconBg: 'bg-blue-500'   },
      { key: 'notification', title: '알림 발송 이력',      detail: '-', icon: <Bell size={18} className="text-white" />,            iconBg: 'bg-indigo-500' },
    ],
  },
  {
    category: '시스템 감사 로그',
    items: [
      { key: 'error',        title: '시스템 오류 로그',    detail: '-', icon: <AlertCircle size={18} className="text-white" />,     iconBg: 'bg-slate-600'  },
      { key: 'api',          title: 'API 호출 이력',       detail: '-', icon: <Globe size={18} className="text-white" />,           iconBg: 'bg-slate-500'  },
    ],
  },
];

interface LogsViewProps {
  onSelect: (key: LogKey) => void;
}

export default function LogsView({ onSelect }: LogsViewProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-white px-4 py-5">
      <div className="space-y-5">
        {logCategories.map((category) => (
          <div key={category.category}>
            <h2 className="text-base font-bold text-gray-900 mb-2 px-1">
              {category.category}
            </h2>
            <div className="bg-slate-100 rounded-2xl overflow-hidden">
              {category.items.map((item, idx) => (
                <div key={item.key}>
                  <button
                    onClick={() => item.key !== 'notification' && onSelect(item.key)}
                    className="w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-200 transition-colors text-left"
                  >
                    <div className={`${item.iconBg} rounded-xl p-2 shrink-0`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold text-gray-900 leading-tight">{item.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.detail}</div>
                    </div>
                    <ChevronRight size={22} className="text-gray-400 shrink-0" />
                  </button>
                  {idx < category.items.length - 1 && <div className="mx-4 h-px bg-slate-200" />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

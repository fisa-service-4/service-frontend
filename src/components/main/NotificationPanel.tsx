'use client';

import { X } from 'lucide-react';

interface NotificationItem {
  notificationId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionButtons?: { label: string; action: string }[];
  createdAt: string;
}

const TYPE_LABEL: Record<string, string> = {
  DEPOSIT:         '입금',
  UNMATCHED:       '미매칭',
  DELAYED:         '지연',
  SALARY:          '월급',
  BALANCE_WARNING: '잔액경고',
  'AI-BRIEFING':   '행동제안',
  SYSTEM:          '시스템',
};

const TYPE_COLOR: Record<string, string> = {
  DEPOSIT:         'bg-sky-500 text-white',
  UNMATCHED:       'bg-amber-400 text-white',
  DELAYED:         'bg-red-400 text-white',
  SALARY:          'bg-sky-500 text-white',
  BALANCE_WARNING: 'bg-red-400 text-white',
  'AI-BRIEFING':   'bg-slate-500 text-white',
  SYSTEM:          'bg-gray-400 text-white',
};

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return '오늘';
  if (date.toDateString() === yesterday.toDateString()) return '어제';
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function groupNotifications(items: NotificationItem[]): { label: string; items: NotificationItem[] }[] {
  const groups = new Map<string, NotificationItem[]>();
  for (const item of items) {
    const label = getDateLabel(item.createdAt);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(item);
  }
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

interface Props {
  onClose: () => void;
}

export default function NotificationPanel({ onClose }: Props) {
  const notifications: NotificationItem[] = [];
  const grouped = groupNotifications(notifications);

  return (
    <div className="absolute inset-0 z-50 flex justify-end">
      {/* 어두운 배경 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 우측 알림 패널 */}
      <div className="relative w-4/5 bg-white h-full flex flex-col shadow-xl">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-4 shrink-0">
          <div className="w-7" />
          <span className="text-base font-bold text-gray-900">알림</span>
          <button onClick={onClose} className="p-1">
            <X size={22} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {grouped.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-400">알림이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map(({ label, items }) => (
                <div key={label}>
                  <p className="text-sm font-semibold text-gray-700 mb-3">{label}</p>
                  <div className="space-y-3">
                    {items.map((n) => (
                      <div key={n.notificationId} className="bg-gray-700 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TYPE_COLOR[n.type] ?? 'bg-gray-500 text-white'}`}>
                            {TYPE_LABEL[n.type] ?? n.type}
                          </span>
                          <span className="text-sm font-semibold text-white">{n.title}</span>
                        </div>
                        <p className="text-xs text-gray-300 mb-3">{n.message}</p>
                        {n.actionButtons && n.actionButtons.length > 0 && (
                          <div className="flex gap-2">
                            {n.actionButtons.map((btn) => (
                              <button
                                key={btn.action}
                                className="flex-1 py-2 bg-white rounded-xl text-xs font-semibold text-gray-800"
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatBotView from '@/components/main/ChatBotView';
import type { MainNavItem } from '@/components/main/BottomNav';

export default function ChatPage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState<MainNavItem>('home');

  return (
    <ChatBotView
      onClose={() => router.back()}
      activeNav={activeNav}
      onNavChange={(nav) => {
        setActiveNav(nav);
        router.push(`/${nav}`);
      }}
    />
  );
}

'use client';

import { useRouter } from 'next/navigation';
import ChatBotView from '@/components/main/ChatBotView';

export default function ChatPage() {
  const router = useRouter();

  return <ChatBotView onClose={() => router.back()} />;
}

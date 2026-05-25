'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Menu, ArrowRight, PlusCircle } from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import type { MainNavItem } from '@/components/main/BottomNav';

interface Message {
  id: number;
  role: 'ai' | 'user';
  content: string;
}

interface ChatSession {
  id: number;
  title: string;
  messages: Message[];
}

const GREETING: Message = {
  id: 0,
  role: 'ai',
  content: '안녕하세요! 저는 AI 금융 상담사예요.\n자산 관리, 소비 분석, 투자 등\n무엇이든 물어보세요 😊',
};

interface ChatBotViewProps {
  onClose:     () => void;
  activeNav:   MainNavItem;
  onNavChange: (nav: MainNavItem) => void;
}

export default function ChatBotView({ onClose, activeNav, onNavChange }: ChatBotViewProps) {
  const [messages, setMessages]     = useState<Message[]>([GREETING]);
  const [input, setInput]           = useState('');
  const [sidebarOpen, setSidebar]   = useState(false);
  const [sessions, setSessions]     = useState<ChatSession[]>([]);
  const [sessionId, setSessionId]   = useState(Date.now());
  const bottomRef                   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveCurrentSession = (msgs: Message[]) => {
    const userMsg = msgs.find((m) => m.role === 'user');
    if (!userMsg) return;
    setSessions((prev) => {
      const exists = prev.find((s) => s.id === sessionId);
      if (exists) {
        return prev.map((s) => s.id === sessionId ? { ...s, messages: msgs } : s);
      }
      return [{ id: sessionId, title: userMsg.content.slice(0, 20), messages: msgs }, ...prev];
    });
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: Date.now(), role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    saveCurrentSession(next);
    setInput('');
    // textarea 높이 초기화
    const ta = document.querySelector('textarea');
    if (ta) { ta.style.height = 'auto'; }

    setTimeout(() => {
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: 'ai',
        content: '죄송해요, 현재 AI 응답 기능은 준비 중이에요.\n곧 연결될 예정이에요!',
      };
      setMessages((prev) => {
        const updated = [...prev, aiMsg];
        saveCurrentSession(updated);
        return updated;
      });
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = () => {
    setSessionId(Date.now());
    setMessages([GREETING]);
    setInput('');
    setSidebar(false);
  };

  const loadSession = (session: ChatSession) => {
    setSessionId(session.id);
    setMessages(session.messages);
    setSidebar(false);
  };

  return (
    <div className="flex flex-col h-screen bg-white">

      {/* 헤더 + 메시지 + 입력창 (사이드바 오버레이 범위) */}
      <div className="flex-1 flex flex-col relative min-h-0">

        {/* 사이드바 오버레이 */}
        {sidebarOpen && (
          <div className="absolute inset-0 z-40 flex">
            {/* 패널 */}
            <div className="w-4/5 bg-slate-900 h-full flex flex-col px-5 py-6">
              {/* 닫기 */}
              <button onClick={() => setSidebar(false)} className="mb-6 self-start">
                <Menu size={22} className="text-white" />
              </button>

              {/* 새 채팅 */}
              <button
                onClick={startNewChat}
                className="flex items-center gap-2 text-white mb-6"
              >
                <PlusCircle size={20} className="text-white" />
                <span className="text-sm font-semibold">새 채팅</span>
              </button>

              {/* 이전 대화 목록 */}
              {sessions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-3">채팅</p>
                  <div className="space-y-1 overflow-y-auto">
                    {sessions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => loadSession(s)}
                        className="w-full text-left text-sm text-slate-200 py-2 px-2 rounded-lg hover:bg-slate-800 transition-colors truncate"
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 배경 클릭 시 닫기 */}
            <div className="flex-1 bg-black/50" onClick={() => setSidebar(false)} />
          </div>
        )}

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0">
          <button onClick={() => setSidebar(true)}>
            <Menu size={24} className="text-gray-800" />
          </button>
          <span className="text-lg font-bold text-gray-900">AI 챗봇</span>
          <button onClick={onClose}>
            <X size={24} className="text-gray-800" />
          </button>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-3xl text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-sky-500 text-white rounded-br-sm'
                    : 'bg-gray-200 text-gray-900 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* 입력창 */}
        <div className="px-4 py-4 shrink-0">
          <div className="flex items-end gap-2 bg-gray-100 rounded-3xl px-4 py-2.5">
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="무엇이든 물어보세요"
              rows={1}
              className="flex-1 self-center bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none resize-none overflow-hidden leading-5"
              style={{ maxHeight: '120px' }}
            />
            <button
              onClick={handleSend}
              className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center shrink-0"
            >
              <ArrowRight size={16} className="text-white" />
            </button>
          </div>
        </div>

      </div>

      {/* 하단 탭 - 사이드바와 무관하게 항상 노출 */}
      <BottomNav activeNav={activeNav} onNavChange={onNavChange} />

    </div>
  );
}

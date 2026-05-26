'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Menu, ArrowRight, PlusCircle } from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import type { MainNavItem } from '@/components/main/BottomNav';
import { apiRequest } from '@/utils/apiClient';

interface Message {
  id: number;
  role: 'ai' | 'user';
  content: string;
}

interface SessionSummary {
  sessionId: number;
  title: string;
  status: string;
  createdAt: string;
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
  const [messages, setMessages]               = useState<Message[]>([GREETING]);
  const [input, setInput]                     = useState('');
  const [sidebarOpen, setSidebar]             = useState(false);
  const [sessions, setSessions]               = useState<SessionSummary[]>([]);
  const [currentSessionId, setCurrentSession] = useState<number | null>(null);
  const [isSending, setIsSending]             = useState(false);
  const bottomRef                             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = useCallback(async () => {
    try {
      const data = await apiRequest<{ content: SessionSummary[] }>('/ai/chat/sessions');
      setSessions(data.content ?? []);
    } catch {
      // sidebar just stays empty on failure
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const ensureSession = async (): Promise<number> => {
    if (currentSessionId !== null) return currentSessionId;
    const data = await apiRequest<{ sessionId: number; status: string }>('/ai/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    setCurrentSession(data.sessionId);
    return data.sessionId;
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const userMsg: Message = { id: Date.now(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    const ta = document.querySelector('textarea');
    if (ta) ta.style.height = 'auto';
    setIsSending(true);

    try {
      const sessionId = await ensureSession();
      const data = await apiRequest<{
        messageId: number;
        role: string;
        content: string;
        actionRequired: boolean;
      }>('/ai/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ sessionId, message: text }),
      });
      setMessages((prev) => [...prev, { id: data.messageId, role: 'ai', content: data.content }]);
      loadSessions();
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: 'ai', content: 'AI 응답 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = () => {
    setCurrentSession(null);
    setMessages([GREETING]);
    setInput('');
    setSidebar(false);
  };

  const loadSession = async (session: SessionSummary) => {
    setSidebar(false);
    setCurrentSession(session.sessionId);
    try {
      const data = await apiRequest<{
        content: Array<{ messageId: number; role: string; content: string }>;
      }>(`/ai/chat/sessions/messages?sessionId=${session.sessionId}`);
      const msgs: Message[] = (data.content ?? []).map((m) => ({
        id: m.messageId,
        role: m.role === 'USER' ? 'user' : 'ai',
        content: m.content,
      }));
      setMessages(msgs.length > 0 ? msgs : [GREETING]);
    } catch {
      setMessages([GREETING]);
    }
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
                        key={s.sessionId}
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
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-400 rounded-3xl rounded-bl-sm px-4 py-3 text-sm">
                ...
              </div>
            </div>
          )}
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
              disabled={isSending}
              className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
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

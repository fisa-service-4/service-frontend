'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {ArrowRight, Bot, Menu, PlusCircle, ReceiptText, Sparkles, Trash2, TrendingUp, X} from 'lucide-react';
import BottomNav from '@/components/main/BottomNav';
import PinKeypad from '@/components/PinKeypad';
import {apiRequest} from '@/utils/apiClient';

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

const GREETING_TEXT = {
    title: '무엇을 도와드릴까요?',
    description: '스마트한 금융 비서가 자산 분석부터 맞춤 투자 제안까지 실시간으로 안내해 드립니다.'
};

// 💡 사용자 경험(UX)을 높이는 금융 추천 질문 리스트
const QUICK_PROMPTS = [
    {
        icon: <ReceiptText size={16} className="text-blue-500"/>,
        label: '소비 분석',
        text: '지난달 지출 내역 요약해줘'
    },
    {
        icon: <TrendingUp size={16} className="text-emerald-500"/>,
        label: '자산 관리',
        text: '현재 내 소비습관 분석해줘'
    },
    {
        icon: <Sparkles size={16} className="text-purple-500"/>,
        label: '투자 정보',
        text: '현재 삼성전자 주가 알려줘'
    }
];

function parseCardContent(content: string): {
    header: string;
    items: { label: string; value: string }[];
    footer: string
} {
    const lines = content.split('\n');
    const header = lines[0] ?? '';
    const items: { label: string; value: string }[] = [];
    const extras: string[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('• ')) {
            const colonIdx = line.indexOf(': ');
            if (colonIdx !== -1) {
                items.push({label: line.slice(2, colonIdx), value: line.slice(colonIdx + 2)});
            }
        } else if (line.trim()) {
            extras.push(line.trim());
        }
    }

    return {header, items, footer: extras.join('\n')};
}

function AiCard({content}: { content: string }) {
    const isComplete = content.startsWith('✅');
    const {header, items, footer} = parseCardContent(content);

    return (
        <div className="max-w-[85%] bg-bg-card shadow-sm rounded-2xl overflow-hidden border border-gray-100">
            <div
                className={`px-4 py-3 font-bold text-gray-900 text-sm ${isComplete ? 'bg-primary-50 text-primary-900 border-b border-primary-100' : 'bg-gray-50 border-b border-gray-100'}`}>
                {header}
            </div>

            <div className="px-4 py-3 space-y-2.5 bg-bg-card">
                {items.map((item, i) => {
                    const isPlus = item.value.includes('+') || item.value.includes('수익') || item.value.includes('완료');
                    const isMinus = item.value.includes('-') || item.value.includes('손실');
                    let valueColor = isComplete ? 'text-primary-700' : 'text-gray-900';
                    if (isPlus) valueColor = 'text-success font-bold';
                    if (isMinus) valueColor = 'text-error font-bold';

                    return (
                        <div key={i} className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 text-xs font-medium">{item.label}</span>
                            <span className={`font-semibold ${valueColor}`}>{item.value}</span>
                        </div>
                    );
                })}
            </div>

            {footer && (
                <div className="px-4 py-2.5 text-xs text-gray-500 leading-relaxed bg-gray-50 border-t border-gray-100">
                    {footer}
                </div>
            )}
        </div>
    );
}

interface ChatBotViewProps {
    onClose: () => void;
}

export default function ChatBotView({onClose}: ChatBotViewProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sidebarOpen, setSidebar] = useState(false);
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [currentSessionId, setCurrentSession] = useState<number | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [requirePin, setRequirePin] = useState(false);
    const [pin, setPin] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages]);

    const loadSessions = useCallback(async () => {
        try {
            const data = await apiRequest<SessionSummary[]>('/ai/chat/sessions');
            const sessionList = Array.isArray(data) ? data : ((data as any).content || []);
            setSessions(sessionList);
        } catch {
            // silent fail
        }
    }, []);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    const ensureSession = async (firstMessage: string): Promise<number> => {
        if (currentSessionId !== null) return currentSessionId;
        const title = firstMessage.slice(0, 20);
        const data = await apiRequest<{ sessionId: number; status: string }>('/ai/chat/sessions', {
            method: 'POST',
            body: JSON.stringify({title}),
        });
        setCurrentSession(data.sessionId);
        return data.sessionId;
    };

    const sendMessageText = async (text: string) => {
        if (!text || isSending) return;

        const userMsg: Message = {id: Date.now(), role: 'user', content: text};
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        const ta = document.querySelector('textarea');
        if (ta) ta.style.height = 'auto';
        setIsSending(true);

        try {
            const sessionId = await ensureSession(text);
            const data = await apiRequest<{
                messageId: number;
                role: string;
                content: string;
                actionRequired: boolean;
                requirePin?: boolean;
            }>('/ai/chat/run', {
                method: 'POST',
                body: JSON.stringify({sessionId, message: text}),
            });
            setMessages((prev) => [...prev, {id: data.messageId, role: 'ai', content: data.content}]);

            if (data.requirePin || data.actionRequired) {
                setRequirePin(true);
                setPin('');
            }
            loadSessions();
        } catch {
            setMessages((prev) => [
                ...prev,
                {id: Date.now(), role: 'ai', content: 'AI 응답 생성에 실패했습니다. 잠시 후 다시 시도해주세요.'},
            ]);
        } finally {
            setIsSending(false);
        }
    };

    const handleSend = () => {
        sendMessageText(input.trim());
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            handleSend();
        }
    };

    const handlePinPress = async (value: string) => {
        if (isSending) return;

        if (value === 'backspace') {
            setPin((p) => p.slice(0, -1));
            return;
        }
        if (pin.length >= 6) return;

        const next = pin + value;
        setPin(next);
        if (next.length < 6) return;

        setIsSending(true);
        setTimeout(async () => {
            try {
                const sessionId = currentSessionId!;
                const data = await apiRequest<{
                    messageId: number;
                    role: string;
                    content: string;
                    actionRequired: boolean;
                    requirePin?: boolean;
                }>('/ai/chat/run', {
                    method: 'POST',
                    body: JSON.stringify({sessionId, message: next, isPin: true}),
                });
                setRequirePin(false);
                setPin('');
                setMessages((prev) => [...prev, {id: data.messageId, role: 'ai', content: data.content}]);
                if (data.requirePin || data.actionRequired) {
                    setRequirePin(true);
                    setPin('');
                }
            } catch {
                setRequirePin(false);
                setPin('');
                setMessages((prev) => [
                    ...prev,
                    {id: Date.now(), role: 'ai', content: 'PIN 확인 중 오류가 발생했습니다. 다시 시도해주세요.'},
                ]);
            } finally {
                setIsSending(false);
            }
        }, 200);
    };

    const startNewChat = () => {
        setCurrentSession(null);
        setMessages([]);
        setInput('');
        setRequirePin(false);
        setPin('');
        setSidebar(false);
    };

    const deleteSession = async (sessionId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await apiRequest(`/ai/chat/sessions/${sessionId}`, {method: 'DELETE'});
            setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
            if (currentSessionId === sessionId) {
                startNewChat();
            }
        } catch {
            // fallback
        }
    };

    const loadSession = async (session: SessionSummary) => {
        setSidebar(false);
        setCurrentSession(session.sessionId);
        try {
            const data = await apiRequest<any>(`/ai/chat/sessions/${session.sessionId}/messages`);
            const rawMessages = Array.isArray(data) ? data : (data.content || data.messages || []);

            const msgs: Message[] = rawMessages.map((m: any, i: number) => ({
                id: m.messageId || m.id || i,
                role: String(m.role).toUpperCase() === 'USER' ? 'user' : 'ai',
                content: m.content || m.message || '',
            }));

            setMessages(msgs);
        } catch {
            setMessages([]);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-bg">

            <div className="flex-1 flex flex-col relative min-h-0">

                {/* 사이드바 역사 내역 패널 오버레이 */}
                {sidebarOpen && (
                    <div className="absolute inset-0 z-50 flex">
                        <div className="w-4/5 bg-gray-900 h-full flex flex-col px-5 py-6 shadow-2xl">
                            <button onClick={() => setSidebar(false)}
                                    className="mb-6 self-start p-1 rounded-full hover:bg-gray-700 transition-colors">
                                <Menu size={22} className="text-gray-100"/>
                            </button>

                            <button
                                onClick={startNewChat}
                                className="flex items-center gap-2.5 text-white bg-primary-700 hover:bg-primary-900 rounded-xl px-4 py-3 mb-6 transition-colors shadow-sm font-medium text-sm"
                            >
                                <PlusCircle size={18} className="text-white"/>
                                <span>새로운 상담 시작</span>
                            </button>

                            {sessions.length > 0 && (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider px-2">최근
                                        상담 내역</p>
                                    <div className="space-y-1 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                                        {sessions.map((s) => {
                                            const isSelected = currentSessionId === s.sessionId;
                                            return (
                                                <div
                                                    key={s.sessionId}
                                                    className={`flex items-center justify-between group rounded-xl transition-all px-3 py-1 ${isSelected ? 'bg-gray-700 text-primary-300 font-medium' : 'hover:bg-gray-800 text-gray-200'}`}
                                                >
                                                    <button
                                                        onClick={() => loadSession(s)}
                                                        className="flex-1 text-left text-sm py-2 truncate mr-2"
                                                    >
                                                        {s.title || '이름 없는 대화'}
                                                    </button>
                                                    <button
                                                        onClick={(e) => deleteSession(s.sessionId, e)}
                                                        className="text-gray-500 hover:text-error p-1 md:opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-gray-700 shrink-0"
                                                    >
                                                        <Trash2 size={14}/>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 bg-black/40 backdrop-blur-xs" onClick={() => setSidebar(false)}/>
                    </div>
                )}

                {/* 상단 통합 GNB 헤더 바 */}
                <div
                    className="relative flex items-center justify-between px-5 py-3.5 bg-bg-card border-b border-gray-200 shrink-0 shadow-xs">
                    <button onClick={() => setSidebar(true)}
                            className="p-1 -ml-1 rounded-full hover:bg-gray-50 transition-colors">
                        <Menu size={22} className="text-gray-900"/>
                    </button>
                    <span
                        className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">AI 챗봇</span>
                    <button onClick={onClose} className="p-1 -mr-1 rounded-full hover:bg-gray-50 transition-colors">
                        <X size={22} className="text-gray-900"/>
                    </button>
                </div>

                {/* 대화 뷰어 스트림 및 중앙 안내 대시보드 처리 */}
                <div className="flex-1 overflow-y-auto bg-bg">
                    {messages.length === 0 ? (
                        /* 🌟 피드백 반영: 고성능 챗봇 대시보드 무드의 중앙 정렬 홈 화면 구조 */
                        <div className="h-full flex flex-col justify-between py-12 px-6">

                            {/* 상단 타이틀 및 로봇 그래픽 노출 */}
                            <div
                                className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                                <div
                                    className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-md shadow-primary-500/20 border border-primary-400 relative">
                                    <Bot size={32} strokeWidth={2}/>
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span
                                            className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                                    </span>
                                </div>
                                <h2 className="text-xl font-black text-gray-900 mb-3 tracking-tight">
                                    {GREETING_TEXT.title}
                                </h2>
                                <p className="text-sm text-gray-500 leading-relaxed font-normal">
                                    {GREETING_TEXT.description}
                                </p>
                            </div>

                            {/* 하단 추천 빠른 고정 템플릿 카드 룰렛 */}
                            <div className="w-full space-y-2.5 max-w-md mx-auto">
                                <p className="text-xs font-semibold text-gray-400 px-1 flex items-center gap-1.5 mb-1">
                                    <span>자주 묻는 금융 질문</span>
                                </p>
                                <div className="grid grid-cols-1 gap-2">
                                    {QUICK_PROMPTS.map((prompt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => sendMessageText(prompt.text)}
                                            className="flex items-center justify-between text-left p-3.5 bg-bg-card hover:bg-gray-50 border border-gray-100 rounded-xl transition-all shadow-xs group"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className="p-2 bg-gray-50 rounded-lg group-hover:bg-white transition-colors shrink-0">
                                                    {prompt.icon}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-gray-400 mb-0.5">{prompt.label}</p>
                                                    <p className="text-sm font-semibold text-gray-800 truncate">{prompt.text}</p>
                                                </div>
                                            </div>
                                            <ArrowRight size={14}
                                                        className="text-gray-300 group-hover:text-primary-500 transition-colors group-hover:translate-x-0.5 shrink-0"/>
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>
                    ) : (
                        /* 기존 대화가 시작되면 스크롤 메시지 스트림 활성화 */
                        <div className="px-4 py-4 space-y-4">
                            {messages.map((msg, index) => (
                                <div
                                    key={`${msg.id}-${index}`}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'ai' && (
                                        msg.content.startsWith('💰') || msg.content.startsWith('✅') ? (
                                            <AiCard content={msg.content}/>
                                        ) : (
                                            <div
                                                className="max-w-[78%] px-4 py-3 rounded-2xl rounded-tl-xs text-sm leading-relaxed whitespace-pre-line bg-bg-card text-gray-900 shadow-xs border border-gray-100">
                                                {msg.content}
                                            </div>
                                        )
                                    )}

                                    {msg.role === 'user' && (
                                        <div
                                            className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-xs text-sm leading-relaxed whitespace-pre-line bg-primary-500 text-white shadow-sm font-medium">
                                            {msg.content}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isSending && (
                                <div className="flex justify-start">
                                    <div
                                        className="bg-bg-card border border-gray-100 text-gray-400 rounded-2xl rounded-tl-xs px-5 py-3 text-sm font-black tracking-widest shadow-xs animate-pulse">
                                        · · ·
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef}/>
                        </div>
                    )}
                </div>

                {/* 보안 인증 핀넘버 키패드 서랍 */}
                {requirePin && (
                    <div
                        className="shrink-0 bg-bg-card border-t border-gray-200 px-5 pt-4 pb-4 shadow-xl rounded-t-3xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-8"/>
                            <p className="text-sm font-bold text-gray-900">안전한 거래를 위해 PIN을 확인합니다</p>
                            <button
                                onClick={() => {
                                    if (isSending) return;
                                    setRequirePin(false);
                                    setPin('');
                                    setMessages((prev) => [
                                        ...prev,
                                        {id: Date.now(), role: 'ai', content: '보안 인증 처리가 취소되었습니다.'},
                                    ]);
                                }}
                                disabled={isSending}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                            >
                                <X size={16} className="text-gray-500"/>
                            </button>
                        </div>
                        <div className="flex justify-center gap-4 mb-5">
                            {Array.from({length: 6}).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${i < pin.length ? 'bg-primary-500 scale-110 shadow-xs' : 'bg-gray-200'}`}
                                />
                            ))}
                        </div>
                        <PinKeypad onPress={handlePinPress}/>
                    </div>
                )}

                {/* 하단 유저 인풋 영역 패널 */}
                {!requirePin && (
                    <div className="px-4 py-3 shrink-0 bg-bg-card border-t border-gray-100">
                        <div
                            className="flex items-end gap-2.5 bg-gray-100 rounded-2xl px-4 py-2 transition-all focus-within:bg-bg-card focus-within:border-primary-300 border border-transparent">
                            <textarea
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="자산 현황이나 소비 내역에 대해 물어보세요"
                                rows={1}
                                className="flex-1 self-center bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none resize-none overflow-hidden leading-5 py-1.5"
                                style={{maxHeight: '100px'}}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isSending || !input.trim()}
                                className="w-8 h-8 bg-primary-500 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shrink-0 disabled:bg-gray-200 disabled:text-gray-400 disabled:opacity-100 transition-all shadow-xs mb-0.5"
                            >
                                <ArrowRight size={16} strokeWidth={2.5}/>
                            </button>
                        </div>
                    </div>
                )}

            </div>

            <BottomNav/>

        </div>
    );
}
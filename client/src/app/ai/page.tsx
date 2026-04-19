"use client"

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Play, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface Message {
    role: 'user' | 'ai';
    content: string;
    commands?: string[];
}

export default function AiPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

        // Read the token cookie to pass as query param (browser doesn't always send cookies on WS upgrade)
        const token = document.cookie.split('; ')
            .find(row => row.startsWith('token='))
            ?.split('=')[1] ?? '';

        const socket = new WebSocket(`${protocol}//${window.location.host}/ws/ai?token=${token}`);
        ws.current = socket;

        socket.onopen = () => {
            console.log('AI WebSocket connected');
        };

        socket.onerror = (err) => {
            console.error('AI WebSocket error', err);
        };

        socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'chunk') {
                updateLastAiMessage(msg.content);
            } else if (msg.type === 'done') {
                setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last && last.role === 'ai') {
                        return [...prev.slice(0, -1), { ...last, commands: msg.commands }];
                    }
                    return prev;
                });
                setLoading(false);
            } else if (msg.type === 'error') {
                console.error('AI auth error:', msg.message);
                setLoading(false);
            }
        };

        return () => socket.close();
    }, []);

    const updateLastAiMessage = (chunk: string) => {
        setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'ai') {
                return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
            }
            return [...prev, { role: 'ai', content: chunk }];
        });
    };

    const sendMessage = () => {
        if (!input.trim() || !ws.current) return;

        if (ws.current.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket is not open. Current state:', ws.current.readyState);
            // Optionally we could queue messages, but for now just showing a warning
            return;
        }

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        ws.current.send(JSON.stringify({ type: 'message', content: input }));
        setInput('');
        setLoading(true);
    };

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex flex-col h-screen bg-black">
            <header className="flex items-center p-4 border-b border-zinc-800">
                <Link href="/dashboard" className="mr-4">
                    <ChevronLeft className="h-6 w-6 text-zinc-500" />
                </Link>
                <h1 className="text-xl font-bold text-white">Rove AI</h1>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-4 ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-zinc-300'}`}>
                            <div className="flex items-center space-x-2 mb-2">
                                {m.role === 'ai' ? <Bot className="h-4 w-4 text-indigo-400" /> : <User className="h-4 w-4" />}
                                <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">{m.role}</span>
                            </div>
                            <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>

                            {m.commands && m.commands.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <div className="text-[10px] uppercase font-bold text-zinc-500">Suggested Commands</div>
                                    {m.commands.map((cmd, ci) => (
                                        <div key={ci} className="flex items-center justify-between bg-black/40 rounded-lg p-2 border border-zinc-800">
                                            <code className="text-[10px] text-indigo-300 truncate">{cmd}</code>
                                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-indigo-500/20">
                                                <Play className="h-3 w-3 text-indigo-500" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-zinc-900 rounded-2xl p-4 animate-pulse italic text-xs text-zinc-500">
                            AI is thinking...
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950">
                <div className="flex items-center space-x-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Ask AI to help..."
                        className="flex-1 bg-zinc-900 border-zinc-800"
                    />
                    <Button onClick={sendMessage} className="bg-indigo-600">
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

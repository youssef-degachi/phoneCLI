"use client"

import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { ChevronLeft, Plus, X, Maximize2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

interface SessionInfo {
    id: string;
    title?: string;
    createdAt: number;
    lastUsed: number;
    pid?: number;
}

export default function TerminalPage() {
    const { isAuthenticated } = useAuth();
    const [sessions, setSessions] = useState<SessionInfo[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSessions = useCallback(async () => {
        try {
            const res = await api.get<SessionInfo[]>('/terminals');
            setSessions(res.data);
            return res.data;
        } catch {
            return [];
        }
    }, []);

    const createSession = useCallback(async () => {
        try {
            const res = await api.post<SessionInfo>('/terminals', {});
            const list = await fetchSessions();
            const created = list.find((s) => s.id === res.data.id) ?? res.data;
            setActiveId(created.id);
            return created;
        } catch {
            return null;
        }
    }, [fetchSessions]);

    const closeSession = useCallback(async (id: string) => {
        try {
            await api.delete(`/terminals/${id}`);
        } catch {
            // ignore
        }
        const list = await fetchSessions();
        if (activeId === id) {
            setActiveId(list[0]?.id ?? null);
        }
    }, [activeId, fetchSessions]);

    // Bootstrap: load existing sessions; create a first one if none.
    useEffect(() => {
        if (!isAuthenticated) return;
        let cancelled = false;
        (async () => {
            const list = await fetchSessions();
            if (cancelled) return;
            if (list.length === 0) {
                const created = await createSession();
                if (created && !cancelled) setActiveId(created.id);
            } else {
                setActiveId(list[0].id);
            }
            if (!cancelled) setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [isAuthenticated, fetchSessions, createSession]);

    if (isAuthenticated === null || loading) return null;

    return (
        <div className="flex flex-col h-screen bg-black">
            <header className="flex items-center justify-between p-4 border-b border-zinc-800">
                <Link href="/dashboard" className="flex items-center text-zinc-400">
                    <ChevronLeft className="h-5 w-5" />
                    <span className="text-sm font-medium">Back</span>
                </Link>
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Terminals</span>
                <button className="text-zinc-600">
                    <Maximize2 className="h-5 w-5" />
                </button>
            </header>

            {/* Tabs */}
            <div className="flex items-center border-b border-zinc-800 bg-zinc-950 overflow-x-auto">
                {sessions.map((s, idx) => {
                    const isActive = s.id === activeId;
                    const label = s.title || `term ${idx + 1}`;
                    return (
                        <div
                            key={s.id}
                            className={`group flex items-center pl-3 pr-2 py-2 border-r border-zinc-800 cursor-pointer text-xs font-mono whitespace-nowrap ${
                                isActive ? 'bg-black text-white' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                            onClick={() => setActiveId(s.id)}
                        >
                            <span>{label}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeSession(s.id);
                                }}
                                className="ml-2 text-zinc-600 hover:text-red-400 opacity-60 group-hover:opacity-100"
                                aria-label="Close terminal"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    );
                })}
                <button
                    onClick={() => createSession()}
                    className="flex items-center px-3 py-2 text-zinc-500 hover:text-white"
                    aria-label="New terminal"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>

            {/* Panes — keep all xterm instances mounted but only the active one is visible.
                That way scrollback and runtime state survive tab switches. */}
            <div className="relative flex-1 overflow-hidden">
                {sessions.map((s) => (
                    <TerminalPane key={s.id} sessionId={s.id} active={s.id === activeId} />
                ))}
            </div>
        </div>
    );
}

interface PaneProps {
    sessionId: string;
    active: boolean;
}

function TerminalPane({ sessionId, active }: PaneProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const termRef = useRef<Terminal | null>(null);
    const fitRef = useRef<FitAddon | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // Mount xterm + connect once per session id.
    useEffect(() => {
        if (!containerRef.current) return;

        const term = new Terminal({
            cursorBlink: true,
            theme: { background: '#000000', foreground: '#ffffff' },
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            scrollback: 5000,
        });
        const fit = new FitAddon();
        term.loadAddon(fit);
        term.open(containerRef.current);
        termRef.current = term;
        fitRef.current = fit;

        const safeFit = () => {
            const el = containerRef.current;
            if (!el || el.clientWidth === 0 || el.clientHeight === 0) return;
            try { fit.fit(); } catch { /* layout still settling */ }
        };
        const rafId = requestAnimationFrame(safeFit);

        const resizeObserver = new ResizeObserver(() => safeFit());
        resizeObserver.observe(containerRef.current);

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const socket = new WebSocket(`${protocol}//${window.location.host}/ws/terminal/${sessionId}`);
        wsRef.current = socket;

        socket.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'output') term.write(msg.data);
                else if (msg.type === 'exit') term.writeln('\r\n\x1b[31m[session ended]\x1b[0m');
                else if (msg.type === 'error') term.writeln(`\r\n\x1b[31m${msg.message}\x1b[0m`);
            } catch {
                // ignore malformed
            }
        };

        const dataSub = term.onData((data) => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'input', data }));
            }
        });

        const handleResize = () => {
            safeFit();
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(rafId);
            resizeObserver.disconnect();
            window.removeEventListener('resize', handleResize);
            dataSub.dispose();
            try { socket.close(); } catch { /* ignore */ }
            try { term.dispose(); } catch { /* ignore */ }
            wsRef.current = null;
            termRef.current = null;
            fitRef.current = null;
        };
    }, [sessionId]);

    // Refit + focus when tab becomes active.
    useEffect(() => {
        if (!active) return;
        const id = requestAnimationFrame(() => {
            const fit = fitRef.current;
            const term = termRef.current;
            const el = containerRef.current;
            if (!fit || !term || !el) return;
            if (el.clientWidth === 0 || el.clientHeight === 0) return;
            try { fit.fit(); } catch { /* ignore */ }
            try { term.focus(); } catch { /* ignore */ }
            const ws = wsRef.current;
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
            }
        });
        return () => cancelAnimationFrame(id);
    }, [active]);

    return (
        <div
            ref={containerRef}
            aria-hidden={!active}
            className={`absolute inset-0 p-2 bg-black ${active ? 'visible' : 'invisible pointer-events-none'}`}
        />
    );
}

"use client"

import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Maximize2 } from 'lucide-react';
import Link from 'next/link';

export default function TerminalPage() {
    const terminalRef = useRef<HTMLDivElement>(null);
    const termInstance = useRef<Terminal | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const [sessionId] = useState(`term-${Math.random().toString(36).substr(2, 9)}`);

    useEffect(() => {
        if (!terminalRef.current) return;

        const term = new Terminal({
            cursorBlink: true,
            theme: {
                background: '#000000',
                foreground: '#ffffff',
            },
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();
        termInstance.current = term;

        // Connect to WebSocket
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const socket = new WebSocket(`${protocol}//${window.location.host}/ws/terminal/${sessionId}`);
        ws.current = socket;

        socket.onopen = () => {
            term.writeln('\x1b[32mConnected to Rove PTY session\x1b[0m');
        };

        socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'output') {
                term.write(msg.data);
            }
        };

        term.onData((data) => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'input', data }));
            }
        });

        const handleResize = () => {
            fitAddon.fit();
            socket.send(JSON.stringify({
                type: 'resize',
                cols: term.cols,
                rows: term.rows
            }));
        };

        window.addEventListener('resize', handleResize);

        return () => {
            term.dispose();
            socket.close();
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="flex flex-col h-screen bg-black">
            <header className="flex items-center justify-between p-4 border-b border-zinc-800">
                <Link href="/dashboard" className="flex items-center text-zinc-400">
                    <ChevronLeft className="h-5 w-5" />
                    <span className="text-sm font-medium">Back</span>
                </Link>
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Main Terminal</span>
                <button className="text-zinc-600">
                    <Maximize2 className="h-5 w-5" />
                </button>
            </header>
            <div className="flex-1 p-2 bg-black overflow-hidden" ref={terminalRef} />
        </div>
    );
}

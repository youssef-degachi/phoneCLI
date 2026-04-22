'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Monitor,
    Maximize2,
    Settings,
    Keyboard as KeyboardIcon,
    LayoutGrid,
    Zap,
    Wifi,
    RefreshCw,
    MousePointer2
} from 'lucide-react';
import api from '@/lib/api';
import { RemoteKeyboard } from '@/components/RemoteKeyboard';
import { AppSwitcher } from '@/components/AppSwitcher';

interface WindowInfo {
    id: string;
    title: string;
}

export default function RemoteScreenPage() {
    const router = useRouter();
    const [mode, setMode] = useState<'polling' | 'live'>('polling');
    const [monitor, setMonitor] = useState(0);
    const [fps, setFps] = useState(10);
    const [quality, setQuality] = useState(50);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [isAppsOpen, setIsAppsOpen] = useState(false);
    const [windows, setWindows] = useState<WindowInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewOnly, setViewOnly] = useState(false);
    const [isWayland, setIsWayland] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const ws = useRef<WebSocket | null>(null);

    // Monitor dimensions (constants for now, but in production we'd fetch these)
    const PC_MONITOR_WIDTH = 2240;
    const PC_MONITOR_HEIGHT = 1080;

    // Load preferences
    useEffect(() => {
        const savedMode = localStorage.getItem('rove_screen_mode') as 'polling' | 'live';
        const savedFps = localStorage.getItem('rove_screen_fps');
        if (savedMode) setMode(savedMode);
        if (savedFps) setFps(Number(savedFps));
    }, []);

    // Polling Mode: Fetch image every N seconds
    useEffect(() => {
        if (mode !== 'polling') return;

        const fetchImage = async () => {
            const timestamp = new Date().getTime();
            setImageUrl(`/api/system/screen/capture?monitor=${monitor}&q=${quality}&t=${timestamp}`);
            setLoading(false);
        };

        fetchImage();
        const interval = setInterval(fetchImage, mode === 'polling' ? 5000 : 1000);
        return () => clearInterval(interval);
    }, [mode, monitor, quality]);

    // Live Mode: WebSocket Stream
    useEffect(() => {
        if (mode !== 'live') {
            if (ws.current) ws.current.close();
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Read token from cookie
        const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] ?? '';

        const socket = new WebSocket(`${protocol}//${window.location.host}/api/system/screen/live?monitor=${monitor}&fps=${fps}&quality=3&token=${token}`);
        ws.current = socket;
        socket.binaryType = 'arraybuffer';

        socket.onmessage = (event) => {
            const blob = new Blob([event.data], { type: 'image/jpeg' });
            const url = URL.createObjectURL(blob);
            setImageUrl(url);
            setLoading(false);
            // Cleanup previous URL to avoid memory leak
            return () => URL.revokeObjectURL(url);
        };

        return () => socket.close();
    }, [mode, monitor, fps]);

    const handleInteract = async (type: string, x?: number, y?: number, extra?: any) => {
        if (viewOnly && (type === 'click' || type === 'doubleclick' || type === 'rightclick' || type === 'type' || type === 'key')) return;
        try {
            await api.post('/system/screen/interact', { type, x: x ?? 0, y: y ?? 0, monitor, ...extra });
        } catch (err) {
            console.error('Interaction error:', err);
        }
    };

    const handleScreenTouch = async (e: React.MouseEvent | React.TouchEvent) => {
        if (viewOnly) return;
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        const relX = (clientX - rect.left) / rect.width;
        const relY = (clientY - rect.top) / rect.height;

        const pcX = Math.round(relX * PC_MONITOR_WIDTH);
        const pcY = Math.round(relY * PC_MONITOR_HEIGHT);

        handleInteract('click', pcX, pcY);
    };

    const fetchWindows = async () => {
        try {
            const res = await api.get('/system/screen/windows');
            setWindows(res.data);
            setIsAppsOpen(true);
        } catch (err) {
            console.error('Failed to fetch windows:', err);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black overflow-hidden select-none touch-none">
            {/* Top Bar */}
            <div className="flex items-center justify-between p-4 bg-neutral-900 border-b border-white/5 z-10 shrink-0">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-white/5 active:scale-95 transition-all">
                    <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setMonitor(m => m === 0 ? 1 : 0)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-xs font-medium border border-white/10"
                    >
                        <Monitor className="w-4 h-4 text-brand-500" />
                        <span>Mon {monitor + 1}</span>
                    </button>

                    <button
                        onClick={() => {
                            const newMode = mode === 'polling' ? 'live' : 'polling';
                            setMode(newMode);
                            localStorage.setItem('rove_screen_mode', newMode);
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${mode === 'live' ? 'bg-orange-500/10 border-orange-500/50 text-orange-500' : 'bg-blue-500/10 border-blue-500/50 text-blue-500'
                            }`}
                    >
                        {mode === 'live' ? <Zap className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                        <span className="capitalize">{mode}</span>
                    </button>
                </div>

                <button className="p-2 rounded-full hover:bg-white/5">
                    <Settings className="w-5 h-5 text-white/50" />
                </button>
            </div>

            {/* Main Screen Stream Area */}
            <div className="flex-1 relative flex items-center justify-center bg-neutral-950 overflow-hidden">
                <div
                    ref={containerRef}
                    className={`relative max-w-full max-h-full aspect-[2240/1080] group ${viewOnly ? 'cursor-default' : 'cursor-none'}`}
                    onMouseDown={handleScreenTouch}
                >
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/50 z-20">
                            <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
                            <p className="text-white/50 text-sm">Initializing Stream...</p>
                        </div>
                    )}

                    {imageUrl && (
                        <img
                            src={imageUrl}
                            alt="Remote PC Screen"
                            className="w-full h-full object-contain pointer-events-none"
                        />
                    )}

                    {/* Wayland Overlay Warning */}
                    {(isWayland) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/40 backdrop-blur-sm z-10">
                            <Monitor className="w-12 h-12 text-white/20 mb-4" />
                            <h3 className="text-white font-medium mb-2">Screen Capture Restricted</h3>
                            <p className="text-white/40 text-xs max-w-xs leading-relaxed">
                                You are on Wayland. For security, GNOME blocks screen capture via CLI.
                                <br /><br />
                                <b>Required:</b> Switch to <b>GNOME on Xorg</b> at the login screen to see your desktop.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* View/Interact Toggle */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur border border-white/10 rounded-full z-20">
                <span className={`text-xs ${viewOnly ? 'text-white' : 'text-white/30'}`}>View</span>
                <button
                    onClick={() => setViewOnly(!viewOnly)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${viewOnly ? 'bg-zinc-700' : 'bg-brand-500'}`}
                >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${viewOnly ? 'left-1' : 'left-6'}`} />
                </button>
                <span className={`text-xs ${!viewOnly ? 'text-white' : 'text-white/30'}`}>Interact</span>
            </div>

            {/* Bottom Controls */}
            <div className="p-4 bg-neutral-900 border-t border-white/5 grid grid-cols-3 gap-2 shrink-0 z-10">
                <button
                    onClick={() => setIsKeyboardOpen(!isKeyboardOpen)}
                    className="flex flex-col items-center justify-center gap-1 p-3 bg-white/5 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-white/70"
                >
                    <KeyboardIcon className="w-6 h-6" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Keyboard</span>
                </button>

                <button
                    onClick={fetchWindows}
                    className="flex flex-col items-center justify-center gap-1 p-3 bg-white/5 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-brand-500"
                >
                    <LayoutGrid className="w-6 h-6" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Apps</span>
                </button>

                <button
                    onClick={() => handleInteract('rightclick')}
                    className="flex flex-col items-center justify-center gap-1 p-3 bg-white/5 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-white/70"
                >
                    <MousePointer2 className="w-6 h-6" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Right Click</span>
                </button>
            </div>

            {/* Modals */}
            {isKeyboardOpen && (
                <RemoteKeyboard
                    onKeyPress={(key) => handleInteract('key', 0, 0, { key })}
                    onType={(text) => handleInteract('type', 0, 0, { text })}
                    onClose={() => setIsKeyboardOpen(false)}
                />
            )}
            {isAppsOpen && (
                <AppSwitcher
                    windows={windows}
                    onFocus={(id) => handleInteract('mousemove', 0, 0, { windowId: id })}
                    onClose={() => setIsAppsOpen(false)}
                />
            )}
        </div>
    );
}

'use client';

import React from 'react';
import { X, LayoutGrid, Monitor } from 'lucide-react';

interface WindowInfo {
    id: string;
    title: string;
}

interface AppSwitcherProps {
    windows: WindowInfo[];
    onFocus: (id: string) => void;
    onClose: () => void;
}

export function AppSwitcher({ windows, onFocus, onClose }: AppSwitcherProps) {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-white/70">
                        <LayoutGrid className="w-5 h-5" />
                        <span className="font-semibold text-lg">App Switcher</span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {windows.length === 0 ? (
                        <div className="text-center py-10 text-white/30 italic">No open windows found</div>
                    ) : (
                        windows.map((win) => (
                            <button
                                key={win.id}
                                onClick={() => {
                                    onFocus(win.id);
                                    onClose();
                                }}
                                className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all group flex items-start gap-3"
                            >
                                <div className="p-2 bg-brand-500/10 rounded-lg group-hover:bg-brand-500/20 transition-colors">
                                    <Monitor className="w-5 h-5 text-brand-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white truncate">{win.title}</div>
                                    <div className="text-xs text-white/40 mt-0.5">ID: {win.id}</div>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                <div className="p-4 text-center text-xs text-white/30 border-t border-white/10">
                    Tap a window to bring it to front
                </div>
            </div>
        </div>
    );
}

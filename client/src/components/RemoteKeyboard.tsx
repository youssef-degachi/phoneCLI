'use client';

import React from 'react';
import { X, Delete, Type, ChevronUp, ChevronLeft, ChevronRight, ChevronDown, Command } from 'lucide-react';

interface RemoteKeyboardProps {
    onKeyPress: (key: string) => void;
    onType: (text: string) => void;
    onClose: () => void;
}

export function RemoteKeyboard({ onKeyPress, onType, onClose }: RemoteKeyboardProps) {
    const [inputText, setInputText] = React.useState('');

    const specialKeys = [
        { label: 'Esc', value: 'Escape' },
        { label: 'Tab', value: 'Tab' },
        { label: 'Ctrl', value: 'Control_L' },
        { label: 'Alt', value: 'Alt_L' },
        { label: 'AltGr', value: 'ISO_Level3_Shift' },
        { label: 'Win', value: 'Super_L' },
        { label: 'Ech', value: 'Escape' }, // User specifically asked for "Ech" (assuming Escape)
    ];

    const handleSendText = () => {
        if (inputText) {
            onType(inputText);
            setInputText('');
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-white/10 p-4 z-50 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-white/50">Remote Keyboard</span>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Special Keys Row */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                {specialKeys.map((key) => (
                    <button
                        key={key.label}
                        onClick={() => onKeyPress(key.value)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs font-mono whitespace-nowrap"
                    >
                        {key.label}
                    </button>
                ))}
            </div>

            {/* Arrows & Navigation */}
            <div className="grid grid-cols-3 gap-2 mb-4 w-fit mx-auto">
                <div />
                <button onClick={() => onKeyPress('Up')} className="p-2 bg-white/5 rounded flex justify-center"><ChevronUp className="w-4 h-4" /></button>
                <div />
                <button onClick={() => onKeyPress('Left')} className="p-2 bg-white/5 rounded flex justify-center"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => onKeyPress('Down')} className="p-2 bg-white/5 rounded flex justify-center"><ChevronDown className="w-4 h-4" /></button>
                <button onClick={() => onKeyPress('Right')} className="p-2 bg-white/5 rounded flex justify-center"><ChevronRight className="w-4 h-4" /></button>
            </div>

            {/* Main Input */}
            <div className="flex gap-2">
                <input
                    autoFocus
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendText();
                    }}
                    placeholder="Type here..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-brand-500 transition-colors"
                />
                <button
                    onClick={handleSendText}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <Type className="w-4 h-4" />
                    <span>Send</span>
                </button>
            </div>
        </div>
    );
}

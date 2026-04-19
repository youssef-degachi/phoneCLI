"use client"

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Folder, File, ChevronRight, ChevronLeft, Home } from 'lucide-react';
import Link from 'next/link';

export default function FilesPage() {
    const [currentPath, setCurrentPath] = useState('.');
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFiles(currentPath);
    }, [currentPath]);

    const fetchFiles = async (path: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/files/tree?path=${encodeURIComponent(path)}`);
            setFiles(res.data.tree);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const goUp = () => {
        const parts = currentPath.split('/');
        if (parts.length > 1) {
            setCurrentPath(parts.slice(0, -1).join('/'));
        } else if (currentPath !== '.') {
            setCurrentPath('.');
        }
    };

    return (
        <div className="min-h-screen bg-black text-zinc-400 p-6 pb-24">
            <header className="flex items-center space-x-4 mb-8">
                <Link href="/dashboard">
                    <ChevronLeft className="h-6 w-6 text-zinc-500" />
                </Link>
                <h1 className="text-xl font-bold text-white">Files</h1>
            </header>

            <div className="flex items-center space-x-2 text-xs font-mono bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 mb-6 overflow-x-auto whitespace-nowrap">
                <Home className="h-3 w-3" onClick={() => setCurrentPath('.')} />
                <span className="text-zinc-600">/</span>
                <span>{currentPath}</span>
            </div>

            <div className="space-y-2">
                {currentPath !== '.' && (
                    <button
                        onClick={goUp}
                        className="w-full flex items-center space-x-3 p-4 rounded-xl border border-zinc-900 bg-zinc-950 text-indigo-500"
                    >
                        <Folder className="h-5 w-5" />
                        <span className="text-sm font-medium">..</span>
                    </button>
                )}

                {files.map((file) => (
                    <button
                        key={file.path}
                        onClick={() => file.type === 'directory' ? setCurrentPath(file.path) : null}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-900 bg-zinc-950 active:bg-zinc-900 transition-colors"
                    >
                        <div className="flex items-center space-x-3">
                            {file.type === 'directory' ? <Folder className="h-5 w-5 text-indigo-400" /> : <File className="h-5 w-5 text-zinc-500" />}
                            <div className="text-left">
                                <div className="text-sm font-medium text-white truncate max-w-[200px]">{file.name}</div>
                                {file.size && <div className="text-[10px] text-zinc-600">{Math.round(file.size / 1024)} KB</div>}
                            </div>
                        </div>
                        {file.type === 'directory' && <ChevronRight className="h-4 w-4 text-zinc-700" />}
                    </button>
                ))}

                {loading && <div className="text-center py-12 text-zinc-600 animate-pulse">Loading files...</div>}
            </div>
        </div>
    );
}

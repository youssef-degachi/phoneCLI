"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ChevronLeft, Globe, Copy, Trash2, ExternalLink, Check, Loader2 } from 'lucide-react';

interface HostTunnel {
    id: string;
    port: number;
    url: string;
    status: 'starting' | 'running' | 'error' | 'stopped';
    error?: string;
    startedAt: number;
}

export default function RunHostPage() {
    const { isAuthenticated } = useAuth();
    const [tunnels, setTunnels] = useState<HostTunnel[]>([]);
    const [port, setPort] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchTunnels = async () => {
        try {
            const res = await api.get('/tunnel/hosts');
            setTunnels(res.data);
        } catch {
            // ignored
        }
    };

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchTunnels();
        const interval = setInterval(fetchTunnels, 1500);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const portNum = Number(port);
        if (!portNum || portNum < 1 || portNum > 65535) {
            setError('Enter a valid port (1–65535)');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/tunnel/hosts', { port: portNum });
            setPort('');
            fetchTunnels();
        } catch (err: any) {
            setError(err?.response?.data?.error?.message ?? 'Failed to start tunnel');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStop = async (id: string) => {
        try {
            await api.delete(`/tunnel/hosts/${id}`);
            fetchTunnels();
        } catch {
            // ignored
        }
    };

    const handleCopy = async (id: string, url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopiedId(id);
            setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
        } catch {
            // ignored
        }
    };

    if (isAuthenticated === null) return null;

    return (
        <div className="min-h-screen bg-black text-zinc-300 p-6 pb-28">
            <header className="flex items-center space-x-4 mb-6">
                <Link href="/dashboard">
                    <ChevronLeft className="h-6 w-6 text-zinc-500" />
                </Link>
                <div>
                    <h1 className="text-lg font-bold uppercase tracking-widest text-white">Run Host</h1>
                    <p className="text-xs text-zinc-500">Expose a local port via Cloudflare quick tunnel.</p>
                </div>
            </header>

            <Card className="border-zinc-800 bg-zinc-900/40 p-4 mb-6">
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="text-[11px] uppercase font-bold tracking-widest text-zinc-500">Port</label>
                        <Input
                            type="number"
                            inputMode="numeric"
                            placeholder="e.g. 3000"
                            min={1}
                            max={65535}
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            className="bg-black border-zinc-800 mt-1"
                            required
                        />
                    </div>
                    {error && <p className="text-xs text-red-400">{error}</p>}
                    <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? (
                            <span className="inline-flex items-center"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Starting…</span>
                        ) : (
                            <span className="inline-flex items-center"><Globe className="h-4 w-4 mr-2" /> Start Tunnel</span>
                        )}
                    </Button>
                </form>
            </Card>

            <div className="space-y-3">
                <h2 className="text-[11px] uppercase font-bold tracking-widest text-zinc-500">Active Tunnels</h2>
                {tunnels.length === 0 && (
                    <p className="text-sm text-zinc-600 italic">No tunnels yet. Start one above.</p>
                )}
                {tunnels.map((t) => (
                    <Card key={t.id} className="border-zinc-800 bg-zinc-900/40 p-4">
                        <div className="flex items-start justify-between mb-2">
                            <div className="min-w-0">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-mono text-white">localhost:{t.port}</span>
                                    <StatusBadge status={t.status} />
                                </div>
                            </div>
                            <button
                                onClick={() => handleStop(t.id)}
                                className="text-zinc-500 hover:text-red-400 transition-colors p-1 -m-1"
                                aria-label="Stop tunnel"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>

                        {t.status === 'starting' && !t.url && (
                            <p className="text-xs text-zinc-500 inline-flex items-center"><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Provisioning URL…</p>
                        )}

                        {t.url && (
                            <div className="flex items-center space-x-2">
                                <a
                                    href={t.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 min-w-0 text-xs font-mono text-indigo-400 truncate hover:underline"
                                >
                                    {t.url}
                                </a>
                                <button
                                    onClick={() => handleCopy(t.id, t.url)}
                                    className="text-zinc-400 hover:text-white p-1 -m-1"
                                    aria-label="Copy URL"
                                >
                                    {copiedId === t.id ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                                </button>
                                <a
                                    href={t.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-zinc-400 hover:text-white p-1 -m-1"
                                    aria-label="Open URL"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </div>
                        )}

                        {t.status === 'error' && t.error && (
                            <p className="text-xs text-red-400 mt-1">{t.error}</p>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: HostTunnel['status'] }) {
    const styles: Record<HostTunnel['status'], string> = {
        starting: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
        running: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
        error: 'bg-red-900/40 text-red-300 border-red-700/50',
        stopped: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    };
    return (
        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${styles[status]}`}>
            {status}
        </span>
    );
}

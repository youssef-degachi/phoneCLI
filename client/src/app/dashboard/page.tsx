"use client"

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { Terminal, Settings, Layout, Search, Activity, Cpu, HardDrive, Globe } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const { isAuthenticated } = useAuth();
    const [projects, setProjects] = useState([]);
    const [tunnel, setTunnel] = useState({ alive: false, url: '' });
    const [stats, setStats] = useState({ cpuLoad: 0, memoryUsage: 0, uptime: 0 });

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
            const interval = setInterval(fetchData, 3000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    const fetchData = async () => {
        try {
            const [projRes, tunRes, statsRes] = await Promise.all([
                api.get('/projects'),
                api.get('/tunnel/status'),
                api.get('/system/stats')
            ]);
            setProjects(projRes.data);
            setTunnel(tunRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error('Fetch error:', err);
        }
    };

    if (isAuthenticated === null) return null;

    return (
        <div className="min-h-screen bg-black text-zinc-400">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-zinc-800 bg-black/80 backdrop-blur">
                <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold text-white">Rove</h1>
                    <div className="flex items-center space-x-2">
                        <div className={`h-2 w-2 rounded-full ${tunnel.alive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                        <span className="text-xs font-medium uppercase tracking-wider">{tunnel.alive ? 'Online' : 'Offline'}</span>
                    </div>
                </div>
            </header>

            <main className="p-6 space-y-8 pb-24">
                {/* Status Quick Look */}
                <section className="grid grid-cols-2 gap-4">
                    <Card className="border-zinc-800 bg-zinc-900/50">
                        <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
                            <Cpu className="h-5 w-5 text-indigo-500" />
                            <div className="text-2xl font-bold text-white">{stats.cpuLoad}%</div>
                            <div className="text-[10px] uppercase tracking-tighter">CPU Load</div>
                        </CardContent>
                    </Card>
                    <Card className="border-zinc-800 bg-zinc-900/50">
                        <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
                            <HardDrive className="h-5 w-5 text-emerald-500" />
                            <div className="text-2xl font-bold text-white">{stats.memoryUsage}%</div>
                            <div className="text-[10px] uppercase tracking-tighter">RAM Usage</div>
                        </CardContent>
                    </Card>
                </section>

                {/* Projects */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">Active Projects</h2>
                        <div className="flex items-center space-x-1 text-[10px] text-zinc-600">
                            <Activity className="h-3 w-3" />
                            <span>{projects.filter((p: any) => p.status === 'running').length} RUNNING</span>
                        </div>
                    </div>
                    <div className="grid gap-4">
                        {projects.map((project: any) => (
                            <Link key={project.id} href={`/projects/${project.id}`}>
                                <Card className="border-zinc-800 bg-zinc-900/50 active:bg-zinc-900 transition-colors">
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-white text-lg">{project.name}</CardTitle>
                                            <div className={`h-2.5 w-2.5 rounded-full ${project.status === 'running' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-zinc-700'}`} />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 flex items-center justify-between">
                                        <p className="text-xs text-zinc-500 font-mono">localhost:{project.devPort}</p>
                                        <span className="text-[10px] uppercase font-bold text-zinc-600">{project.status}</span>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                        {projects.length === 0 && (
                            <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl">
                                <p className="text-zinc-600 italic">No projects configured</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-black/95 p-4 z-50">
                <div className="flex items-center justify-around">
                    <Link href="/dashboard" className="flex flex-col items-center space-y-1 text-indigo-500">
                        <Layout className="h-6 w-6" />
                        <span className="text-[10px] uppercase font-bold">Menu</span>
                    </Link>
                    <Link href="/terminal" className="flex flex-col items-center space-y-1 hover:text-white transition-colors">
                        <Terminal className="h-6 w-6" />
                        <span className="text-[10px] uppercase font-bold">Term</span>
                    </Link>
                    <Link href="/run-host" className="flex flex-col items-center space-y-1 hover:text-white transition-colors">
                        <Globe className="h-6 w-6" />
                        <span className="text-[10px] uppercase font-bold">Run Host</span>
                    </Link>
                    {/* Hidden for now — uncomment to re-enable AI assistant nav */}
                    {/* <Link href="/ai" className="flex flex-col items-center space-y-1 hover:text-white transition-colors">
                        <BotIcon className="h-6 w-6" />
                        <span className="text-[10px] uppercase font-bold">AI</span>
                    </Link> */}
                    {/* Hidden for now — uncomment to re-enable Files nav */}
                    {/* <Link href="/files" className="flex flex-col items-center space-y-1 hover:text-white transition-colors">
                        <Search className="h-6 w-6" />
                        <span className="text-[10px] uppercase font-bold">Files</span>
                    </Link> */}
                    <Link href="/settings" className="flex flex-col items-center space-y-1 hover:text-white transition-colors">
                        <Settings className="h-6 w-6" />
                        <span className="text-[10px] uppercase font-bold">Config</span>
                    </Link>
                </div>
            </nav>
        </div>
    );
}

function BotIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
        </svg>
    );
}
